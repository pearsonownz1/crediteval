import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { CheckCircle, FileText, Globe, BookOpen } from "lucide-react";

const TranslationServices = () => {
  return (
    <div className="bg-white">
      {/* Header with navigation is in the Home component */}

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Professional Document Translation Services
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Accurate, certified translations for academic, legal, and
              immigration purposes
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/order">Start Your Order</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Our Translation Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer a comprehensive range of translation services to meet
              your specific needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                  <FileText className="h-full w-full text-primary" />
                </div>
                <CardTitle>Certified Translations</CardTitle>
                <CardDescription>
                  USCIS-accepted certified translations for all your official
                  documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Birth Certificates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Marriage Certificates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Divorce Decrees</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Death Certificates</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Adoption Papers</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/order">Order Now</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                  <BookOpen className="h-full w-full text-primary" />
                </div>
                <CardTitle>Academic Translations</CardTitle>
                <CardDescription>
                  Specialized translations for educational documents and
                  academic records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Diplomas & Degrees</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Transcripts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Course Descriptions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Letters of Recommendation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Research Papers</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/order">Order Now</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                  <Globe className="h-full w-full text-primary" />
                </div>
                <CardTitle>Legal Translations</CardTitle>
                <CardDescription>
                  Precise translations for legal documents and official
                  paperwork
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Contracts & Agreements</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Court Documents</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Immigration Documents</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Powers of Attorney</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Affidavits</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/order">Order Now</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Languages We Support</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our team of professional translators covers a wide range of
              languages
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              "Spanish",
              "French",
              "German",
              "Italian",
              "Portuguese",
              "Russian",
              "Chinese",
              "Japanese",
              "Korean",
              "Arabic",
              "Hindi",
              "Vietnamese",
              "Dutch",
              "Greek",
              "Polish",
              "Turkish",
            ].map((language) => (
              <div
                key={language}
                className="bg-white p-4 rounded-lg shadow-sm flex items-center"
              >
                <Globe className="h-5 w-5 text-primary mr-2" />
                <span>{language}</span>
              </div>
            ))}
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            Don't see your language? Contact us for availability of additional
            languages.
          </p>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Translation Process</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We follow a rigorous process to ensure the highest quality
              translations
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-bold mb-2">Document Submission</h3>
              <p className="text-gray-600 text-sm">
                Upload your documents through our secure portal
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-bold mb-2">Translation</h3>
              <p className="text-gray-600 text-sm">
                Our expert translators work on your documents with precision
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-bold mb-2">Quality Review</h3>
              <p className="text-gray-600 text-sm">
                Thorough review and quality assurance by senior translators
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="font-bold mb-2">Certification & Delivery</h3>
              <p className="text-gray-600 text-sm">
                Documents are certified and delivered to you digitally or by
                mail
              </p>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link to="/order">Start Your Order Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our translation services
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                What is a certified translation?
              </h3>
              <p className="text-gray-600">
                A certified translation includes the translated document along
                with a signed certificate of accuracy stating that the
                translation is complete and accurate to the best of the
                translator's knowledge and ability.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                Are your translations accepted by USCIS?
              </h3>
              <p className="text-gray-600">
                Yes, all our translations comply with USCIS requirements and
                include the necessary certification statement required for
                immigration purposes.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                How quickly can I get my documents translated?
              </h3>
              <p className="text-gray-600">
                Our standard turnaround time is 3-5 business days. We also offer
                expedited services with 24-48 hour delivery for urgent needs.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                Do I need to send my original documents?
              </h3>
              <p className="text-gray-600">
                No, you can upload clear scans or photos of your documents
                through our secure portal. We do not require original documents
                for translation.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                How do I receive my translated documents?
              </h3>
              <p className="text-gray-600">
                You can choose to receive your translated documents digitally
                via email, or we can mail hard copies to your address. Both
                digital and physical copies are certified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Our team of expert translators is ready to help you with your
            document translation needs.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-white text-primary hover:bg-gray-100"
          >
            <Link to="/order">Start Your Order</Link>
          </Button>
        </div>
      </section>

      {/* Footer is in the Home component */}
    </div>
  );
};

export default TranslationServices;
