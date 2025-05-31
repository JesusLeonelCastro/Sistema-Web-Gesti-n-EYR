import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  filteredItemsCount
}) => {
  if (totalPages <= 1 && filteredItemsCount <= itemsPerPage) {
    return null; 
  }

  const handleFirstPage = () => onPageChange(1);
  const handlePreviousPage = () => onPageChange(Math.max(1, currentPage - 1));
  const handleNextPage = () => onPageChange(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => onPageChange(totalPages);

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, filteredItemsCount);
  const endItem = Math.min(currentPage * itemsPerPage, filteredItemsCount);

  return (
    <div className="flex items-center justify-between mt-6 py-3 border-t">
      <div className="text-sm text-muted-foreground">
        {filteredItemsCount > 0 ? (
          <>
            Mostrando {startItem} - {endItem} de {filteredItemsCount} registros.
          </>
        ) : (
          "No hay registros para mostrar."
        )}
      </div>
      {totalPages > 0 && (
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            aria-label="Primera página"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLastPage}
            disabled={currentPage === totalPages}
            aria-label="Última página"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PaginationControls;