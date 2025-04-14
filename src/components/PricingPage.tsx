import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Star, X, FileSignature, Mail, DollarSign, Stamp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components

const PricingPage = () => {
  // Data for Certified Translations Tab
  const translationTiers = [
    {
      title: "Professional",
      price: "$25",
      unit: "USD / page",
      description: "Accurate, certified translations accepted by USCIS and other institutions.",
      features: [
        "Professional Certified Translator",
        "Signed/Stamped Certification",
        "Guaranteed Acceptance",
        "Dedicated Support Team",
      ],
      buttonText: "Order Translation",
      highlight: false,
    },
    {
      title: "Premium",
      price: "$35",
      unit: "USD / page",
      description: "Maximum accuracy and detail from top-tier translators.",
      features: [
        "Top 5% of Translators",
        "Maximum Accuracy & Detail",
        "Professional Certified Translator",
        "Signed/Stamped Certification",
        "Guaranteed Acceptance",
        "Dedicated Support Team",
      ],
      buttonText: "Order Translation",
      highlight: true,
    },
    {
      title: "Premium Plus",
      price: "$45",
      unit: "USD / page",
      description: "Expert industry-specific translation with secondary proofreading.",
      features: [
        "Expert Industry-Specific Translator",
        "Secondary Proofreader",
        "Top 5% of Translators",
        "Maximum Accuracy & Detail",
        "Professional Certified Translator",
        "Signed/Stamped Certification",
        "Guaranteed Acceptance",
        "Dedicated 24/7 Support",
      ],
      buttonText: "Order Translation",
      highlight: false,
    },
  ];

  const comparisonFeatures = [
    { feature: "Translation Style", certified: "Literal (word-for-word)", standard: "Interpretive (conveys meaning)" },
    { feature: "Delivery Format", certified: "PDF", standard: "Varies (DOCX, HTML)" },
    { feature: "Professional Translator", certified: true, standard: true },
    { feature: "Translation Revisions", certified: true, standard: true },
    { feature: "Document Formatting", certified: true, standard: "Optional" },
    { feature: "Signed & Stamped Certification", certified: true, standard: false },
    { feature: "Expedited Turnaround", certified: true, standard: true, optional: true },
    { feature: "Translation Notarization", certified: true, standard: false, optional: true },
    { feature: "Physical Copy", certified: true, standard: false, optional: true },
    { feature: "Translation Apostille", certified: true, standard: false, optional: true },
  ];

  const addOnServices = [
    {
      title: "Notarization",
      price: "$20",
      unit: "per order",
      description: "Adds notarization to the translation certification. Valid and accepted in all 50 States. Valid indefinitely—no expiration.",
      icon: FileSignature,
    },
    {
      title: "Physical Copy",
      price: "$20",
      unit: "per order",
      description: "Provides a wet-ink original copy mailed via 2-day express courier shipping. Overnight available. Ships within US or internationally.",
      icon: Mail,
    },
    {
      title: "Currency Conversion",
      price: "$15",
      unit: "per page",
      description: "Converts currency in financial documents based on the date of document issuance. Supports 150+ currencies. Available for documents issued after 2000.",
      icon: DollarSign,
    },
    {
      title: "Apostille",
      price: "$180",
      unit: "per document",
      description: "Provides an apostille certifying the signature and seal of the notary. Expedited processing available. Valid in all Hague Convention countries.",
      icon: Stamp,
    },
  ];

  const renderCheckOrX = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? <Check className="h-5 w-5 text-green-600 mx-auto" /> : <X className="h-5 w-5 text-red-600 mx-auto" />;
    }
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="w-full py-12 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Our Services & Pricing
          </h1>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Choose the service that best fits your needs.
          </p>
        </div>

        <Tabs defaultValue="translations" className="w-full">
          {/* Use flex layout for tabs, allow wrapping, add gap, center justify */}
          <TabsList className="flex flex-wrap justify-center gap-2 mb-12 h-auto">
            <TabsTrigger value="translations">Certified Translations</TabsTrigger>
            <TabsTrigger value="evaluations">Credential Evaluations</TabsTrigger>
            <TabsTrigger value="expert-letters">Expert Opinion Letters</TabsTrigger>
          </TabsList>

          {/* Translations Tab Content */}
          <TabsContent value="translations">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Certified Translation Pricing
              </h2>
              <p className="mt-3 text-md leading-7 text-gray-600">
                Accurate, certified translations accepted by USCIS and other institutions.
              </p>
            </div>
            {/* Service Tiers Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-16">
              {translationTiers.map((tier, index) => (
                <Card
                  key={index}
                  className={`flex flex-col rounded-lg shadow-lg overflow-hidden h-full ${
                    tier.highlight
                      ? "border-2 border-primary transform scale-105 z-10 bg-white"
                      : "bg-white border"
                  }`}
                >
                  <CardHeader className={`p-6 ${tier.highlight ? 'bg-primary/5' : ''}`}>
                    {tier.highlight && (
                      <div className="flex justify-center mb-2">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardTitle className={`text-2xl font-semibold mb-2 text-center ${tier.highlight ? 'text-primary' : 'text-gray-900'}`}>
                      {tier.title}
                    </CardTitle>
                    <div className={`flex items-baseline justify-center ${tier.highlight ? 'text-primary' : 'text-gray-900'}`}>
                      <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                      <span className="ml-1 text-sm font-semibold">{tier.unit}</span>
                    </div>
                    <CardDescription className="text-sm text-gray-500 text-center mt-1 h-10"> {/* Fixed height for alignment */}
                      {tier.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow p-6 space-y-4">
                    <Button
                      asChild
                      variant={tier.highlight ? "default" : "outline"}
                      className={`w-full ${tier.highlight ? 'bg-primary text-white hover:bg-primary/90' : 'text-primary border-primary hover:bg-primary/5'}`}
                    >
                      {/* Link might need adjustment based on how order wizard handles initial service type */}
                      <Link to="/order-wizard?service=translation">{tier.buttonText}</Link>
                    </Button>
                    <ul className={`space-y-3 pt-4 text-sm text-gray-700`}>
                      {tier.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start">
                          <Check className={`h-5 w-5 mr-2 mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-primary' : 'text-green-600'}`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator className="my-16" />

            {/* Feature Comparison Table Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                Compare Translation Services
              </h2>
              <Card className="overflow-hidden shadow-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100">
                      <TableHead className="w-[40%] px-6 py-4 text-left text-sm font-semibold text-gray-700">Feature</TableHead>
                      <TableHead className="w-[30%] px-6 py-4 text-center text-sm font-semibold text-gray-700">Certified Translation</TableHead>
                      <TableHead className="w-[30%] px-6 py-4 text-center text-sm font-semibold text-gray-700">Standard Translation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonFeatures.map((item, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <TableCell className="px-6 py-4 font-medium text-gray-800">{item.feature} {item.optional && <span className="text-xs text-gray-500 ml-1">(Optional Add-on)</span>}</TableCell>
                        <TableCell className="px-6 py-4 text-center">{renderCheckOrX(item.certified)}</TableCell>
                        <TableCell className="px-6 py-4 text-center">{renderCheckOrX(item.standard)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <Separator className="my-16" />

            {/* Optional Add-Ons Section */}
            <div className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">
                Optional Add-On Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {addOnServices.map((service, index) => (
                  <Card key={index} className="bg-white shadow-md overflow-hidden flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-semibold text-gray-800">{service.title}</CardTitle>
                      <service.icon className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="text-2xl font-bold text-gray-900">{service.price}</div>
                      <p className="text-xs text-gray-500 mb-3">{service.unit}</p>
                      <p className="text-sm text-gray-600">{service.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Evaluations Tab Content */}
          <TabsContent value="evaluations">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Credential Evaluation Pricing
              </h2>
              <p className="mt-3 text-md leading-7 text-gray-600">
                Verify your international education for US institutions and employers.
              </p>
            </div>
            {/* Placeholder for Evaluation Pricing Cards/Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
               <Card className="bg-white border shadow-lg">
                 <CardHeader>
                   <CardTitle>Document-by-Document</CardTitle>
                   <CardDescription>Basic verification of degree equivalency.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <p className="text-3xl font-bold mb-2">$85</p>
                   <ul className="space-y-2 text-sm text-gray-700 mb-4">
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Verifies US equivalency</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Lists degrees/diplomas</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Suitable for employment & immigration</span></li>
                   </ul>
                   <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
                     <Link to="/order-wizard?service=evaluation&type=document">Order Now</Link>
                   </Button>
                 </CardContent>
               </Card>
               <Card className="bg-white border shadow-lg">
                 <CardHeader>
                   <CardTitle>Course-by-Course</CardTitle>
                   <CardDescription>Detailed analysis including courses, grades, and GPA.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <p className="text-3xl font-bold mb-2">$150</p> {/* Placeholder price */}
                   <ul className="space-y-2 text-sm text-gray-700 mb-4">
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Includes Document-by-Document features</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Lists all courses & subjects</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Calculates US GPA</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Required for higher education & licensing</span></li>
                   </ul>
                   <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
                     <Link to="/order-wizard?service=evaluation&type=course">Order Now</Link>
                   </Button>
                 </CardContent>
               </Card>
            </div>
             {/* Add sections for evaluation add-ons or comparisons if needed */}
          </TabsContent>

          {/* Expert Opinion Letters Tab Content */}
          <TabsContent value="expert-letters">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Expert Opinion Letter Pricing
              </h2>
              <p className="mt-3 text-md leading-7 text-gray-600">
                Specialized letters for visa petitions and professional licensing.
              </p>
            </div>
             {/* Placeholder for Expert Letter Pricing Card */}
             <div className="flex justify-center mb-16">
               <Card className="bg-white border shadow-lg w-full max-w-md">
                 <CardHeader>
                   <CardTitle>Expert Opinion Letter</CardTitle>
                   <CardDescription>Tailored letters for specific visa or licensing requirements.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <p className="text-3xl font-bold mb-2">$599</p>
                   <ul className="space-y-2 text-sm text-gray-700 mb-4">
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Analysis by qualified experts</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Addresses specific visa/licensing criteria</span></li>
                     <li className="flex items-start"><Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-green-600" /><span>Suitable for H-1B, O-1, EB visas, etc.</span></li>
                   </ul>
                   <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
                     <Link to="/order-wizard?service=expert">Order Now</Link>
                   </Button>
                 </CardContent>
               </Card>
             </div>
             {/* Add sections for expert letter details or add-ons if needed */}
          </TabsContent>
        </Tabs>

        <Separator className="my-16" />

        {/* CTA Section (Remains the same) */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Begin your order or request a free quote today.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link to="/order-wizard">Start Your Order</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/quote">Request a Quote</Link>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
