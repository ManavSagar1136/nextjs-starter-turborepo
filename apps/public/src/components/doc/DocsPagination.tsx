"use client";

import { useRouter, useSearchParams } from "next/navigation";
import PaginationControls from "@buildbase/ui/components/ui/pagination-controls";

interface DocsPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function DocsPagination({ currentPage, totalPages }: DocsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    router.push(`?${params.toString()}`, { scroll: true });
  };

  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
      scrollToTop={true}
      maxVisible={5}
    />
  );
}
