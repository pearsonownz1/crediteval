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
import { CheckCircle, FileText, Award, BookOpen, School } from "lucide-react";

const EvaluationServices = () => {
  return (
    <div className="bg-white">
      {/* Header with navigation is in the Home component */}

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Professional Credential Evaluation Services
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Expert evaluation of international academic credentials for
              education, employment, and immigration
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
            <h2 className="text-3xl font-bold mb-4">Our Evaluation Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer comprehensive credential evaluation services tailored to
              your specific needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                  <FileText className="h-full w-full text-primary" />
                </div>
                <CardTitle>Document-by-Document Evaluation</CardTitle>
                <CardDescription>
                  Basic evaluation showing U.S. equivalency of your credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Degree Equivalency</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Employment Verification</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Immigration Purposes</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Professional Licensing</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>General Verification</span>
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
                <CardTitle>Course-by-Course Evaluation</CardTitle>
                <CardDescription>
                  Detailed evaluation of courses, grades, and credit hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>University Admissions</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Transfer Credits</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>GPA Calculation</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Credit Conversion</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Detailed Course Analysis</span>
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
                  <Award className="h-full w-full text-primary" />
                </div>
                <CardTitle>Professional Licensing Evaluation</CardTitle>
                <CardDescription>
                  Specialized evaluations for professional certification and
                  licensing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Medical Professionals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Engineers & Architects</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Teachers & Educators</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Legal Professionals</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Specialized Board Requirements</span>
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

      {/* Acceptance Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Widely Accepted Evaluations
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our credential evaluations are recognized and accepted by
              institutions across the United States
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <School className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Universities & Colleges</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Award className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Licensing Boards</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <FileText className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Government Agencies</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Employers</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <FileText className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Immigration Services</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Award className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Professional Associations</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <School className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Graduate Schools</h3>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <BookOpen className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-medium">Military Services</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Evaluation Process</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We follow a comprehensive process to ensure accurate and reliable
              credential evaluations
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-bold mb-2">Document Submission</h3>
              <p className="text-gray-600 text-sm">
                Upload your academic credentials through our secure portal
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-bold mb-2">Document Verification</h3>
              <p className="text-gray-600 text-sm">
                Our experts verify the authenticity of your documents
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-bold mb-2">Evaluation</h3>
              <p className="text-gray-600 text-sm">
                Thorough analysis and evaluation by credential specialists
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="font-bold mb-2">Report Delivery</h3>
              <p className="text-gray-600 text-sm">
                Comprehensive evaluation report delivered to you and your
                designated recipients
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
              Find answers to common questions about our credential evaluation
              services
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                What's the difference between Document-by-Document and
                Course-by-Course evaluations?
              </h3>
              <p className="text-gray-600">
                A Document-by-Document evaluation provides the U.S. equivalency
                of your degrees and diplomas, while a Course-by-Course
                evaluation includes a detailed analysis of all courses, credits,
                and grades converted to the U.S. system.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                Do I need to send original documents?
              </h3>
              <p className="text-gray-600">
                For most evaluations, we accept clear, legible copies of your
                documents. However, some institutions may require that we
                receive official documents directly from your educational
                institution.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                How long does the evaluation process take?
              </h3>
              <p className="text-gray-600">
                Our standard processing time is 7-10 business days from the
                receipt of all required documents. We also offer expedited
                services for an additional fee.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                Are your evaluations guaranteed to be accepted?
              </h3>
              <p className="text-gray-600">
                While our evaluations are widely accepted by educational
                institutions, employers, and government agencies across the
                U.S., the final decision for acceptance rests with the receiving
                institution or organization.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold mb-2">
                What if my documents are not in English?
              </h3>
              <p className="text-gray-600">
                Documents in languages other than English must be accompanied by
                certified English translations. We offer translation services if
                you need assistance with this requirement.
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
            Our team of credential evaluation experts is ready to help you
            achieve your educational and professional goals.
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

export default EvaluationServices;
