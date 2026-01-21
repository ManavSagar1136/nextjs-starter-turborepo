/* eslint-disable  @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";

import { convertToPrismaPopulate } from "./populate-prisma";
import { APP_ROLES } from "@buildbase/database";

/**
 * Supported filter operations
 * Operations marked with * need special handling
 */
export const SUPPORTED_FILTER_OPERATIONS = [
  // Standard operations
  "$eq",
  "$ne",
  "$in",
  "$notIn",
  "$gt",
  "$gte",
  "$lt",
  "$lte",
  "$regex",
  "$contains",
  "$startsWith",
  "$endsWith",
  // Special operations (handled by handleSpecialOperations)
  "$isNull",
  "$isNotNull",
  "$isEmpty", // * Needs type detection
  "$has", // Array operation
  "$hasEvery", // * Array operation - needs array parsing
  "$hasSome", // * Array operation - needs array parsing
] as const;

/**
 * Operations that need special handling
 */
const SPECIAL_OPERATIONS = ["$isNull", "$isNotNull", "$isEmpty", "$has", "$hasEvery", "$hasSome"] as const;

interface PaginatedResult<T> {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
  groups?: any[];
}

/**
 * Paginate using MongoDB native queries (for JSON field filtering)
 * mongoFilter should already be converted to MongoDB $expr format
 */
async function paginateWithMongoFilter<T>(
  model: any,
  where: any,
  mongoFilter: Record<string, any>,
  query: any,
  skip: number,
  limit: number,
  page: number,
  groupByConfig?: {
    field: string;
    aggregate?: (group: any[]) => any;
  },
  searchParams?: URLSearchParams
): Promise<PaginatedResult<T>> {
  // mongoFilter is already in MongoDB $expr format, use it directly
  const combinedFilter = mongoFilter || {};

  // Build sort
  const sort: Record<string, number> = {};
  if (query.orderBy) {
    for (const [field, direction] of Object.entries(query.orderBy)) {
      sort[field] = direction === "desc" ? -1 : 1;
    }
  } else {
    sort.createdAt = -1; // Default sort
  }

  // Get IDs using findRaw
  const rawResults = await model.findRaw({
    filter: combinedFilter,
    options: {
      skip,
      limit,
      sort,
    },
  });

  // Extract IDs and convert MongoDB $oid format to strings for Prisma
  const assetIds = (Array.isArray(rawResults) ? rawResults : []).map((doc: any) => {
    const id = doc._id;
    // Handle MongoDB extended JSON format: { $oid: "..." }
    if (id && typeof id === "object" && id.$oid) {
      return id.$oid;
    }
    // Handle direct string or ObjectId
    if (typeof id === "string") {
      return id;
    }
    // Fallback: try toString() if it's an ObjectId object
    return id?.toString?.() || id;
  });

  // Get count using aggregateRaw
  const countResult = await model.aggregateRaw({
    pipeline: [{ $match: combinedFilter }, { $count: "total" }],
  });
  const totalDocs = (Array.isArray(countResult) ? countResult : [])[0]?.total || 0;

  // Fetch full documents with relations
  let data: any[] = [];
  if (assetIds.length > 0) {
    const fetchQuery: any = {
      where: { id: { in: assetIds } },
    };

    // Preserve include/select from original query
    if (query.include) fetchQuery.include = query.include;
    if (query.select) fetchQuery.select = query.select;

    data = await model.findMany(fetchQuery);

    // Maintain order from findRaw
    const dataMap = new Map(data.map(item => [item.id, item]));
    data = assetIds.map(id => dataMap.get(id)).filter(item => item !== undefined);
  }

  const totalPages = Math.ceil(totalDocs / limit);

  // Handle grouping if needed
  let groups;
  if (groupByConfig && searchParams?.get("groupBy") === groupByConfig.field) {
    const groupMap = new Map<any, any[]>();
    data.forEach((item: any) => {
      const groupKey = groupByConfig.field.split(".").reduce((obj, key) => obj?.[key], item);
      const mapKey = groupKey === null || groupKey === undefined ? "__null__" : String(groupKey);
      if (!groupMap.has(mapKey)) {
        groupMap.set(mapKey, []);
      }
      groupMap.get(mapKey)!.push(item);
    });
    groups = Array.from(groupMap.entries()).map(([key, items]) => {
      if (groupByConfig.aggregate) {
        return groupByConfig.aggregate(items);
      }
      return {
        [groupByConfig.field]: key === "__null__" ? null : key,
        items,
        count: items.length,
      };
    });
  }

  return {
    docs: data,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter: skip + 1,
    hasPrevPage: page > 1,
    hasNextPage: page < totalPages,
    prevPage: page > 1 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
    groups,
  };
}

export async function paginatePrisma<T>(
  request: NextRequest,
  model: any,
  extraFilter: Record<string, any>,
  populateFields?: Record<string, any>,
  groupByConfig?: {
    field: string; // Field to group by (e.g., "batchId")
    aggregate?: (group: any[]) => any; // Optional custom aggregation logic
  },
  options?: {
    useInclude?: boolean; // If true, use include (additive), if false use select (exclusive). Default: auto-detect
    mongoFilter?: Record<string, any>; // MongoDB native filter for JSON fields (MongoDB only)
  }
): Promise<PaginatedResult<T>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    // Support for disabling pagination to get unlimited results
    const paginationDisabled = searchParams.get("pagination") === "false";
    const page = paginationDisabled ? 1 : parseInt(searchParams.get("$page") || "1", 10);
    const limit = paginationDisabled ? Number.MAX_SAFE_INTEGER : parseInt(searchParams.get("$limit") || "10", 10);

    // Parse sorting - support both new format (sort[fieldName]=-1|1) and legacy format (sortBy/sortOrder)
    const orderBy = parseSorting(searchParams);

    const populate = Object.fromEntries(searchParams.entries());
    const include = convertToPrismaPopulate(populate);
    let where: any = {};

    const dynamicFilters = parseDynamicFilters(searchParams) ?? {};

    if (Object.keys(dynamicFilters).length > 0) {
      where = {
        ...dynamicFilters,
      };
    }

    if (Object.keys(extraFilter ?? {}).length > 0) {
      where = {
        ...where,
        ...extraFilter,
      };
    }

    const skip = (page - 1) * limit;

    // [add filter for user-role] if calling api and user-id should match with loggedIn user's ID, to prevent user from accessing other user's data
    if ((request as any).userData?.role === APP_ROLES.USER && !(request as any).orgAccess) {
      where = {
        ...where,
        userId: (request as any).userData?.id,
      };
    }

    // Detect mode: check if populateFields contains scalar fields or nested include/select objects
    const hasScalarFields = populateFields
      ? Object.values(populateFields).some(value => typeof value === "boolean")
      : false;

    const hasNestedIncludes = populateFields
      ? Object.values(populateFields).some(
          value => typeof value === "object" && value !== null && ("include" in value || "select" in value)
        )
      : false;

    // Determine which mode to use
    // If populateFields contains scalar fields, MUST use select mode (include only accepts relations)
    // If only relation fields with nested select/include, can use include mode
    const useIncludeMode =
      options?.useInclude !== undefined ? options.useInclude : hasNestedIncludes && !hasScalarFields; // Auto-detect: use include only if no scalar fields

    // Build query
    const query: any = {
      where,
      take: limit,
      skip,
      orderBy,
    };

    // Add relations/fields based on mode
    if (Object.keys(populateFields ?? {}).length > 0) {
      if (useIncludeMode) {
        // Include mode (additive): return all fields + specified relations
        query.include = {
          ...(populateFields || {}),
          ...(Object.keys(include).length > 0 ? include : {}),
        };
      } else {
        // Select mode (exclusive): return only specified fields
        query.select = {
          ...(Object.keys(populateFields ?? {}).length > 0
            ? populateFields
            : Object.fromEntries(Object.keys(model.fields).map(key => [key, true]))),
          ...(Object.keys(include).length > 0 ? include : {}),
        };
      }
    } else if (Object.keys(include).length > 0) {
      // Only query params includes, use include mode
      query.include = Object.keys(include).length > 0 ? include : {};
    }

    // Use MongoDB native queries if mongoFilter is provided
    if (options?.mongoFilter && Object.keys(options.mongoFilter).length > 0) {
      return await paginateWithMongoFilter(
        model,
        where,
        options.mongoFilter,
        query,
        skip,
        limit,
        page,
        groupByConfig,
        searchParams
      );
    }

    // logger.info("*** query", JSON.stringify(query, null, 2));
    const [data, totalDocs] = await Promise.all([model.findMany(query), model.count({ where })]);

    const totalPages = Math.ceil(totalDocs / limit);

    const shouldGroup = groupByConfig && searchParams.get("groupBy") === groupByConfig.field;

    let groups;
    if (shouldGroup && groupByConfig) {
      const groupMap = new Map<any, any[]>();

      // Group data by the specified field
      data.forEach((item: any) => {
        // Support nested fields (e.g., "integration.platform")
        const groupKey = groupByConfig.field.split(".").reduce((obj, key) => obj?.[key], item);

        // Convert groupKey to string for Map key (handles all types consistently)
        const mapKey =
          groupKey === null || groupKey === undefined
            ? "__null__" // Handle null/undefined explicitly
            : String(groupKey);

        if (!groupMap.has(mapKey)) {
          groupMap.set(mapKey, []);
        }
        groupMap.get(mapKey)!.push(item);
      });

      // Apply custom aggregation if provided
      groups = Array.from(groupMap.entries()).map(([key, items]) => {
        if (groupByConfig.aggregate) {
          return groupByConfig.aggregate(items);
        }
        // Default aggregation
        return {
          [groupByConfig.field]: key === "__null__" ? null : key,
          items,
          count: items.length,
        };
      });
    }

    return {
      docs: data,
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter: skip + 1,
      hasPrevPage: page > 1,
      hasNextPage: page < totalPages,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
      groups,
    };
  } catch (e) {
    // Safely extract error information to avoid source map issues
    const errorInfo =
      e instanceof Error
        ? {
            name: e.name,
            message: e.message,
            stack: e.stack,
          }
        : String(e);

    // logger.error({
    //   tag: logTags.API,
    //   msg: `Error in paginatePrisma`,
    //   error: errorInfo,
    // });
    return {
      docs: [],
      totalDocs: 0,
      limit: 0,
      totalPages: 0,
      page: 0,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
  }
}

/**
 * Parse sorting from query parameters
 * Supports:
 * 1. New format: sort[fieldName]=-1|1 (from frontend table sorting)
 * 2. Legacy format: sortBy=fieldName&sortOrder=asc|desc
 * 3. Multiple sort fields (array format)
 */
function parseSorting(searchParams: URLSearchParams): any {
  const sortFields: Array<{ [key: string]: "asc" | "desc" }> = [];

  // Parse new format: sort[fieldName]=-1|1
  const sortMap = new Map<string, "asc" | "desc">();
  for (const [key, value] of searchParams.entries()) {
    const sortMatch = key.match(/^sort\[([^\]]+)\]$/);
    if (sortMatch) {
      const fieldName = sortMatch[1] || "";
      // -1 means descending, 1 means ascending, 0 means no sort (skip)
      const sortValue = parseInt(value, 10);
      if (sortValue === -1) {
        sortMap.set(fieldName, "desc");
      } else if (sortValue === 1) {
        sortMap.set(fieldName, "asc");
      }
      // If sortValue is 0, we skip it (no sorting for that field)
    }
  }

  // Convert map to array of sort objects
  if (sortMap.size > 0) {
    // Sort by insertion order (maintain priority)
    for (const [fieldName, direction] of sortMap.entries()) {
      sortFields.push({ [fieldName]: direction });
    }
  }

  // Fallback to legacy format: sortBy/sortOrder
  if (sortFields.length === 0) {
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    sortFields.push({ [sortBy]: sortOrder });
  }

  // Return single object for single sort, array for multiple sorts
  if (sortFields.length === 0) {
    // Default sort
    return { createdAt: "desc" };
  } else if (sortFields.length === 1) {
    return sortFields[0];
  } else {
    // Multiple sorts - Prisma supports array format
    return sortFields;
  }
}

/**
 * Builds and returns an ordered array of condition objects from a map.
 *
 * Each entry in the input Map represents a set of field filters for a condition. This function:
 *   - Sorts the conditions by their numeric index, preserving intended order (such as for Prisma 'AND'/'OR').
 *   - Iterates through each condition object, removing any fields that are empty objects or have no valid operation/value.
 *   - Skips conditions that, after cleaning, have no valid fields left.
 *   - Returns a filtered array of only meaningful (non-empty) condition objects.
 *
 * @param indexMap - Map where the key is a numeric index and the value is an object with filter fields.
 * @returns Array of cleaned condition objects, ready for use in Prisma query filters.
 */
const buildConditionsFromIndexMap = (indexMap: Map<number, any>): any[] => {
  const conditions: any[] = [];

  if (indexMap.size === 0) {
    return conditions;
  }

  const sortedIndices = Array.from(indexMap.keys()).sort((a, b) => a - b);

  for (const index of sortedIndices) {
    const condition = indexMap.get(index);
    const cleanedCondition: any = {};

    for (const [field, value] of Object.entries(condition)) {
      const isPlainObject = typeof value === "object" && value !== null && !Array.isArray(value);

      // If value is undefined or null , skip it
      if (value === undefined || value === null) continue;

      // If value is a plain object and is empty, skip it
      if (isPlainObject && Object.keys(value).length === 0) continue;

      cleanedCondition[field] = value;
    }

    // Add only if at least one field remains
    if (Object.keys(cleanedCondition).length > 0) {
      conditions.push(cleanedCondition);
    }
  }

  return conditions;
};

/**
 * Recursively removes any empty objects or undefined values in a filter object.
 *
 * This utility repairs incoming filters where some keys may resolve to empty objects,
 * which can cause Prisma to throw errors (e.g., { gte: {}, lte: {} }).
 * - For arrays, it cleans each item and removes wholly undefined or empty results.
 * - For plain objects, it cleans every value recursively, omitting keys with undefined or empty object values.
 * - For primitives (string, number, etc.), it simply returns the value as-is.
 * - Returns undefined if the object is fully stripped and empty.
 *
 * @param obj - The object or value to clean.
 * @returns The cleaned object/value, or undefined if nothing valid remains.
 */
function cleanupEmptyObjects(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (Array.isArray(obj)) {
    const cleaned = obj.map(item => cleanupEmptyObjects(item)).filter(item => item !== undefined);

    return cleaned.length > 0 ? cleaned : undefined;
  }

  // Preserve Date objects (they have no enumerable properties so would be treated as empty)
  if (obj instanceof Date) {
    return obj;
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    let hasAnyValue = false;

    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanupEmptyObjects(value);
      if (cleanedValue !== undefined) {
        // Avoid keeping empty objects (but preserve Date objects)
        if (
          typeof cleanedValue === "object" &&
          !Array.isArray(cleanedValue) &&
          !(cleanedValue instanceof Date) &&
          Object.keys(cleanedValue).length === 0
        ) {
          continue;
        }
        cleaned[key] = cleanedValue;
        hasAnyValue = true;
      }
    }

    return hasAnyValue ? cleaned : undefined;
  }

  return obj;
}

/**
 * Converts a flat object with dot-notation keys to nested Prisma where clause
 * Example: { "user.email": { contains: "test" } }
 * Becomes: { user: { email: { contains: "test" } } }
 */
function convertNestedFields(filterObj: any): any {
  if (!filterObj || typeof filterObj !== "object") {
    return filterObj;
  }

  const result: any = {};

  for (const [key, value] of Object.entries(filterObj)) {
    if (key.includes(".")) {
      // Split by dot and create nested structure
      const parts = key.split(".") as string[];
      let current = result;

      // Create nested structure for all parts except the last
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i] as string]) {
          current[parts[i] as string] = {};
        }
        current = current[parts[i] as string];
      }

      // Set the last part with the value
      current[parts[parts.length - 1] as string] =
        value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)
          ? convertNestedFields(value)
          : value;
    } else {
      // Regular field - recursively process value if it's an object
      result[key] =
        value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)
          ? convertNestedFields(value)
          : value;
    }
  }

  return result;
}

/**
 * Handles special Prisma operations that need custom formatting
 * Returns the value to be assigned to the field, or undefined to use default handling
 * @param operation - The operation (e.g., "$isNull", "$isEmpty")
 * @param value - The value as a string
 */
function handleSpecialOperations(operation: string, value: string): any {
  // Handle null checks - Prisma uses null, not { isNull: true }
  if (operation === "$isNull") {
    // $isNull: true means field is null
    // $isNull: false means field is not null
    const isNull = value.toLowerCase() === "true" || value === "true";
    return isNull ? null : { not: null };
  }

  if (operation === "$isNotNull") {
    // $isNotNull: true means field is not null
    // Always return { not: null } regardless of value
    return { not: null };
  }

  // Handle $isEmpty - Prisma uses isEmpty for arrays, equals "" for strings
  // We'll use isEmpty as default (works for arrays)
  if (operation === "$isEmpty") {
    const isEmpty = value.toLowerCase() === "true" || value === "true";
    return isEmpty ? { isEmpty: true } : { isEmpty: false };
  }

  // Handle array operations that need array parsing
  if (operation === "$hasEvery" || operation === "$hasSome") {
    // These need arrays, parse comma-separated values
    if (value.includes(",")) {
      return value.split(",").map(v => parseFilterValue(v.trim(), operation));
    } else {
      return [parseFilterValue(value, operation)];
    }
  }

  // Handle $has - single value for array contains
  if (operation === "$has") {
    return parseFilterValue(value, "$eq");
  }

  // For other operations, return undefined to use default handling
  return undefined;
}

function parseDynamicFilters(searchParams: URLSearchParams): any {
  const filters: any = {};

  // Check for OR/AND conditions first (e.g., filter[OR][0][field][$gte]=value)
  const orIndexMap = new Map<number, any>();
  const andIndexMap = new Map<number, any>();

  // Track regex fields that need mode handling
  const regexModeMap = new Map<string, boolean>(); // field -> hasInsensitiveMode

  for (const [key, value] of searchParams.entries()) {
    // Track mode parameter for regex fields (frontend sends mode as separate param)
    if (key.match(/^filter\[([^\]]+)\]\[mode\]$/)) {
      const fieldMatch = key.match(/^filter\[([^\]]+)\]\[mode\]$/);
      if (fieldMatch && value === "insensitive") {
        regexModeMap.set(fieldMatch[1] || "", true);
      }
    }

    if (key.startsWith("filter[")) {
      // Check for OR condition: filter[OR][index][field][operation]=value
      const orMatch = key.match(/^filter\[OR\]\[(\d+)\](.+)$/);
      if (orMatch) {
        const [, indexStr, rest] = orMatch;
        const index = parseInt(indexStr || "0", 10);

        if (!orIndexMap.has(index)) {
          orIndexMap.set(index, {});
        }

        // Parse field and operation from filter key
        const fieldMatch = rest && rest.match(/^\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?(?:\[([^\]]+)\])?$/);
        if (fieldMatch) {
          const [, field, operation, subOperation] = fieldMatch as any;

          if (!orIndexMap.get(index)?.[field]) {
            orIndexMap.get(index)[field] = {};
          }

          if (operation === "$in") {
            if (!orIndexMap.get(index)[field]["in"]) {
              orIndexMap.get(index)[field]["in"] = [];
            }
            // Handle comma-separated values
            if (value.includes(",")) {
              value.split(",").forEach(v => {
                orIndexMap.get(index)[field]["in"].push(parseFilterValue(v.trim(), operation));
              });
            } else {
              orIndexMap.get(index)[field]["in"].push(parseFilterValue(value, operation));
            }
          } else if (operation === "$notIn") {
            if (!orIndexMap.get(index)[field]["notIn"]) {
              orIndexMap.get(index)[field]["notIn"] = [];
            }
            // Handle comma-separated values
            if (value.includes(",")) {
              value.split(",").forEach(v => {
                orIndexMap.get(index)[field]["notIn"].push(parseFilterValue(v.trim(), operation));
              });
            } else {
              orIndexMap.get(index)[field]["notIn"].push(parseFilterValue(value, operation));
            }
          } else if (operation === "$regex") {
            // Check if mode is set via subOperation or separate parameter
            const hasInsensitiveMode =
              subOperation === "$options" || searchParams.get(`filter[OR][${index}][${field}][mode]`) === "insensitive";

            orIndexMap.get(index)[field] = {
              contains: value,
              ...(hasInsensitiveMode && { mode: "insensitive" }),
            };
          } else if (SPECIAL_OPERATIONS.includes(operation as any)) {
            // Handle special operations
            const specialResult = handleSpecialOperations(operation, value);
            if (specialResult !== undefined) {
              orIndexMap.get(index)[field] = specialResult;
            } else {
              // Fallback to default handling
              orIndexMap.get(index)[field][operation.replace("$", "")] = parseFilterValue(value, operation);
            }
          } else if (operation) {
            // Process operation - always allow through for backward compatibility
            // Unknown operations are still processed (non-breaking)
            const parsedValue = parseFilterValue(value, operation);
            // Only add if value is not undefined
            if (parsedValue !== undefined) {
              orIndexMap.get(index)[field][operation.replace("$", "")] = parsedValue;
            }
          } else {
            const parsedValue = parseFilterValue(value, "default");
            // Only add if value is not undefined
            if (parsedValue !== undefined) {
              orIndexMap.get(index)[field] = parsedValue;
            }
          }
        }
        continue;
      }

      // Check for AND condition: filter[AND][index][field][operation]=value
      const andMatch = key && key.match(/^filter\[AND\]\[(\d+)\](.+)$/);
      if (andMatch) {
        const [, indexStr, rest] = andMatch;
        const index = parseInt(indexStr || "0", 10);

        if (!andIndexMap.has(index)) {
          andIndexMap.set(index, {});
        }

        // Parse field and operation from filter key
        const fieldMatch = rest && rest.match(/^\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?(?:\[([^\]]+)\])?$/);
        if (fieldMatch) {
          const [, field, operation, subOperation] = fieldMatch as any;

          if (!andIndexMap.get(index)?.[field]) {
            andIndexMap.get(index)[field] = {};
          }

          if (operation === "$in") {
            if (!andIndexMap.get(index)[field]["in"]) {
              andIndexMap.get(index)[field]["in"] = [];
            }
            // Handle comma-separated values
            if (value.includes(",")) {
              value.split(",").forEach(v => {
                andIndexMap.get(index)[field]["in"].push(parseFilterValue(v.trim(), operation));
              });
            } else {
              andIndexMap.get(index)[field]["in"].push(parseFilterValue(value, operation));
            }
          } else if (operation === "$notIn") {
            if (!andIndexMap.get(index)[field]["notIn"]) {
              andIndexMap.get(index)[field]["notIn"] = [];
            }
            // Handle comma-separated values
            if (value.includes(",")) {
              value.split(",").forEach(v => {
                andIndexMap.get(index)[field]["notIn"].push(parseFilterValue(v.trim(), operation));
              });
            } else {
              andIndexMap.get(index)[field]["notIn"].push(parseFilterValue(value, operation));
            }
          } else if (operation === "$regex") {
            // Check if mode is set via subOperation or separate parameter
            const hasInsensitiveMode =
              subOperation === "$options" ||
              searchParams.get(`filter[AND][${index}][${field}][mode]`) === "insensitive";

            andIndexMap.get(index)[field] = {
              contains: value,
              ...(hasInsensitiveMode && { mode: "insensitive" }),
            };
          } else if (SPECIAL_OPERATIONS.includes(operation as any)) {
            // Handle special operations
            const specialResult = handleSpecialOperations(operation, value);
            if (specialResult !== undefined) {
              andIndexMap.get(index)[field] = specialResult;
            } else {
              andIndexMap.get(index)[field][operation.replace("$", "")] = parseFilterValue(value, operation);
            }
          } else if (operation) {
            // Process operation - always allow through for backward compatibility
            // Unknown operations are still processed (non-breaking)
            const parsedValue = parseFilterValue(value, operation);
            // Only add if value is not undefined
            if (parsedValue !== undefined) {
              andIndexMap.get(index)[field][operation.replace("$", "")] = parsedValue;
            }
          } else {
            const parsedValue = parseFilterValue(value, "default");
            // Only add if value is not undefined
            if (parsedValue !== undefined) {
              andIndexMap.get(index)[field] = parsedValue;
            }
          }
        }
        continue;
      }

      // Regular field filters: filter[field][operation]=value
      // Parse field and operation from filter key
      const match = key.match(/filter\[([^\]]+)\](?:\[([^\]]+)\])?(?:\[([^\]]+)\])?(?:\[([^\]]+)\])?/);
      if (match) {
        const [, field, operation, subOperation] = match as any;

        if (!filters[field]) {
          filters[field] = {};
        }

        if (operation === "$in") {
          if (!filters[field]["in"]) {
            filters[field]["in"] = [];
          }
          // Handle comma-separated values
          if (value.includes(",")) {
            value.split(",").forEach(v => {
              filters[field]["in"].push(parseFilterValue(v.trim(), operation));
            });
          } else {
            filters[field]["in"].push(parseFilterValue(value, operation));
          }
        } else if (operation === "$notIn") {
          if (!filters[field]["notIn"]) {
            filters[field]["notIn"] = [];
          }
          // Handle comma-separated values
          if (value.includes(",")) {
            value.split(",").forEach(v => {
              filters[field]["notIn"].push(parseFilterValue(v.trim(), operation));
            });
          } else {
            filters[field]["notIn"].push(parseFilterValue(value, operation));
          }
        } else if (operation === "$regex") {
          // Check if mode is set via subOperation or separate parameter
          const hasInsensitiveMode =
            subOperation === "$options" ||
            regexModeMap.get(field) === true ||
            searchParams.get(`filter[${field}][mode]`) === "insensitive";

          filters[field] = {
            contains: value,
            ...(hasInsensitiveMode && { mode: "insensitive" }),
          };
        } else if (SPECIAL_OPERATIONS.includes(operation as any)) {
          // Handle special operations
          const specialResult = handleSpecialOperations(operation, value);
          if (specialResult !== undefined) {
            filters[field] = specialResult;
          } else {
            filters[field][operation.replace("$", "")] = parseFilterValue(value, operation);
          }
        } else if (operation) {
          // Process operation - always allow through for backward compatibility
          // Unknown operations are still processed (non-breaking)
          const parsedValue = parseFilterValue(value, operation);
          // Only add if value is not undefined
          if (parsedValue !== undefined) {
            filters[field][operation.replace("$", "")] = parsedValue;
          }
        } else {
          const parsedValue = parseFilterValue(value, "default");
          // Only add if value is not undefined
          if (parsedValue !== undefined) {
            filters[field] = parsedValue;
          }
        }
      }
    }
  }

  // Build OR array from index map and clean up empty field objects
  const orConditions = buildConditionsFromIndexMap(orIndexMap);
  if (orConditions.length > 0) {
    filters.OR = orConditions;
  }

  // Build AND array from index map and clean up empty field objects
  const andConditions = buildConditionsFromIndexMap(andIndexMap);
  if (andConditions.length > 0) {
    filters.AND = andConditions;
  }

  // Convert boolean $in filters to equals (Prisma doesn't support $in for boolean fields)
  for (const field in filters) {
    if (filters[field] && filters[field]["in"] && Array.isArray(filters[field]["in"])) {
      const inValues = filters[field]["in"];
      // Check if all values are booleans
      const allBooleans = inValues.every(v => typeof v === "boolean");

      if (allBooleans) {
        if (inValues.length === 1) {
          // Single boolean value: convert to equals
          filters[field] = { equals: inValues[0] };
        } else {
          // Multiple boolean values (both true and false): remove filter to show all
          // Since a boolean can only be true or false, filtering by both means "show all"
          delete filters[field];
        }
      }
    }
  }

  // Convert nested fields (dot notation) to Prisma nested where clauses
  // This handles fields like "user.email" -> { user: { email: ... } }
  const convertedFilters = convertNestedFields(filters);

  // Also convert nested fields in OR/AND conditions
  if (convertedFilters.OR && Array.isArray(convertedFilters.OR)) {
    convertedFilters.OR = convertedFilters.OR.map((condition: any) => convertNestedFields(condition));
  }

  if (convertedFilters.AND && Array.isArray(convertedFilters.AND)) {
    convertedFilters.AND = convertedFilters.AND.map((condition: any) => convertNestedFields(condition));
  }

  // Clean up empty objects and undefined values to prevent Prisma errors
  const cleaned = cleanupEmptyObjects(convertedFilters);
  // Return empty object instead of undefined when no filters are present
  // Prisma requires {} (not undefined) to mean "no filters, return all records"
  return cleaned ?? {};
}

function parseFilterValue(value: string, operation: string): any {
  // Handle exceptions, the undefined values will be handled by cleanupEmptyObjects function
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  switch (operation) {
    case "$in":
    case "$notIn":
    case "$hasEvery":
    case "$hasSome":
    case "$has":
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
      if (!isNaN(Number(value))) return Number(value);
      return value;
    case "$eq":
    case "$ne":
    case "$contains":
    case "$startsWith":
    case "$endsWith":
      return value;
    case "$gt":
    case "$gte":
    case "$lt":
    case "$lte":
      // Only parse as date if it looks like a date string (ISO format or contains date separators)
      // This prevents numbers like "123" from being parsed as dates
      if (
        value.match(/^\d{4}-\d{2}-\d{2}/) ||
        value.includes("T") ||
        value.includes("/") ||
        value.match(/^\d{4}-\d{2}-\d{2}T/)
      ) {
        const parsed = Date.parse(value);
        if (!isNaN(parsed)) {
          return new Date(parsed);
        }
      }
      // Fall back to number parsing
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        return numValue;
      }
      // If it's not a valid date or number, return undefined
      return undefined;
    default:
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
      if (!isNaN(Number(value))) return Number(value);
      return value;
  }
}
