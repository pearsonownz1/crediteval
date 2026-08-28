import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const CredentialEvaluationNewYork = () => {
  return (
    <div className="bg-white">
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Credential evaluations for New York employers and school
              applications
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              If a New York employer, university, or immigration attorney asked
              for a U.S. equivalency of a foreign degree, we write that report.
              This is not a NYSED teacher-certification evaluation.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/evaluation">
                <Button className="bg-primary hover:bg-primary/90">
                  See how the reports work
                </Button>
              </Link>
              <Link to="/order-wizard">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Start an order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              What this report is for — and what it is not
            </h2>
            <p className="text-gray-600 mb-4">
              We prepare document-by-document and course-by-course equivalency
              reports for jobs, school applications, and immigration packets. We
              do not claim NACES membership, and we do not send reports to the
              Office of Teaching Initiatives. If you need New York State teacher
              certification, use an organization on NYSED’s published list.
            </p>
            <p className="text-gray-600 mb-4">
              For every other use, the employer or school decides whether to
              accept the report. Ask them before you order.
            </p>
            <p className="text-gray-600">
              How the reports work is on{" "}
              <Link
                to="/evaluation"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                /evaluation
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CredentialEvaluationNewYork;
