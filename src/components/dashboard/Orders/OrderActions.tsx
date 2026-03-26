import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Upload, MoreVertical } from "lucide-react";
import { Order } from "../../../types/order";
import { supabase } from "../../../lib/supabaseClient";
import { ordersTable } from "../../../lib/ordersTable";

interface OrderActionsProps {
  order: Order;
}

export const OrderActions: React.FC<OrderActionsProps> = ({ order }) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    order.status || "pending"
  );
  const [statusNotes, setStatusNotes] = useState("");
  const [notifyClientOnStatusUpdate, setNotifyClientOnStatusUpdate] =
    useState(false);
  const [notifyClientOnUpload, setNotifyClientOnUpload] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const sendCompletionEmail = async (notes?: string) => {
    const { error } = await supabase.functions.invoke(
      "send-order-completion-email",
      {
        body: {
          orderId: order.id,
          notes: notes || undefined,
        },
      }
    );

    if (error) {
      throw error;
    }
  };

  const handleStatusUpdate = async () => {
    try {
      setIsSavingStatus(true);
      const { error } = await supabase
        .from(ordersTable)
        .update({ status: selectedStatus })
        .eq("id", order.id);

      if (error) {
        throw error;
      }

      if (notifyClientOnStatusUpdate && selectedStatus === "completed") {
        await sendCompletionEmail(statusNotes);
      }

      alert("Order status updated.");
      setStatusDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      alert(err.message || "Failed to update status.");
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleUploadAndNotify = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedPaths: string[] = [];

      for (const file of selectedFiles) {
        const sanitizedFileName = file.name.replace(/\s+/g, "-");
        const path = `orders/${order.id}/completed/${Date.now()}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(path, file, {
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        uploadedPaths.push(path);
      }

      const mergedPaths = [
        ...(order.document_paths || []),
        ...uploadedPaths,
      ].filter((value, index, arr) => arr.indexOf(value) === index);

      const { error: updateError } = await supabase
        .from(ordersTable)
        .update({
          status: "completed",
          document_paths: mergedPaths,
        })
        .eq("id", order.id);

      if (updateError) {
        throw updateError;
      }

      if (notifyClientOnUpload) {
        await sendCompletionEmail();
      }

      alert("Documents uploaded and order marked completed.");
      setSelectedFiles([]);
      setUploadDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to upload completed documents:", err);
      alert(err.message || "Failed to upload documents.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Message Client">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Client</DialogTitle>
            <DialogDescription>
              Send a message to {order.first_name} {order.last_name} regarding
              order {order.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input placeholder="Order Update" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="Type your message here..." rows={5} />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMessageDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Send Message</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Upload Documents">
            <Upload className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload completed documents for order {order.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Drag and drop files here or click to browse
              </p>
              <Input
                type="file"
                className="hidden"
                id="file-upload-dialog"
                multiple
                onChange={(event) => {
                  const files = event.target.files
                    ? Array.from(event.target.files)
                    : [];
                  setSelectedFiles(files);
                }}
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  document.getElementById("file-upload-dialog")?.click()
                }>
                Select Files
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-client-upload"
                checked={notifyClientOnUpload}
                onCheckedChange={(checked) =>
                  setNotifyClientOnUpload(checked === true)
                }
              />
              <label htmlFor="notify-client-upload" className="text-sm">
                Notify client after upload
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUploadAndNotify} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload & Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Update Status">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Change the status for order {order.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending_payment">Pending Payment</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Add internal notes..."
                rows={3}
                value={statusNotes}
                onChange={(event) => setStatusNotes(event.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-client-status"
                checked={notifyClientOnStatusUpdate}
                onCheckedChange={(checked) =>
                  setNotifyClientOnStatusUpdate(checked === true)
                }
              />
              <label htmlFor="notify-client-status" className="text-sm">
                Notify client
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isSavingStatus}>
              {isSavingStatus ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
