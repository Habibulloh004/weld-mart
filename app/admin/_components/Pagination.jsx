// components/Pagination.jsx
import {
  Pagination as ShadPagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const showEllipsisThreshold = 7;

  if (totalPages <= showEllipsisThreshold) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage <= 3) {
      // Near the start: 1 2 3 4 ... n
      pages.push(2, 3, 4);
      pages.push("ellipsis-end");
    } else if (currentPage >= totalPages - 2) {
      // Near the end: 1 ... n-3 n-2 n-1 n
      pages.push("ellipsis-start");
      pages.push(totalPages - 3, totalPages - 2, totalPages - 1);
    } else {
      // In the middle: 1 ... current-1 current current+1 ... n
      pages.push("ellipsis-start");
      pages.push(currentPage - 1, currentPage, currentPage + 1);
      pages.push("ellipsis-end");
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <ShadPagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>

        {pageNumbers.map((page, index) => (
          <PaginationItem key={typeof page === "string" ? page : `page-${page}`}>
            {typeof page === "string" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className="cursor-pointer"
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
          />
        </PaginationItem>
      </PaginationContent>
    </ShadPagination>
  );
}