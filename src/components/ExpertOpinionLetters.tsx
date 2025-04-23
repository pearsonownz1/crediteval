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
import { Separator } from "./ui/separator";
import {
  CheckCircle,
  FileText,
  Award,
  BookOpen,
  Star,
  Briefcase,
  Users,
} from "lucide-react";

const ExpertOpinionLetters = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Expert Opinion Letters for NIW
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Strengthen your National Interest Waiver petition with customized
              expert opinion letters
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {/* Workaround: Wrap Button inside Link */}
              <Link to="/order-wizard">
                <Button className="bg-primary hover:bg-primary/90">
                  Request Your Letter
                </Button>
              </Link>
              {/* Workaround: Wrap Button inside Link */}
              <Link to="/quote">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                  Get a Quote
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                What Are NIW Expert Opinion Letters?
              </h2>
              <p className="text-gray-600 mb-4">
                Expert Opinion Letters are crucial supporting documents for
                National Interest Waiver (NIW) petitions. These letters are
                written by recognized experts in your field who can attest to
                your exceptional abilities and the national importance of your
                work.
              </p>
              <p className="text-gray-600 mb-4">
                Our expert opinion letters are meticulously crafted to highlight
                how your work substantially benefits the United States,
                demonstrating that waiving the labor certification requirement
                is in the national interest.
              </p>
              <p className="text-gray-600">
                Each letter is customized to your specific achievements,
                research, and contributions, providing compelling evidence for
                USCIS officers reviewing your petition.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4 text-primary">
                Why Expert Opinion Letters Matter
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <Star className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Third-Party Validation</span>
                    <p className="text-sm text-gray-600">
                      Independent verification of your exceptional abilities
                      from recognized authorities
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Award className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Credibility Enhancement</span>
                    <p className="text-sm text-gray-600">
                      Strengthens your petition with expert testimony about your
                      work's significance
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Briefcase className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">USCIS Requirements</span>
                    <p className="text-sm text-gray-600">
                      Addresses specific NIW criteria that USCIS officers look
                      for in successful petitions
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="h-5 w-5 text-primary mr-3 mt-0.5" />
                  <div>
                    <span className="font-medium">Competitive Edge</span>
                    <p className="text-sm text-gray-600">
                      Distinguishes your petition from others by providing
                      compelling expert endorsements
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Our Expert Opinion Letter Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Comprehensive solutions tailored to your NIW petition needs
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 p-3 mb-2">
                  <FileText className="h-full w-full text-primary" />
                </div>
                <CardTitle>Standard NIW Letter</CardTitle>
                <CardDescription>
                  Professional expert opinion letter for National Interest
                  Waiver petitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>5-6 page comprehensive letter</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Written by field experts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Addresses all NIW criteria</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Customized to your achievements</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Delivery within 2 weeks</span>
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
                <CardTitle>Premium NIW Letter</CardTitle>
                <CardDescription>
                  Enhanced expert opinion with additional supporting evidence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>7-8 page detailed letter</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Written by senior experts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>In-depth analysis of your work</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Comparative assessment</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Expedited delivery (10 days)</span>
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
                  <Star className="h-full w-full text-primary" />
                </div>
                <CardTitle>Elite NIW Package</CardTitle>
                <CardDescription>
                  Comprehensive solution with multiple expert letters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>3 expert opinion letters</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>From diverse industry experts</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Complementary perspectives</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Strategic petition guidance</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <span>Priority service (7 days)</span>
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

      {/* Process Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Our Expert Letter Process
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A streamlined approach to creating powerful NIW expert opinion
              letters
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-4">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">1</span>
              </div>
              <h3 className="font-bold mb-2">Initial Consultation</h3>
              <p className="text-gray-600 text-sm">
                We assess your background, achievements, and NIW petition
                strategy
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">2</span>
              </div>
              <h3 className="font-bold mb-2">Expert Matching</h3>
              <p className="text-gray-600 text-sm">
                We pair you with qualified experts in your specific field
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">3</span>
              </div>
              <h3 className="font-bold mb-2">Letter Development</h3>
              <p className="text-gray-600 text-sm">
                Experts craft detailed letters highlighting your exceptional
                abilities
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-bold">4</span>
              </div>
              <h3 className="font-bold mb-2">Review & Delivery</h3>
              <p className="text-gray-600 text-sm">
                Final review, expert signature, and delivery of your customized
                letters
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

      {/* Expert Profiles */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Expert Network</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We collaborate with recognized authorities across diverse fields
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-2">Academic Experts</h3>
              <p className="text-gray-600 mb-4">
                Professors and researchers from prestigious universities with
                extensive publication records and recognition in their fields.
              </p>
              <div className="text-sm text-gray-600">
                <p className="mb-1">
                  <span className="font-medium">Fields include:</span>{" "}
                  Engineering, Computer Science, Medicine, Physics, Chemistry,
                  Biology, Economics
                </p>
                <p>
                  <span className="font-medium">Credentials:</span> Ph.D.
                  holders, department chairs, research directors
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-2">Industry Professionals</h3>
              <p className="text-gray-600 mb-4">
                Senior executives and technical leaders from Fortune 500
                companies and innovative startups with proven track records.
              </p>
              <div className="text-sm text-gray-600">
                <p className="mb-1">
                  <span className="font-medium">Fields include:</span>{" "}
                  Technology, Finance, Healthcare, Energy, Manufacturing,
                  Telecommunications
                </p>
                <p>
                  <span className="font-medium">Credentials:</span> CTOs,
                  Directors, Senior Engineers, Industry Pioneers
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-2">
                Specialized Authorities
              </h3>
              <p className="text-gray-600 mb-4">
                Recognized experts in niche fields with specialized knowledge
                and significant contributions to their domains.
              </p>
              <div className="text-sm text-gray-600">
                <p className="mb-1">
                  <span className="font-medium">Fields include:</span>{" "}
                  Artificial Intelligence, Renewable Energy, Biotechnology,
                  Cybersecurity, Sustainable Agriculture
                </p>
                <p>
                  <span className="font-medium">Credentials:</span> Patent
                  holders, award winners, published authors, conference speakers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Common questions about our NIW expert opinion letter services
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">
                Who will write my expert opinion letter?
              </h3>
              <p className="text-gray-600">
                Your letter will be written by a qualified expert in your
                specific field who has the credentials and experience to
                evaluate your work. We carefully match you with experts who can
                provide the most compelling and credible assessment of your
                abilities and contributions.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">
                How many expert opinion letters do I need for my NIW petition?
              </h3>
              <p className="text-gray-600">
                While there is no specific requirement, most successful NIW
                petitions include 3-5 expert opinion letters. Having multiple
                letters from diverse experts strengthens your case by providing
                different perspectives on your exceptional abilities and the
                national importance of your work.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">
                What information do I need to provide for my expert letter?
              </h3>
              <p className="text-gray-600">
                You'll need to provide your CV/resume, research papers or work
                samples, a summary of your achievements, and any other relevant
                documentation that demonstrates your expertise and
                contributions. The more comprehensive information you provide,
                the more detailed and effective your expert letter will be.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">
                How long does it take to complete an expert opinion letter?
              </h3>
              <p className="text-gray-600">
                Our standard turnaround time is 2 weeks for regular service. We
                also offer expedited options that can deliver your letter in
                7-10 days. Complex cases or packages with multiple letters may
                require additional time to ensure quality and thoroughness.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-bold mb-2">
                Will the expert be available for follow-up questions from USCIS?
              </h3>
              <p className="text-gray-600">
                Yes, our experts remain available to respond to any inquiries
                from USCIS regarding their opinion letters. This ongoing support
                is included in our service and ensures that your petition
                maintains its credibility throughout the review process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Strengthen Your NIW Petition?
          </h2>
          <p className="max-w-2xl mx-auto mb-8">
            Our expert opinion letters provide the credible third-party
            validation that can make the difference in your National Interest
            Waiver petition.
          </p>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="bg-white text-primary hover:bg-gray-100"
          >
            <Link to="/order">Request Your Expert Letter</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ExpertOpinionLetters;
