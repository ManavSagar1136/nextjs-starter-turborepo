/* eslint-disable  @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";

interface IChartResult {
  time: string;
  value: number | unknown;
}

export async function chartifyPrisma(request: NextRequest, prismaModel: any, where?: any): Promise<IChartResult[]> {
  const searchParams = request.nextUrl.searchParams;
  const from = searchParams.get("filter[from]");
  const to = searchParams.get("filter[to]");
  const groupBy = searchParams.get("groupBy") as "day" | "week" | "month" | "year";

  if (!from || !to || !groupBy) {
    throw new Error("Missing required parameters");
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);

  const results = await prismaModel.findMany({
    where: {
      ...where,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      createdAt: true,
    },
  });

  const groupedData = results.reduce((acc: Record<string, number>, item: { createdAt: Date }) => {
    let dateKey: string;

    switch (groupBy) {
      case "day":
        dateKey = item.createdAt.toLocaleString("default", {
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        break;
      case "week":
        const d = new Date(item.createdAt);
        const firstDayOfWeek = new Date(d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)));
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
        dateKey = `${firstDayOfWeek.toLocaleString("default", { month: "short", day: "numeric" })} - ${lastDayOfWeek.toLocaleString("default", { month: "short", day: "numeric", year: "numeric" })}`;
        break;
      case "month":
        dateKey = item.createdAt.toLocaleString("default", {
          month: "long",
          year: "numeric",
        });
        break;
      case "year":
        dateKey = item.createdAt.getFullYear().toString();
        break;
      default:
        throw new Error("Invalid groupBy option");
    }

    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {});

  const result = Object.entries(groupedData)
    .map(([date, count]) => ({ time: date, value: count }))
    .sort((a, b) => a.time.localeCompare(b.time));
  return result;
}
