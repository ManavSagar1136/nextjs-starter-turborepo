/* eslint-disable  @typescript-eslint/no-explicit-any */

type PopulateObject = {
  [key: string]: boolean | PopulateObject;
};

export function parsePopulate(populateString: string): PopulateObject {
  const parts = populateString.split("+");
  const result: PopulateObject = {};

  parts.forEach(part => {
    let current = result;
    const fields = part.split(".");

    fields.forEach((field, index) => {
      field.split(" ").forEach(f => {
        if (index === fields.length - 1) {
          current[f] = true;
        } else {
          if (!current[f] || typeof current[f] !== "object") {
            current[f] = {};
          }
          current = current[f] as PopulateObject;
        }
      });
    });
  });

  return result;
}

export function convertToPrismaPopulate(populate: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(populate)) {
    const [, path, select] = key.match(/populate\[(\d+)\]\[(\w+)\]/) || [];
    if (path && select) {
      if (!result[path]) {
        result[path] = {};
      }
      if (select === "select") {
        result[path][select] = parsePopulate(value);
      } else {
        result[path][select] = value;
      }
    }
  }

  const includeObject = Object.values(result).reduce((acc: Record<string, any>, item: any) => {
    return {
      ...acc,
      [item.path]: item.select,
      [item.path]: {
        select: item.select,
      },
    };
  }, {});
  return includeObject;
}
