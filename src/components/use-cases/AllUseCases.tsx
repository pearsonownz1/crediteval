import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'; // Assuming shadcn path alias
import { ArrowRight, School, Briefcase, ShieldCheck } from 'lucide-react'; // Example icons

const useCases = [
  {
    title: "USCIS Immigration",
    description: "Navigate the complexities of U.S. immigration with accurately translated and evaluated documents accepted by USCIS.",
    link: "/use-cases/immigration",
    icon: <ShieldCheck className="h-8 w-8 text-primary mb-2" />,
  },
  {
    title: "Academic Admissions",
    description: "Meet university and college admission requirements with certified translations and credential evaluations.",
    link: "/use-cases/academic",
    icon: <School className="h-8 w-8 text-primary mb-2" />,
  },
  {
    title: "Employment Visas",
    description: "Support your work visa petitions (H-1B, O-1, EB-2 NIW, etc.) with expert opinion letters and credential evaluations.",
    link: "/use-cases/employment",
    icon: <Briefcase className="h-8 w-8 text-primary mb-2" />,
  },
  // Add more use cases here if needed
];

const AllUseCases = () => {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white py-16">
      <div className="container">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
            How CreditEval Helps You Succeed
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Our expert translation, evaluation, and opinion letter services are tailored to meet the specific requirements of various applications. Explore common use cases below.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase) => (
            <Card key={useCase.title} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                {useCase.icon}
                <CardTitle>{useCase.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{useCase.description}</CardDescription>
              </CardContent>
              <div className="p-6 pt-0 mt-auto"> {/* Use CardFooter styling without the component for flex alignment */}
                <Link
                  to={useCase.link}
                  className="text-sm font-medium text-primary hover:text-primary/80 flex items-center"
                >
                  Learn More <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllUseCases;
