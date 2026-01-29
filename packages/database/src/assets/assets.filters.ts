/**
 * Asset filter builders for Prisma queries
 * These functions build where clauses and MongoDB-specific filters
 */

export interface AssetFilterOptions {
  folderId?: string | null;
  folderPath?: string;
  tagIds?: string[];
  tagSlugs?: string[];
  search?: string;
  contentType?: string | string[];
  isPublic?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  exactWidth?: number;
  exactHeight?: number;
  allowedAspectRatios?: string[];
}

/**
 * Build Prisma where clause for asset filtering
 * @param workspaceId - Optional workspace ID. If not provided, doesn't filter by workspace (admin context)
 * @param filters - Filter options
 */
export function buildAssetFilter(
  workspaceId: string | undefined,
  filters?: AssetFilterOptions
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (workspaceId !== undefined) {
    where.workspaceId = workspaceId;
  }

  // Folder filtering
  if (filters?.folderId !== undefined) {
    where.folderId = filters.folderId;
  }

  // Build search OR conditions
  const searchOrConditions: Record<string, unknown>[] = [];
  if (filters?.search) {
    const searchTerm = filters.search.trim();
    if (searchTerm) {
      searchOrConditions.push(
        {
          filename: {
            contains: searchTerm,
            mode: "insensitive" as const,
          },
        },
        {
          assetTags: {
            some: {
              tag: {
                name: {
                  contains: searchTerm,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        },
        {
          folder: {
            name: {
              contains: searchTerm,
              mode: "insensitive" as const,
            },
          },
        }
      );
    }
  }

  // Build contentType conditions
  const buildContentTypeCondition = (contentType: string): Record<string, unknown> => {
    if (contentType.endsWith("/*")) {
      const prefix = contentType.slice(0, -2);
      return {
        contentType: {
          startsWith: prefix,
          mode: "insensitive" as const,
        },
      };
    }
    return { contentType };
  };

  const contentTypeConditions: Record<string, unknown>[] = [];
  if (filters?.contentType) {
    const contentTypes = Array.isArray(filters.contentType)
      ? filters.contentType
      : filters.contentType
          .split(",")
          .map(type => type.trim())
          .filter(Boolean);

    if (contentTypes.length === 1) {
      const condition = buildContentTypeCondition(contentTypes[0]);
      where.contentType = condition.contentType;
    } else if (contentTypes.length > 1) {
      contentTypeConditions.push(...contentTypes.map(buildContentTypeCondition));
    }
  }

  // Combine conditions
  const hasSearchConditions = searchOrConditions.length > 0;
  const hasContentTypeConditions = contentTypeConditions.length > 0;

  if (hasSearchConditions && hasContentTypeConditions) {
    where.AND = [{ OR: searchOrConditions }, { OR: contentTypeConditions }];
  } else if (hasSearchConditions) {
    where.OR = searchOrConditions;
  } else if (hasContentTypeConditions) {
    where.OR = contentTypeConditions;
  }

  if (filters?.isPublic !== undefined) {
    where.isPublic = filters.isPublic;
  }

  // Tag filtering
  if (filters?.tagIds && filters.tagIds.length > 0) {
    where.assetTags = {
      some: {
        tagId: { in: filters.tagIds },
      },
    };
  }

  return where;
}

/**
 * Build MongoDB native filter for metadata dimension filtering
 */
export function buildMongoMetadataFilter(filters?: {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  exactWidth?: number;
  exactHeight?: number;
  allowedAspectRatios?: string[];
}): Record<string, unknown> | null {
  const mongoFilter: Record<string, unknown> = {};

  if (filters?.exactWidth !== undefined) {
    mongoFilter["metadata.width"] = filters.exactWidth;
  } else {
    const widthFilter: Record<string, number> = {};
    if (filters?.minWidth !== undefined) widthFilter.$gte = filters.minWidth;
    if (filters?.maxWidth !== undefined) widthFilter.$lte = filters.maxWidth;
    if (Object.keys(widthFilter).length > 0) {
      mongoFilter["metadata.width"] = widthFilter;
    }
  }

  if (filters?.exactHeight !== undefined) {
    mongoFilter["metadata.height"] = filters.exactHeight;
  } else {
    const heightFilter: Record<string, number> = {};
    if (filters?.minHeight !== undefined) heightFilter.$gte = filters.minHeight;
    if (filters?.maxHeight !== undefined) heightFilter.$lte = filters.maxHeight;
    if (Object.keys(heightFilter).length > 0) {
      mongoFilter["metadata.height"] = heightFilter;
    }
  }

  if (filters?.allowedAspectRatios && filters.allowedAspectRatios.length > 0) {
    const aspectRatioValues: number[] = [];
    for (const ratioStr of filters.allowedAspectRatios) {
      const [widthStr, heightStr] = ratioStr.split(":");
      if (widthStr && heightStr) {
        const ratioWidth = Number.parseFloat(widthStr);
        const ratioHeight = Number.parseFloat(heightStr);
        if (!Number.isNaN(ratioWidth) && !Number.isNaN(ratioHeight) && ratioWidth > 0 && ratioHeight > 0) {
          aspectRatioValues.push(ratioWidth / ratioHeight);
        }
      }
    }
    if (aspectRatioValues.length > 0) {
      mongoFilter.$or = aspectRatioValues.map(targetRatio => ({
        "metadata.aspectRatio": {
          $gte: targetRatio - 0.01,
          $lte: targetRatio + 0.01,
        },
      }));
    }
  }

  return Object.keys(mongoFilter).length > 0 ? mongoFilter : null;
}

/**
 * Convert Prisma where clause to MongoDB $expr filter
 */
export function convertWhereToMongoExpr(
  where: Record<string, unknown>,
  metadataFilter?: Record<string, unknown> | null
): Record<string, unknown> | null {
  const exprConditions: Record<string, unknown>[] = [];

  // Handle workspaceId with $toObjectId
  if (where.workspaceId && typeof where.workspaceId === "string" && /^[0-9a-fA-F]{24}$/.test(where.workspaceId)) {
    exprConditions.push({
      $eq: ["$workspaceId", { $toObjectId: where.workspaceId }],
    });
  }

  // Handle other ObjectId fields
  if (where.userId && typeof where.userId === "string" && /^[0-9a-fA-F]{24}$/.test(where.userId)) {
    exprConditions.push({
      $eq: ["$userId", { $toObjectId: where.userId }],
    });
  }

  if (where.folderId && typeof where.folderId === "string" && /^[0-9a-fA-F]{24}$/.test(where.folderId)) {
    exprConditions.push({
      $eq: ["$folderId", { $toObjectId: where.folderId }],
    });
  }

  // Handle direct contentType
  if (where.contentType && !where.OR) {
    if (typeof where.contentType === "string") {
      exprConditions.push({
        $eq: ["$contentType", where.contentType],
      });
    } else if (
      typeof where.contentType === "object" &&
      where.contentType !== null &&
      "startsWith" in where.contentType
    ) {
      exprConditions.push({
        $regexMatch: {
          input: "$contentType",
          regex: `^${(where.contentType as Record<string, string>).startsWith}`,
          options: "i",
        },
      });
    }
  }

  if (where.isPublic !== undefined) {
    exprConditions.push({
      $eq: ["$isPublic", where.isPublic],
    });
  }

  // Handle metadata JSON filters
  if (metadataFilter) {
    for (const [field, condition] of Object.entries(metadataFilter)) {
      if (field === "$or") {
        const aspectRatioOrConditions: Record<string, unknown>[] = [];
        if (Array.isArray(condition)) {
          for (const aspectRatioCondition of condition as Record<string, unknown>[]) {
            if (aspectRatioCondition["metadata.aspectRatio"]) {
              const arCond = aspectRatioCondition["metadata.aspectRatio"] as {
                $gte?: number;
                $lte?: number;
              };
              if (arCond.$gte !== undefined && arCond.$lte !== undefined) {
                aspectRatioOrConditions.push({
                  $and: [
                    { $gte: ["$metadata.aspectRatio", arCond.$gte] },
                    { $lte: ["$metadata.aspectRatio", arCond.$lte] },
                  ],
                });
              }
            }
          }
        }
        if (aspectRatioOrConditions.length > 0) {
          exprConditions.push({ $or: aspectRatioOrConditions });
        }
      } else {
        const cond = condition as { $gte?: number; $lte?: number } | number;
        if (typeof cond === "object") {
          if (cond.$gte !== undefined) {
            exprConditions.push({ $gte: [`$${field}`, cond.$gte] });
          }
          if (cond.$lte !== undefined) {
            exprConditions.push({ $lte: [`$${field}`, cond.$lte] });
          }
        } else if (typeof cond === "number") {
          exprConditions.push({ $eq: [`$${field}`, cond] });
        }
      }
    }
  }

  if (exprConditions.length === 0) {
    return null;
  }

  return {
    $expr: {
      $and: exprConditions,
    },
  };
}
