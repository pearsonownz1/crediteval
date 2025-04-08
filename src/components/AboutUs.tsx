import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  CheckCircle,
  Award,
  Shield,
  Globe,
  Users,
  Clock,
  Building,
} from "lucide-react";

const AboutUs = () => {
  return (
    <div className="bg-white">
      {/* Header with navigation is in the Home component */}

      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              About CreditEval
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Trusted experts in credential evaluation and document translation
              services since 2005
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 mb-4">
                Founded in 2005, CreditEval began with a simple mission: to help
                international students and professionals navigate the complex
                process of having their educational credentials recognized in
                the United States.
              </p>
              <p className="text-gray-600 mb-4">
                What started as a small team of education experts has grown into
                a trusted organization serving thousands of clients annually
                from over 180 countries. Our founders, having experienced the
                challenges of credential recognition firsthand as international
                students, built CreditEval on the principles of accuracy,
                integrity, and exceptional customer service.
              </p>
              <p className="text-gray-600">
                Today, we're proud to be one of the leading credential
                evaluation and translation services in the country, helping
                individuals achieve their educational and professional goals
                through our comprehensive services.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                alt="CreditEval Team"
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    Serving clients from 180+ countries
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission & Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Guided by our commitment to excellence and integrity in everything
              we do
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-4">Our Mission</h3>
              <p className="text-gray-600 mb-6">
                To provide accurate, timely, and reliable credential evaluation
                and translation services that help individuals achieve their
                educational and professional goals in the United States.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>
                    Empowering international students and professionals
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>Facilitating academic and career advancement</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  <span>
                    Supporting immigration and professional licensing processes
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-bold mb-4">Our Values</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Shield className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Integrity</span>
                    <p className="text-sm text-gray-600">
                      We uphold the highest ethical standards in all our
                      evaluations and translations.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Award className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Excellence</span>
                    <p className="text-sm text-gray-600">
                      We strive for accuracy and quality in every document we
                      process.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Clock className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Efficiency</span>
                    <p className="text-sm text-gray-600">
                      We respect our clients' time with prompt and reliable
                      service.
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Empathy</span>
                    <p className="text-sm text-gray-600">
                      We understand the challenges our clients face and provide
                      supportive guidance.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Leadership Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the experienced professionals who lead our organization
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
                  alt="Michael Chen"
                />
                <AvatarFallback>MC</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">Michael Chen, Ph.D.</h3>
              <p className="text-primary font-medium mb-2">Founder & CEO</p>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Former international education advisor with 20+ years of
                experience in credential evaluation and academic administration.
              </p>
            </div>

            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                  alt="Sarah Rodriguez"
                />
                <AvatarFallback>SR</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">Sarah Rodriguez, M.Ed.</h3>
              <p className="text-primary font-medium mb-2">
                Director of Evaluations
              </p>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Specialized in international credential evaluation with
                expertise in educational systems across Latin America, Europe,
                and Asia.
              </p>
            </div>

            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=David"
                  alt="David Okonkwo"
                />
                <AvatarFallback>DO</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold">David Okonkwo, MBA</h3>
              <p className="text-primary font-medium mb-2">
                Director of Operations
              </p>
              <p className="text-sm text-gray-600 max-w-xs mx-auto">
                Oversees day-to-day operations with a focus on process
                efficiency and exceptional customer service delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Credentials & Memberships */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Our Credentials & Memberships
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              CreditEval maintains active memberships in key professional
              organizations
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-medium">NACES®</h3>
              <p className="text-sm text-gray-600 mt-2">
                National Association of Credential Evaluation Services
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-medium">AACRAO</h3>
              <p className="text-sm text-gray-600 mt-2">
                American Association of Collegiate Registrars and Admissions
                Officers
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Building className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-medium">NAFSA</h3>
              <p className="text-sm text-gray-600 mt-2">
                Association of International Educators
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-medium">ATA</h3>
              <p className="text-sm text-gray-600 mt-2">
                American Translators Association
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Hear from individuals who have successfully used our services
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 fill-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                "CreditEval's course-by-course evaluation was instrumental in my
                acceptance to a top U.S. university. Their detailed report
                accurately reflected my academic achievements and made the
                admission process smooth."
              </p>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena"
                    alt="Elena K."
                  />
                  <AvatarFallback>EK</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Elena K.</p>
                  <p className="text-sm text-gray-500">
                    Graduate Student from Russia
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 fill-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                "As a medical professional seeking licensure in the U.S., I
                needed a precise evaluation of my credentials. CreditEval
                delivered a comprehensive report that met all the requirements
                of my state's medical board."
              </p>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
                    alt="Carlos M."
                  />
                  <AvatarFallback>CM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Carlos M.</p>
                  <p className="text-sm text-gray-500">Physician from Brazil</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 fill-yellow-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 italic mb-6">
                "I needed certified translations of multiple documents for my
                immigration application. CreditEval provided fast, accurate
                translations that were accepted by USCIS without any issues."
              </p>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha"
                    alt="Aisha N."
                  />
                  <AvatarFallback>AN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Aisha N.</p>
                  <p className="text-sm text-gray-500">Immigration Applicant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Let our team of experts help you with your credential evaluation and
            translation needs.
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

export default AboutUs;
