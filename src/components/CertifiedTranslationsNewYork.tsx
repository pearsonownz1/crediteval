import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const CertifiedTranslationsNewYork = () => {
  return (
    <div className="bg-white">
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Certified Translations in New York
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              For people in New York who need a USCIS-accepted certified
              translation. Preview first. Pay when you are ready.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/translation">
                <Button className="bg-primary hover:bg-primary/90">
                  See the translation flow
                </Button>
              </Link>
              <Link to="/order-wizard?service=translation">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Start a free order
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
              Certified translations for New York customers
            </h2>
            <p className="text-gray-600 mb-4">
              If you are in New York and need a USCIS-accepted certified
              translation, CreditEval prepares that translation and lets you
              preview it before you pay. We fulfill nationwide, including
              online.
            </p>
            <p className="text-gray-600 mb-4">
              This page is for New York customers. It is not a local office
              listing. For the preview-first flow, the documents we accept, and
              how to start, see{" "}
              <Link
                to="/translation"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Certified Translation
              </Link>
              .
            </p>
            <p className="text-gray-600">
              Upload the document, review a watermarked preview, and unlock the
              final certified PDF when you are ready. Notarization and mailing
              are optional at checkout.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CertifiedTranslationsNewYork;
