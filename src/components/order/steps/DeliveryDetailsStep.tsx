import React from "react";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { ServiceInfo } from "../../../types/order/services";
import { DELIVERY_OPTIONS } from "../../../constants/order/serviceOptions";
import { COUNTRIES } from "../../../constants/order/countries";
import { updateOrderServices } from "../../../utils/order/orderAPI"; // Import updateOrderServices

interface DeliveryDetailsStepProps {
  data: ServiceInfo;
  updateData: (data: Partial<ServiceInfo>) => void;
  orderId: string | null; // Add orderId prop
}

export const DeliveryDetailsStep: React.FC<DeliveryDetailsStepProps> = ({
  data,
  updateData,
  orderId, // Destructure orderId
}) => {
  // Defensive check: If data is null or undefined, return null or a loading indicator
  if (!data) {
    console.warn("DeliveryDetailsStep received undefined or null data prop.");
    return null; // Or a loading spinner, or an error message
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Delivery Details</h3>
      <p className="text-sm text-muted-foreground">
        How would you like to receive your documents?
      </p>

      <div className="space-y-2">
        <Label htmlFor="delivery-type">Delivery Type</Label>
        <Select
          value={data.deliveryType}
          onValueChange={(value) => {
            const updatedData = {
              ...data,
              deliveryType: value as ServiceInfo["deliveryType"],
            }; // Create updatedData
            updateData({ deliveryType: value as ServiceInfo["deliveryType"] });
            if (orderId) {
              updateOrderServices(orderId, updatedData) // Call updateOrderServices with updatedData
                .then(() => console.log("Order delivery type updated."))
                .catch((err) =>
                  console.error("Failed to update order delivery type:", err)
                );
            }
          }}>
          <SelectTrigger id="delivery-type">
            <SelectValue placeholder="Select delivery type" />
          </SelectTrigger>
          <SelectContent>
            {DELIVERY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Shipping Information Fields */}
      {data.deliveryType !== "email" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium">Shipping Information</h4>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select
              value={data.shippingInfo.country}
              onValueChange={(value) => {
                const updatedShippingInfo = {
                  ...data.shippingInfo,
                  country: value,
                };
                const updatedData = {
                  ...data,
                  shippingInfo: updatedShippingInfo,
                };
                updateData({ shippingInfo: updatedShippingInfo });
                if (orderId) {
                  updateOrderServices(orderId, updatedData)
                    .then(() => console.log("Order shipping country updated."))
                    .catch((err) =>
                      console.error(
                        "Failed to update order shipping country:",
                        err
                      )
                    );
                }
              }}
              required>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              placeholder="123 Main St"
              value={data.shippingInfo.address}
              onChange={(e) => {
                const updatedShippingInfo = {
                  ...data.shippingInfo,
                  address: e.target.value,
                };
                const updatedData = {
                  ...data,
                  shippingInfo: updatedShippingInfo,
                };
                updateData({ shippingInfo: updatedShippingInfo });
                if (orderId) {
                  updateOrderServices(orderId, updatedData)
                    .then(() => console.log("Order shipping address updated."))
                    .catch((err) =>
                      console.error(
                        "Failed to update order shipping address:",
                        err
                      )
                    );
                }
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apartment">
              Apartment, suite, unit, etc. (Optional)
            </Label>
            <Input
              id="apartment"
              placeholder="Apt 4B"
              value={data.shippingInfo.apartment}
              onChange={(e) => {
                const updatedShippingInfo = {
                  ...data.shippingInfo,
                  apartment: e.target.value,
                };
                const updatedData = {
                  ...data,
                  shippingInfo: updatedShippingInfo,
                };
                updateData({ shippingInfo: updatedShippingInfo });
                if (orderId) {
                  updateOrderServices(orderId, updatedData)
                    .then(() =>
                      console.log("Order shipping apartment updated.")
                    )
                    .catch((err) =>
                      console.error(
                        "Failed to update order shipping apartment:",
                        err
                      )
                    );
                }
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Anytown"
                value={data.shippingInfo.city}
                onChange={(e) => {
                  const updatedShippingInfo = {
                    ...data.shippingInfo,
                    city: e.target.value,
                  };
                  const updatedData = {
                    ...data,
                    shippingInfo: updatedShippingInfo,
                  };
                  updateData({ shippingInfo: updatedShippingInfo });
                  if (orderId) {
                    updateOrderServices(orderId, updatedData)
                      .then(() => console.log("Order shipping city updated."))
                      .catch((err) =>
                        console.error(
                          "Failed to update order shipping city:",
                          err
                        )
                      );
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                placeholder="CA"
                value={data.shippingInfo.state}
                onChange={(e) => {
                  const updatedShippingInfo = {
                    ...data.shippingInfo,
                    state: e.target.value,
                  };
                  const updatedData = {
                    ...data,
                    shippingInfo: updatedShippingInfo,
                  };
                  updateData({ shippingInfo: updatedShippingInfo });
                  if (orderId) {
                    updateOrderServices(orderId, updatedData)
                      .then(() => console.log("Order shipping state updated."))
                      .catch((err) =>
                        console.error(
                          "Failed to update order shipping state:",
                          err
                        )
                      );
                  }
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip / Postal Code</Label>
              <Input
                id="zip"
                placeholder="90210"
                value={data.shippingInfo.zip}
                onChange={(e) => {
                  const updatedShippingInfo = {
                    ...data.shippingInfo,
                    zip: e.target.value,
                  };
                  const updatedData = {
                    ...data,
                    shippingInfo: updatedShippingInfo,
                  };
                  updateData({ shippingInfo: updatedShippingInfo });
                  if (orderId) {
                    updateOrderServices(orderId, updatedData)
                      .then(() => console.log("Order shipping zip updated."))
                      .catch((err) =>
                        console.error(
                          "Failed to update order shipping zip:",
                          err
                        )
                      );
                  }
                }}
                required
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
