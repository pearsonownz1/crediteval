import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "../lib/supabaseClient";
import { useToast } from "./ui/use-toast";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Phone, Mail, Clock, MessageSquare } from "lucide-react";

const ContactUs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    inquiryType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      inquiryType: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-inquiry", {
        body: formData,
      });

      if (error) throw error;

      console.log("Supabase function response:", data);
      navigate("/contact-success");
    } catch (error: any) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Error Sending Message",
        description: `There was a problem sending your message: ${error.message || "Please try again later."}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Contact Us
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We're here to help with all your credential evaluation and
              translation needs
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
              <p className="text-gray-600 mb-8">
                Have questions about our services? Our team is ready to assist
                you with any inquiries about credential evaluation, document
                translation, or the status of your order.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Phone</h3>
                    <p className="text-gray-600">801-335-4567</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-gray-600">support@crediteval.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-full mr-4">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM EST
                      <br />
                      Saturday: 10:00 AM - 2:00 PM EST
                      <br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-6">
                    <MessageSquare className="h-6 w-6 text-primary mr-2" />
                    <h2 className="text-2xl font-bold">Send Us a Message</h2>
                  </div>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" value={formData.firstName} onChange={handleChange} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input id="phone" placeholder="(123) 456-7890" value={formData.phone} onChange={handleChange} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Inquiry Type</Label>
                      <Select onValueChange={handleSelectChange} value={formData.inquiryType} required>
                        <SelectTrigger id="inquiryType">
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="translation">Translation Services</SelectItem>
                          <SelectItem value="evaluation">Evaluation Services</SelectItem>
                          <SelectItem value="order-status">Order Status</SelectItem>
                          <SelectItem value="support">Technical Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Please provide details about your inquiry..."
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Quick answers to common questions about contacting us
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">What is your typical response time?</h3>
              <p className="text-gray-600">
                We strive to respond to all inquiries within 24 business hours.
                For urgent matters, please call our customer service line.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">How can I check the status of my order?</h3>
              <p className="text-gray-600">
                You can check your order status by logging into your account on
                our website or by contacting our customer service team with your
                order number.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
