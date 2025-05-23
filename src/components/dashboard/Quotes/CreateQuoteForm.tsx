import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatServiceType } from "../../../utils/format";

export const CreateQuoteForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    service_type: "",
    price: "",
    expires_days: "30", // Default 30 days expiration
    status: "quote_sent",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.service_type ||
      !formData.price
    ) {
      alert("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expires_days));

      const { data, error } = await supabase
        .from("quotes")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            service_type: formData.service_type,
            price: parseFloat(formData.price),
            status: formData.status,
            expires_at: expiresAt.toISOString(),
            staff_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select();

      if (error) throw error;

      alert("Quote created successfully!");
      navigate("#quotes");

      // Reset form
      setFormData({
        name: "",
        email: "",
        service_type: "",
        price: "",
        expires_days: "30",
        status: "quote_sent",
      });
    } catch (err: any) {
      console.error("Error creating quote:", err);
      alert(`Error creating quote: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Quote</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Client Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Client Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service_type">Service Type</Label>
            <Select
              value={formData.service_type}
              onValueChange={(value) =>
                handleSelectChange("service_type", value)
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select a service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="translation">Translation</SelectItem>
                <SelectItem value="evaluation">Evaluation</SelectItem>
                <SelectItem value="expert">Expert Service</SelectItem>
                <SelectItem value="document_review">Document Review</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USD)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              placeholder="99.99"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires_days">Expires After (Days)</Label>
            <Select
              value={formData.expires_days}
              onValueChange={(value) =>
                handleSelectChange("expires_days", value)
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select expiration period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select quote status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quote_sent">Quote Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="quote_accepted">Quote Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Quote..." : "Create Quote"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
