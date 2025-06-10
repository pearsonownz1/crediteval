import React, { useEffect } from "react";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Checkbox } from "../../ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { ServiceInfo } from "../../../types/order/index";
import {
  SERVICE_TYPES,
  LANGUAGES,
  VISA_TYPES,
  URGENCY_OPTIONS,
} from "../../../constants/order/serviceOptions";
import { trackServiceSelected } from "../../../utils/analytics";
import { updateOrderServices } from "../../../utils/order/orderAPI"; // Removed updateOrderUrgency

interface ServiceSelectionStepProps {
  data: ServiceInfo;
  updateData: (data: Partial<ServiceInfo>) => void;
  orderId: string | null;
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  data,
  updateData,
  orderId,
}) => {
  useEffect(() => {
    if (data.type) {
      trackServiceSelected(data.type, data);
    }
  }, [data.type, data]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="service-type">Service Type</Label>
        <Select
          value={data.type}
          onValueChange={(value) => {
            const updatedData = { ...data, type: value };
            updateData({ type: value });
            if (orderId) {
              updateOrderServices(orderId, updatedData)
                .then(() =>
                  console.log("Order services updated (Service Type).")
                )
                .catch((err) =>
                  console.error(
                    "Failed to update order services (Service Type):",
                    err
                  )
                );
            }
          }}>
          <SelectTrigger id="service-type">
            <SelectValue placeholder="Select service type" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map((service) => (
              <SelectItem key={service.value} value={service.value}>
                {service.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Translation Fields */}
      {data.type === "translation" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="language-from">Language From</Label>
            <Select
              value={data.languageFrom}
              onValueChange={(value) => updateData({ languageFrom: value })}>
              <SelectTrigger id="language-from">
                <SelectValue placeholder="Select original language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="language-to">Language To</Label>
            <Select
              value={data.languageTo}
              onValueChange={(value) => updateData({ languageTo: value })}>
              <SelectTrigger id="language-to">
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page-count">Number of Pages for Translation</Label>
            <Input
              id="page-count"
              type="number"
              min="1"
              value={data.pageCount || 1}
              onChange={(e) =>
                updateData({ pageCount: parseInt(e.target.value, 10) || 1 })
              }
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">($25 per page)</p>
          </div>
        </>
      )}

      {/* Evaluation Fields */}
      {data.type === "evaluation" && (
        <div className="space-y-2">
          <Label>Evaluation Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
                data.evaluationType === "course"
                  ? "border-primary ring-1 ring-primary"
                  : ""
              }`}
              onClick={() => {
                updateData({ evaluationType: "course" });
                if (orderId) {
                  const updatedData = { ...data, evaluationType: "course" };
                  console.log(
                    "ServiceSelectionStep: Sending updatedData to backend (Evaluation Type - Course):",
                    updatedData
                  ); // Debugging
                  updateOrderServices(orderId, updatedData)
                    .then(() =>
                      console.log(
                        "Order services updated (Evaluation Type - Course)."
                      )
                    )
                    .catch((err) =>
                      console.error(
                        "Failed to update order services (Evaluation Type - Course):",
                        err
                      )
                    );
                }
              }}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="course-by-course"
                  checked={data.evaluationType === "course"}
                  onCheckedChange={() => {
                    updateData({ evaluationType: "course" });
                    if (orderId) {
                      const updatedData = { ...data, evaluationType: "course" };
                      console.log(
                        "ServiceSelectionStep: Sending updatedData to backend (Evaluation Type - Course - Checkbox):",
                        updatedData
                      ); // Debugging
                      updateOrderServices(orderId, updatedData)
                        .then(() =>
                          console.log(
                            "Order services updated (Evaluation Type - Course - Checkbox)."
                          )
                        )
                        .catch((err) =>
                          console.error(
                            "Failed to update order services (Evaluation Type - Course - Checkbox):",
                            err
                          )
                        );
                    }
                  }}
                />
                <div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Label
                        htmlFor="course-by-course"
                        className="font-medium cursor-pointer underline decoration-dashed decoration-muted-foreground">
                        Course-by-Course ($150)
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Lists all courses with U.S. semester credits and grade
                        equivalents. Recommended for further education or
                        professional licensing.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-sm text-muted-foreground">
                    Detailed evaluation of all courses, grades, and degrees
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`border rounded-lg p-4 cursor-pointer hover:border-primary transition-colors ${
                data.evaluationType === "document"
                  ? "border-primary ring-1 ring-primary"
                  : ""
              }`}
              onClick={() => {
                updateData({ evaluationType: "document" });
                if (orderId) {
                  const updatedData = { ...data, evaluationType: "document" };
                  console.log(
                    "ServiceSelectionStep: Sending updatedData to backend (Evaluation Type - Document):",
                    updatedData
                  ); // Debugging
                  updateOrderServices(orderId, updatedData)
                    .then(() =>
                      console.log(
                        "Order services updated (Evaluation Type - Document)."
                      )
                    )
                    .catch((err) =>
                      console.error(
                        "Failed to update order services (Evaluation Type - Document):",
                        err
                      )
                    );
                }
              }}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="document-by-document"
                  checked={data.evaluationType === "document"}
                  onCheckedChange={() => {
                    updateData({ evaluationType: "document" });
                    if (orderId) {
                      const updatedData = {
                        ...data,
                        evaluationType: "document",
                      };
                      console.log(
                        "ServiceSelectionStep: Sending updatedData to backend (Evaluation Type - Document - Checkbox):",
                        updatedData
                      ); // Debugging
                      updateOrderServices(orderId, updatedData)
                        .then(() =>
                          console.log(
                            "Order services updated (Evaluation Type - Document - Checkbox)."
                          )
                        )
                        .catch((err) =>
                          console.error(
                            "Failed to update order services (Evaluation Type - Document - Checkbox):",
                            err
                          )
                        );
                    }
                  }}
                />
                <div>
                  <Tooltip>
                    <TooltipTrigger>
                      <Label
                        htmlFor="document-by-document"
                        className="font-medium cursor-pointer underline decoration-dashed decoration-muted-foreground">
                        Document-by-Document ($85)
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Identifies your credentials and provides their U.S.
                        equivalents. Suitable for employment or immigration
                        purposes.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <p className="text-sm text-muted-foreground">
                    Basic evaluation of degrees and diplomas only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expert Opinion Fields */}
      {data.type === "expert" && (
        <div className="space-y-2">
          <Label htmlFor="visa-type">Visa Type</Label>
          <Select
            value={data.visaType}
            onValueChange={(value) => {
              const updatedData = { ...data, visaType: value };
              updateData({ visaType: value });
              if (orderId && updatedData.type === "expert") {
                // Only update if service type is expert
                updateOrderServices(orderId, updatedData)
                  .then(() =>
                    console.log("Order services updated (Visa Type).")
                  )
                  .catch((err) =>
                    console.error(
                      "Failed to update order services (Visa Type):",
                      err
                    )
                  );
              }
            }}>
            <SelectTrigger id="visa-type">
              <SelectValue placeholder="Select Visa Type" />
            </SelectTrigger>
            <SelectContent>
              {VISA_TYPES.map((visa) => (
                <SelectItem key={visa.value} value={visa.value}>
                  {visa.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Common Fields */}
      <div className="space-y-2">
        <Label htmlFor="urgency">Processing Time</Label>
        <Select
          value={data.urgency}
          onValueChange={(value) => {
            const updatedData = {
              ...data,
              urgency: value as ServiceInfo["urgency"],
            }; // Create updatedData
            updateData({ urgency: value as ServiceInfo["urgency"] });
            if (orderId) {
              console.log(
                "ServiceSelectionStep: Sending updatedData to backend (Urgency):",
                updatedData
              ); // Debugging
              updateOrderServices(orderId, updatedData) // Call updateOrderServices with updatedData
                .then(() => console.log("Order urgency updated via services."))
                .catch((err) =>
                  console.error(
                    "Failed to update order urgency via services:",
                    err
                  )
                );
            }
          }}>
          <SelectTrigger id="urgency">
            <SelectValue placeholder="Select processing time" />
          </SelectTrigger>
          <SelectContent>
            {URGENCY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="special-instructions">
          Special Instructions (Optional)
        </Label>
        <Textarea
          id="special-instructions"
          placeholder="Any specific requirements or notes for your order"
          value={data.specialInstructions || ""}
          onChange={(e) => updateData({ specialInstructions: e.target.value })}
        />
      </div>
    </div>
  );
};
