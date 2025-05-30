import React from "react";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { CustomerInfo } from "../../../types/order";

interface CustomerInfoStepProps {
  data: CustomerInfo;
  updateData: (data: Partial<CustomerInfo>) => void;
  error: string | null;
}

export const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  data,
  updateData,
  error,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Your Information</h3>
      <p className="text-sm text-muted-foreground">
        Please provide your contact details.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={data.firstName}
            onChange={(e) => updateData({ firstName: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={data.lastName}
            onChange={(e) => updateData({ lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={(e) => updateData({ email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(123) 456-7890"
          value={data.phone}
          onChange={(e) => updateData({ phone: e.target.value })}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};
