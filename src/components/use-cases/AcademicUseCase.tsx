import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming shadcn path alias
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, BookOpen, School } from 'lucide-react';

const AcademicUseCase = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-purple-50 to-white"> {/* Changed color */}
        <div className="container text-center">
          <School className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Use Case: Academic Admissions & Transfer
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Apply to U.S. universities and transfer credits seamlessly with meticulously evaluated academic credentials and precisely translated documents.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/order-wizard?service=evaluation">Evaluate Credentials</Link>
            </Button>
             <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Link to="/order-wizard?service=translation">Translate Documents</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why It Matters Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meeting Academic Requirements</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              U.S. educational institutions have strict requirements for foreign academic records. Our services ensure your application meets these standards.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
             <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
                <CardTitle>Course-by-Course Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Provides a detailed breakdown of your courses, credits, grades, and U.S. GPA equivalency, essential for university admissions and credit transfer.
                </p>
              </CardContent>
            </Card>
             <Card className="text-center">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
                <CardTitle>Academic Translations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Accurate, certified translations of your transcripts, diplomas, and course descriptions ensure admissions committees understand your qualifications.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <CardTitle>Institution Acceptance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Our evaluations and translations are widely accepted by universities, colleges, and credentialing agencies across the United States.
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
              <h2 className="text-3xl font-bold mb-6">Common Documents for Academia</h2>
              <p className="text-gray-600 mb-6">
                We specialize in handling academic documents such as:
              </p>
              <ul className="space-y-3 list-disc pl-5 text-gray-600">
                <li>University Transcripts</li>
                <li>Diplomas and Degree Certificates</li>
                <li>Course Syllabi and Descriptions</li>
                <li>Secondary School Records</li>
                <li>Letters of Recommendation (Translation)</li>
                <li>Research Papers & Theses (Translation)</li>
              </ul>
               <Button asChild variant="link" className="p-0 h-auto mt-4 text-primary">
                <Link to="/evaluation">Learn more about our Evaluation Services</Link>
              </Button>
            </div>
             <div>
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1740&auto=format&fit=crop" // Replace with a relevant image
                alt="Academic Documents"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

       {/* CTA Section */}
       <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready for Your Academic Journey?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Submit your documents for evaluation or translation and take the next step towards your educational goals in the U.S.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
            <Link to="/order-wizard">Start Your Order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AcademicUseCase;
