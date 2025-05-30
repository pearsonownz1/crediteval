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
import { ServiceInfo } from "../../../types/order";
import { DELIVERY_OPTIONS } from "../../../constants/order/serviceOptions";
import { COUNTRIES } from "../../../constants/order/countries";

interface DeliveryDetailsStepProps {
  data: ServiceInfo;
  updateData: (data: Partial<ServiceInfo>) => void;
}

export const DeliveryDetailsStep: React.FC<DeliveryDetailsStepProps> = ({
  data,
  updateData,
}) => {
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
          onValueChange={(value) =>
            updateData({ deliveryType: value as ServiceInfo["deliveryType"] })
          }>
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
              onValueChange={(value) =>
                updateData({
                  shippingInfo: {
                    ...data.shippingInfo,
                    country: value,
                  },
                })
              }
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
              onChange={(e) =>
                updateData({
                  shippingInfo: {
                    ...data.shippingInfo,
                    address: e.target.value,
                  },
                })
              }
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
              onChange={(e) =>
                updateData({
                  shippingInfo: {
                    ...data.shippingInfo,
                    apartment: e.target.value,
                  },
                })
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Anytown"
                value={data.shippingInfo.city}
                onChange={(e) =>
                  updateData({
                    shippingInfo: {
                      ...data.shippingInfo,
                      city: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                placeholder="CA"
                value={data.shippingInfo.state}
                onChange={(e) =>
                  updateData({
                    shippingInfo: {
                      ...data.shippingInfo,
                      state: e.target.value,
                    },
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">Zip / Postal Code</Label>
              <Input
                id="zip"
                placeholder="90210"
                value={data.shippingInfo.zip}
                onChange={(e) =>
                  updateData({
                    shippingInfo: { ...data.shippingInfo, zip: e.target.value },
                  })
                }
                required
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
