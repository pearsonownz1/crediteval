import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button'; // Assuming shadcn path alias
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, BookOpen, Briefcase, Award } from 'lucide-react';

const EmploymentUseCase = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-green-50 to-white"> {/* Changed color */}
        <div className="container text-center">
          <Briefcase className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            Use Case: Employment Visas & Professional Licensing
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Strengthen your U.S. employment visa petitions (H-1B, O-1, L-1, EB-1, EB-2 NIW) and professional license applications with expert evaluations and opinion letters.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
             <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/order-wizard?service=expert">Get Expert Opinion Letter</Link>
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
            <h2 className="text-3xl font-bold mb-4">Demonstrating Your Qualifications</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Proving your foreign education and experience meet U.S. standards is critical for employment-based immigration and professional licensing boards.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
             <Card className="text-center">
              <CardHeader>
                <Award className="h-10 w-10 text-primary mx-auto mb-3" />
                <CardTitle>Expert Opinion Letters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Letters from recognized field experts validating your specialized knowledge, skills, and the national importance of your work (crucial for O-1, EB-1, EB-2 NIW).
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
                  Determine the U.S. equivalency of your degrees and professional licenses, often required for H-1B petitions and state licensing boards (e.g., engineering, nursing).
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <FileText className="h-10 w-10 text-primary mx-auto mb-3" />
                <CardTitle>Certified Translations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Accurate translations of supporting documents like experience letters, licenses, and publications are essential for a complete application package.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Common Scenarios Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
           <div className="grid gap-12 md:grid-cols-2 items-center">
             <div>
              <h2 className="text-3xl font-bold mb-6">Supporting Your Career Goals</h2>
              <p className="text-gray-600 mb-6">
                Our services are designed to support various professional pathways:
              </p>
              <ul className="space-y-3 list-disc pl-5 text-gray-600">
                <li>H-1B Specialty Occupation Petitions</li>
                <li>O-1 Extraordinary Ability Visas</li>
                <li>EB-1 / EB-2 / EB-3 Permanent Residency Applications</li>
                <li>National Interest Waiver (NIW) Petitions</li>
                <li>State Professional Licensing (Medical, Engineering, Teaching, etc.)</li>
                <li>Employment Verification</li>
              </ul>
               <Button asChild variant="link" className="p-0 h-auto mt-4 text-primary">
                <Link to="/expert-opinion">Learn more about Expert Opinion Letters</Link>
              </Button>
            </div>
            <div>
              <img
                 src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1932&auto=format&fit=crop" // Replace with a relevant image
                alt="Professional working"
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

       {/* CTA Section */}
       <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Advance Your Career in the U.S.?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Let our experts help you prepare the necessary documentation for your employment visa or professional license application.
          </p>
          <Button asChild size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
            <Link to="/order-wizard">Start Your Order</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default EmploymentUseCase;
