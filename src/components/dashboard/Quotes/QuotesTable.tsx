import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "../../common/StatusBadge";
import { formatServiceType } from "../../../utils/format";
import { Quote } from "../../../types/quote";
import { Search, Filter, Trash2, Info } from "lucide-react";

interface QuotesTableProps {
  quotes: Quote[];
  loading: boolean;
  error: string | null;
  selectedKeys: string[];
  isDeleting: boolean;
  handleSelectAll: (checked: boolean | "indeterminate") => void;
  handleSelectRow: (id: string, checked: boolean | "indeterminate") => void;
  handleDelete: () => void;
  handleRowClick: (quote: Quote) => void;
}

export const QuotesTable: React.FC<QuotesTableProps> = ({
  quotes,
  loading,
  error,
  selectedKeys,
  isDeleting,
  handleSelectAll,
  handleSelectRow,
  handleDelete,
  handleRowClick,
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-semibold">Quote Requests</div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search quotes..."
              className="pl-8 w-[250px]"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          {selectedKeys.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}>
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : `Delete (${selectedKeys.length})`}
            </Button>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={
                  selectedKeys.length === quotes.length && quotes.length > 0
                    ? true
                    : selectedKeys.length > 0
                    ? "indeterminate"
                    : false
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all quote rows"
              />
            </TableHead>
            <TableHead>Quote ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Loading quotes...
              </TableCell>
            </TableRow>
          )}

          {error && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-red-500">
                Error: {error}
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            !error &&
            quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedKeys.includes(quote.id)}
                    onCheckedChange={(checked) =>
                      handleSelectRow(quote.id, checked)
                    }
                    aria-label={`Select quote row ${quote.id}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {quote.id?.substring(0, 8)}...
                </TableCell>
                <TableCell>
                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:text-primary"
                    onClick={() => handleRowClick(quote)}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{quote.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{quote.name}</div>
                      <div className="text-xs text-gray-500">{quote.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{formatServiceType(quote.service_type)}</TableCell>
                <TableCell>
                  <StatusBadge status={quote.status} />
                </TableCell>
                <TableCell>${Number(quote.price || 0).toFixed(2)}</TableCell>
                <TableCell>
                  {new Date(quote.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div
                    className="flex space-x-1"
                    onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View Details"
                      onClick={() => handleRowClick(quote)}>
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-500">
          Showing {quotes.length} of {quotes.length} quotes
        </div>
      </div>
    </div>
  );
};
