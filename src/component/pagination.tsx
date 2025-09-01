"use client";

import { Pagination } from "flowbite-react";

type Props = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function PaginationComponent({ currentPage, totalPages, onPageChange }: Props) {
  return (
    <div className="flex overflow-x-auto sm:justify-center mt-4">
      <Pagination
        currentPage={currentPage}
        totalPages={Math.max(1, totalPages)} // กันไม่ให้เป็น 0
        onPageChange={onPageChange}
        showIcons
      />
    </div>
  );
}
