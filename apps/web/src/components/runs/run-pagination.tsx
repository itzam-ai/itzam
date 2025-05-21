"use client";

import { useQueryState } from "nuqs";
import { Button } from "../ui/button";

export default function RunPagination({ totalPages }: { totalPages: number }) {
  const [page, setPage] = useQueryState("page", {
    defaultValue: 1,
    shallow: false,
    parse: (value) => parseInt(value),
  });

  const isPrevDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  return (
    <>
      {isPrevDisabled ? (
        <Button variant="outline" size="sm" disabled>
          Previous
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
      )}

      <span className="text-sm">
        {page} of {totalPages || 1}
      </span>

      {isNextDisabled ? (
        <Button variant="outline" size="sm" disabled>
          Next
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      )}
    </>
  );
}
