import React, { useEffect } from "react"; // Combined React and useEffect import
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
import { ServiceInfo } from "../../../types/order/index"; // Corrected import path
import {
  SERVICE_TYPES,
  LANGUAGES,
  VISA_TYPES,
  URGENCY_OPTIONS,
} from "../../../constants/order/serviceOptions";
import { trackServiceSelected } from "../../../utils/analytics"; // Import GA4 tracking function
import { updateOrderServices } from "../../../utils/order/orderAPI"; // Import the new API function

interface ServiceSelectionStepProps {
  data: ServiceInfo;
  updateData: (data: Partial<ServiceInfo>) => void;
  orderId: string | null; // Add this prop
}

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  data,
  updateData,
  orderId, // Destructure orderId
}) => {
  useEffect(() => {
    if (data.type) {
      trackServiceSelected(data.type, data);
    }
  }, [data.type, data]); // Re-run when service type changes

  useEffect(() => {
    if (orderId && data.type) {
      // Only update if orderId exists and a service type is selected
      updateOrderServices(orderId, data)
        .then(() => console.log("Order services updated in Supabase."))
        .catch((err) => console.error("Failed to update order services:", err));
    }
  }, [orderId, data]); // Depend on orderId and data

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="service-type">Service Type</Label>
        <Select
          value={data.type}
          onValueChange={(value) => updateData({ type: value })}>
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
              onClick={() => updateData({ evaluationType: "course" })}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="course-by-course"
                  checked={data.evaluationType === "course"}
                  onCheckedChange={() =>
                    updateData({ evaluationType: "course" })
                  }
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
              onClick={() => updateData({ evaluationType: "document" })}>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="document-by-document"
                  checked={data.evaluationType === "document"}
                  onCheckedChange={() =>
                    updateData({ evaluationType: "document" })
                  }
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
            onValueChange={(value) => updateData({ visaType: value })}>
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
          onValueChange={(value) =>
            updateData({ urgency: value as ServiceInfo["urgency"] })
          }>
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
