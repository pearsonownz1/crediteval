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
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
// Removed Separator import
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  MessageCircle,
  Shield,
  // Removed ChevronDown import
} from "lucide-react";
import TestimonialCarousel from "./TestimonialCarousel"; // Import the carousel component
import LiveSocialProof from "./LiveSocialProof"; // Import the new component
// Ensure DegreeEvaluationCarousel import is removed

const Home = () => {
  return (
    <div className="bg-white">
      {/* Header removed - Handled by Layout component */}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 md:py-32">
        <div className="container relative z-10">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900">
                Credential Evaluation & Translation Services
              </h1>
              <p className="text-lg text-gray-600 max-w-md">
                Fast, accurate, and trusted document translation and credential
                evaluation for immigration, education, and employment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Link to="/order-wizard">Start Your Order</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/quote">Get My Quote</Link>
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>USCIS Accepted</span>
                <CheckCircle className="h-5 w-5 text-green-500 ml-4" />
                <span>Fast Turnaround</span>
                <CheckCircle className="h-5 w-5 text-green-500 ml-4" />
                <span>Secure Process</span>
              </div>
            </motion.div>
            {/* Use the static hero.png image */}
            <div className="relative hidden md:flex justify-center items-center">
               <img
                 src="/hero.png"
                 alt="Hero Image"
                 className="rounded-xl shadow-lg w-full max-w-lg" // Adjusted max-width
               />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Carousel Section */}
      <TestimonialCarousel />

      {/* Services Overview */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive document translation and credential evaluation
              services tailored to your specific needs.
            </p>
          </div>

          <Tabs defaultValue="translation" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="translation">
                  Translation Services
                </TabsTrigger>
                <TabsTrigger value="evaluation">
                  Evaluation Services
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="translation" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                      <FileText className="h-full w-full text-primary" />
                    </div>
                    <CardTitle>Certified Translations</CardTitle>
                    <CardDescription>
                      USCIS-accepted certified translations for all your
                      official documents.
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
                        <span>Diplomas & Transcripts</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/translation/certified">Learn More</Link>
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
                      academic records.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Transcripts & Diplomas</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Course Descriptions</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Academic Records</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/translation/academic">Learn More</Link>
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
                      paperwork.
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
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/translation/legal">Learn More</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              <div className="flex justify-center mt-8">
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/translation">
                    View All Translation Services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="evaluation" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                      <FileText className="h-full w-full text-primary" />
                    </div>
                    <CardTitle>Document-by-Document</CardTitle>
                    <CardDescription>
                      Basic evaluation showing U.S. equivalency of your
                      credentials.
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
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/evaluation/document">Learn More</Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                      <BookOpen className="h-full w-full text-primary" />
                    </div>
                    <CardTitle>Course-by-Course</CardTitle>
                    <CardDescription>
                      Detailed evaluation of courses, grades, and credit hours.
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
                        <span>Professional Licensing</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/evaluation/course">Learn More</Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                      <Award className="h-full w-full text-primary" />
                    </div>
                    <CardTitle>Professional Licensing</CardTitle>
                    <CardDescription>
                      Specialized evaluations for professional certification and
                      licensing.
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
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link to="/evaluation/professional">Learn More</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              <div className="flex justify-center mt-8">
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/evaluation">
                    View All Evaluation Services
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our simple, streamlined process makes it easy to get your
              documents translated and evaluated.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-lg shadow-sm text-center"
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-bold mb-2">Request a Quote</h3>
              <p className="text-gray-600 text-sm">
                Fill out our simple quote form to get a price estimate for your
                documents.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-lg shadow-sm text-center"
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-bold mb-2">Upload Documents</h3>
              <p className="text-gray-600 text-sm">
                Securely upload your documents through our easy-to-use portal.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-lg shadow-sm text-center"
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-bold mb-2">Processing</h3>
              <p className="text-gray-600 text-sm">
                Our experts translate and evaluate your documents with precision
                and care.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white p-6 rounded-lg shadow-sm text-center"
            >
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="font-bold mb-2">Delivery</h3>
              <p className="text-gray-600 text-sm">
                Receive your completed documents digitally or by mail, ready for
                use.
              </p>
            </motion.div>
          </div>

          <div className="flex justify-center mt-12">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary/90"
            >
              <Link to="/order-wizard">Start Your Order Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Our Clients Say</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trusted by thousands of clients for accurate and timely document
              services.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
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
                  "CreditEval made my university application process so much
                  easier. Their course-by-course evaluation was accepted without
                  question, and their customer service was excellent."
                </p>
                {/* Avatar section removed */}
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardContent className="pt-6">
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
                  "I needed certified translations for my immigration
                  application, and CreditEval delivered them quickly and
                  accurately. USCIS accepted them without any issues."
                </p>
                {/* Avatar section removed */}
              </CardContent>
            </Card>

            <Card className="bg-gray-50">
              <CardContent className="pt-6">
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
                  "As a medical professional, I needed a detailed evaluation of
                  my credentials. CreditEval's professional licensing evaluation
                  was thorough and helped me secure my certification."
                </p>
                {/* Avatar section removed */}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4 items-center">
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold mb-1">USCIS Accepted</h3>
              <p className="text-sm text-gray-600">
                All our translations and evaluations are accepted by USCIS.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Award className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Certified Experts</h3>
              <p className="text-sm text-gray-600">
                Our team consists of certified translators and evaluators.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <Clock className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold mb-1">Fast Turnaround</h3>
              <p className="text-sm text-gray-600">
                Get your documents in as little as 24-48 hours.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-bold mb-1">24/7 Support</h3>
              <p className="text-sm text-gray-600">
                Our customer support team is always available to help.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Our team of experts is ready to help you with your document
            translation and evaluation needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Link to="/quote">Get My Quote</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-gray-100"
            >
              <Link to="/order-wizard">Start Your Order</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer removed - Handled by Layout component */}

      {/* Live Social Proof Popup */}
      <div className="fixed bottom-4 left-4 z-50">
        <LiveSocialProof />
      </div>
    </div>
  );
};

export default Home;
