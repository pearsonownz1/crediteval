import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming shadcn path alias
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, BookOpen, ShieldCheck } from 'lucide-react';

const ImmigrationUseCase = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container text-center">
          <ShieldCheck className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Use Case: USCIS Immigration
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Ensure your immigration application is complete and compliant with accurate, USCIS-accepted certified translations and credential evaluations. Avoid delays and RFEs with our trusted services.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/order-wizard?service=translation">Translate Documents</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Link to="/order-wizard?service=evaluation">Evaluate Credentials</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Accurate Documents Matter for USCIS</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              USCIS requires precise translations and evaluations for foreign documents. Errors or omissions can lead to significant delays or even denials.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
                <CardTitle>Certified Translations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  We provide word-for-word translations of birth certificates, marriage certificates, diplomas, and more, complete with a Certificate of Translation Accuracy, guaranteed for USCIS acceptance.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
                <CardTitle>Credential Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our evaluations (Document-by-Document or Course-by-Course) determine the U.S. equivalency of your foreign education, crucial for visa petitions like H-1B, EB-2, and EB-3.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <CardTitle>Compliance & Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our team understands USCIS requirements, ensuring your documents are translated and evaluated correctly the first time, minimizing the risk of Requests for Evidence (RFEs).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Common Documents Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?q=80&w=1887&auto=format&fit=crop" // Replace with a relevant image
                alt="Immigration Documents"
                className="rounded-lg shadow-md"
              />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">Common Documents for Immigration</h2>
              <p className="text-gray-600 mb-6">
                We frequently translate and evaluate documents required for various immigration processes, including:
              </p>
              <ul className="space-y-3 list-disc pl-5 text-gray-600">
                <li>Birth Certificates</li>
                <li>Marriage Certificates & Divorce Decrees</li>
                <li>Academic Transcripts & Diplomas</li>
                <li>Passports & Visas</li>
                <li>Police Clearance Certificates</li>
                <li>Financial Statements</li>
                <li>Legal Contracts & Affidavits</li>
              </ul>
              <Button asChild variant="link" className="p-0 h-auto mt-4 text-primary">
                <Link to="/translation">Learn more about our Translation Services</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

       {/* CTA Section */}
       <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Your Immigration Application?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Get started with your certified translations or credential evaluations today. Ensure your USCIS application is accurate and complete.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
            <Link to="/order-wizard">Start Your Order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ImmigrationUseCase;
