import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { QuotesTable } from "./QuotesTable";
import { QuoteDetails } from "./QuoteDetails";
import { useQuotes } from "../../../hooks/useQuotes";
import { useSelection } from "../../../hooks/useSelection";
import { Quote } from "../../../types/quote";

export const QuotesView: React.FC = () => {
  const { quotes, loading, error, deleteQuotes } = useQuotes();
  const {
    selectedKeys,
    isDeleting,
    setIsDeleting,
    handleSelectAll,
    handleSelectRow,
    clearSelection,
  } = useSelection(quotes);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const handleRowClick = (quote: Quote) => {
    setSelectedQuote(quote);
    setDetailsDialogOpen(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedKeys.length === 0)
      return alert("Please select quotes to delete.");
    if (!window.confirm(`Delete ${selectedKeys.length} quote(s)?`)) return;

    setIsDeleting(true);

    try {
      const result = await deleteQuotes(selectedKeys);
      alert(result.message);
      clearSelection();
    } catch (err: any) {
      alert(`Error deleting quotes: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Quote Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotesTable
            quotes={quotes}
            loading={loading}
            error={error}
            selectedKeys={selectedKeys}
            isDeleting={isDeleting}
            handleSelectAll={handleSelectAll}
            handleSelectRow={handleSelectRow}
            handleDelete={handleDeleteSelected}
            handleRowClick={handleRowClick}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            Showing {quotes.length} of {quotes.length} quotes
          </div>
        </CardFooter>
      </Card>

      <QuoteDetails
        quote={selectedQuote}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
};
