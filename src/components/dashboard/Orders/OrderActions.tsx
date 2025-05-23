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
import { Order } from "../../../types/order-v1";

interface OrderActionsProps {
  order: Order;
}

export const OrderActions: React.FC<OrderActionsProps> = ({ order }) => {
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button>Upload & Notify Client</Button>
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
              <Select defaultValue={order.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Add internal notes..." rows={3} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="notify-client-status" />
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
            <Button>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
