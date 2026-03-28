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

const DEFAULT_SITE_URL = "https://crediteval.com";
const DEFAULT_NOTARIZATION_FEE = 2500;
const DEFAULT_MAIL_FEE = 1500;
const DEFAULT_INTERNATIONAL_MAIL_FEE = 4500;

export const OrderActions: React.FC<OrderActionsProps> = ({ order }) => {
  const [reviewToken] = useState(
    order.services?._meta?.reviewToken ||
      order.services?._meta?.editToken ||
      crypto.randomUUID()
  );
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
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [finalFiles, setFinalFiles] = useState<File[]>([]);
  const [quotedUnlockAmount, setQuotedUnlockAmount] = useState<string>(
    typeof order.services?.quotedUnlockAmount === "number"
      ? (order.services.quotedUnlockAmount / 100).toFixed(2)
      : typeof order.total_amount === "number"
      ? (order.total_amount / 100).toFixed(2)
      : ""
  );
  const [includeNotarizationOption, setIncludeNotarizationOption] = useState(
    order.services?.notarizationRequested ?? false
  );
  const [notarizationFee, setNotarizationFee] = useState(
    (
      (order.services?.notarizationFee ?? DEFAULT_NOTARIZATION_FEE) / 100
    ).toFixed(2)
  );
  const [expressMailFee, setExpressMailFee] = useState(
    ((order.services?.expressMailFee ?? DEFAULT_MAIL_FEE) / 100).toFixed(2)
  );
  const [internationalMailFee, setInternationalMailFee] = useState(
    (
      (order.services?.internationalMailFee ?? DEFAULT_INTERNATIONAL_MAIL_FEE) /
      100
    ).toFixed(2)
  );
  const [mailingOption, setMailingOption] = useState(
    order.services?.deliveryType || "email"
  );
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const sendCompletionEmail = async (notes?: string) => {
    const { error } = await supabase.functions.invoke(
      "send-order-completion-email",
      {
        body: {
          orderId: order.id,
          notes: notes || undefined,
          reviewUrl: `${
            import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL
          }/order-review/${order.id}?token=${reviewToken}`,
        },
      }
    );

    if (error) {
      throw error;
    }
  };

  const uploadFilesToPath = async (
    files: File[],
    subfolder: "preview" | "final"
  ) => {
    const uploadedPaths: string[] = [];

    for (const file of files) {
      const sanitizedFileName = file.name.replace(/\s+/g, "-");
      const path = `orders/${order.id}/${subfolder}/${Date.now()}-${sanitizedFileName}`;
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

    return uploadedPaths;
  };

  const getMailingFee = (deliveryType: string) => {
    const expressFee = Math.round(Number(expressMailFee || "0") * 100);
    const intlFee = Math.round(Number(internationalMailFee || "0") * 100);

    if (deliveryType === "express") {
      return expressFee;
    }

    if (deliveryType === "international") {
      return intlFee;
    }

    return 0;
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
    if (previewFiles.length === 0) {
      alert("Please select at least one preview file.");
      return;
    }

    try {
      setIsUploading(true);

      const quotedAmountInCents = quotedUnlockAmount
        ? Math.round(Number(quotedUnlockAmount) * 100)
        : null;
      const notarizationFeeInCents = Math.round(Number(notarizationFee || "0") * 100);
      const expressMailFeeInCents = Math.round(Number(expressMailFee || "0") * 100);
      const internationalMailFeeInCents = Math.round(
        Number(internationalMailFee || "0") * 100
      );

      if (quotedUnlockAmount && (!quotedAmountInCents || quotedAmountInCents < 50)) {
        throw new Error("Please enter a valid unlock price of at least $0.50.");
      }

      const previewPaths = await uploadFilesToPath(previewFiles, "preview");
      const finalPaths =
        finalFiles.length > 0 ? await uploadFilesToPath(finalFiles, "final") : [];

      const mergedPaths = [
        ...(order.document_paths || []),
        ...previewPaths,
        ...finalPaths,
      ].filter((value, index, arr) => arr.indexOf(value) === index);

      const nextServices = {
        ...(order.services || {}),
        _meta: {
          ...(order.services?._meta || {}),
          reviewToken,
        },
        previewFilePath: previewPaths[0] || order.services?.previewFilePath,
        finalFilePath: finalPaths[0] || order.services?.finalFilePath,
        previewStatus: "ready" as const,
        unlockStatus: quotedAmountInCents
          ? ("available" as const)
          : order.services?.unlockStatus,
        translatorStatus: "completed" as const,
        quotedUnlockAmount:
          quotedAmountInCents ?? order.services?.quotedUnlockAmount,
        previewReadyAt: new Date().toISOString(),
        previewSentAt: notifyClientOnUpload
          ? new Date().toISOString()
          : order.services?.previewSentAt,
        notarizationRequested: includeNotarizationOption,
        notarizationFee: notarizationFeeInCents,
        expressMailFee: expressMailFeeInCents,
        internationalMailFee: internationalMailFeeInCents,
        deliveryType: mailingOption,
      };

      const { error: updateError } = await supabase
        .from(ordersTable)
        .update({
          status: quotedAmountInCents ? "pending_payment" : "preview_ready",
          document_paths: mergedPaths,
          total_amount: quotedAmountInCents ?? order.total_amount,
          services: nextServices,
        })
        .eq("id", order.id);

      if (updateError) {
        throw updateError;
      }

      if (notifyClientOnUpload) {
        await sendCompletionEmail();
      }

      alert("Preview prepared and order updated.");
      setPreviewFiles([]);
      setFinalFiles([]);
      setUploadDialogOpen(false);
    } catch (err: any) {
      console.error("Failed to upload completed documents:", err);
      alert(err.message || "Failed to upload documents.");
    } finally {
      setIsUploading(false);
    }
  };

  const reviewLink = `${
    import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL
  }/order-review/${order.id}?token=${reviewToken}`;

  return (
    <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Prepare Preview">
            <Upload className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prepare Preview & Quote</DialogTitle>
            <DialogDescription>
              Upload the preview, optional final file, and unlock price for
              order {order.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Unlock Price (USD)</label>
              <Input
                type="number"
                min="0.50"
                step="0.01"
                placeholder="49.00"
                value={quotedUnlockAmount}
                onChange={(event) => setQuotedUnlockAmount(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Base translation price before optional notarization or mailing
                fees.
              </p>
            </div>

            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <p className="mt-2 text-sm font-medium">Watermarked Preview</p>
              <p className="mt-1 text-sm text-gray-500">
                Upload the document the customer will review before payment.
              </p>
              <Input
                type="file"
                className="hidden"
                id={`preview-file-upload-dialog-${order.id}`}
                multiple
                onChange={(event) => {
                  const files = event.target.files
                    ? Array.from(event.target.files)
                    : [];
                  setPreviewFiles(files);
                }}
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  document
                    .getElementById(`preview-file-upload-dialog-${order.id}`)
                    ?.click()
                }>
                Select Preview Files
              </Button>
              {previewFiles.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {previewFiles.length} preview file
                  {previewFiles.length === 1 ? "" : "s"} selected
                </p>
              )}
            </div>

            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm font-medium">Optional Final Files</p>
              <p className="mt-1 text-sm text-gray-500">
                Upload the clean non-watermarked version now if you want the
                customer to download immediately after payment.
              </p>
              <Input
                type="file"
                className="hidden"
                id={`final-file-upload-dialog-${order.id}`}
                multiple
                onChange={(event) => {
                  const files = event.target.files
                    ? Array.from(event.target.files)
                    : [];
                  setFinalFiles(files);
                }}
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  document
                    .getElementById(`final-file-upload-dialog-${order.id}`)
                    ?.click()
                }>
                Select Final Files
              </Button>
              {finalFiles.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {finalFiles.length} final file
                  {finalFiles.length === 1 ? "" : "s"} selected
                </p>
              )}
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`include-notarization-option-${order.id}`}
                  checked={includeNotarizationOption}
                  onCheckedChange={(checked) =>
                    setIncludeNotarizationOption(checked === true)
                  }
                />
                <label
                  htmlFor={`include-notarization-option-${order.id}`}
                  className="text-sm">
                  Offer notarization add-on (+$
                  {(DEFAULT_NOTARIZATION_FEE / 100).toFixed(2)})
                </label>
              </div>

              {includeNotarizationOption && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Notarization Fee (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={notarizationFee}
                    onChange={(event) => setNotarizationFee(event.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mailing Option Available to Customer
                </label>
                <Select
                  value={mailingOption}
                  onValueChange={(value) =>
                    setMailingOption(value as "email" | "express" | "international")
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Digital only</SelectItem>
                    <SelectItem value="express">
                      Mail available (+${(DEFAULT_MAIL_FEE / 100).toFixed(2)})
                    </SelectItem>
                    <SelectItem value="international">
                      International mail (+$
                      {(DEFAULT_INTERNATIONAL_MAIL_FEE / 100).toFixed(2)})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mailingOption === "express" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Domestic Mail Fee (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expressMailFee}
                    onChange={(event) => setExpressMailFee(event.target.value)}
                  />
                </div>
              )}

              {mailingOption === "international" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    International Mail Fee (USD)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={internationalMailFee}
                    onChange={(event) =>
                      setInternationalMailFee(event.target.value)
                    }
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-1 break-all">
              <p>Review link: {reviewLink}</p>
              {mailingOption !== "email" && (
                <p>
                  Mailing surcharge: $
                  {(getMailingFee(mailingOption) / 100).toFixed(2)}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`notify-client-upload-${order.id}`}
                checked={notifyClientOnUpload}
                onCheckedChange={(checked) =>
                  setNotifyClientOnUpload(checked === true)
                }
              />
              <label
                htmlFor={`notify-client-upload-${order.id}`}
                className="text-sm">
                Notify client after saving preview
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
              {isUploading ? "Saving..." : "Save & Notify Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="preview_ready">Preview Ready</SelectItem>
                  <SelectItem value="pending_payment">Pending Payment</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
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
                id={`notify-client-status-${order.id}`}
                checked={notifyClientOnStatusUpdate}
                onCheckedChange={(checked) =>
                  setNotifyClientOnStatusUpdate(checked === true)
                }
              />
              <label
                htmlFor={`notify-client-status-${order.id}`}
                className="text-sm">
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
