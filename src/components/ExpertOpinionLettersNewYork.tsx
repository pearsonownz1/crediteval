import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const ExpertOpinionLettersNewYork = () => {
  return (
    <div className="bg-white">
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Expert Opinion Letters in New York
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              For people in New York who need an expert opinion letter for an
              NIW or another employment-based petition.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/order-wizard">
                <Button className="bg-primary hover:bg-primary/90">
                  Request Your Letter
                </Button>
              </Link>
              <Link to="/quote">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Get a Quote
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
              Expert opinion letters for New York petitioners
            </h2>
            <p className="text-gray-600 mb-4">
              If you are in New York and need an expert opinion letter for a
              National Interest Waiver or another employment-based petition,
              CreditEval writes that letter and delivers it to you. We fulfill
              nationwide, including online.
            </p>
            <p className="text-gray-600 mb-4">
              This page is for New York petitioners. It is not a local office
              listing. For what an NIW expert opinion letter covers, the letter
              packages, and how we match experts, see{" "}
              <Link
                to="/expert-opinion"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Expert Opinion Letter for NIW
              </Link>
              .
            </p>
            <p className="text-gray-600">
              Employment-based petitions beyond NIW can use the same request
              flow. Start a request or get a quote and we will match the letter
              to the petition type.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ExpertOpinionLettersNewYork;
