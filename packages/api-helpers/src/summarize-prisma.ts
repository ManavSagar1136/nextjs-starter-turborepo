/* eslint-disable  @typescript-eslint/no-explicit-any */

interface SummarizeResult<T> {
  data: T[];
  count: number;
}

export async function summarizePrisma<T>(model: any): Promise<SummarizeResult<T>> {
  const statusCounts = await model.groupBy({
    by: ["status"],
    _count: true,
  });

  const monthlyData = await model.groupBy({
    by: ["createdAt"],
    _count: {
      id: true,
    },
  });

  const formattedMonthlyData = monthlyData.reduce((acc: any, item: any) => {
    const date = new Date(item.createdAt);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!acc[monthYear]) {
      acc[monthYear] = { month: date, count: 0 };
    }

    acc[monthYear].count += item._count.id;

    return acc;
  }, {});

  const sortedMonthlyData = Object.values(formattedMonthlyData)
    .sort((a: any, b: any) => b.month.getTime() - a.month.getTime())
    .slice(0, 12);

  return {
    count: statusCounts,
    data: sortedMonthlyData as T[],
  };
}
