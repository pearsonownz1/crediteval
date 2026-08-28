import { Link } from "react-router-dom";
import { Button } from "./ui/button";

const CertifiedTranslationsNewYork = () => {
  return (
    <div className="bg-white">
      <section className="relative py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Certified translations for New York court and USCIS filings
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              New York courts and USCIS both require an English translation.
              They do not use the same translator attestation.
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
              CPLR 2101(b) and 8 CFR 103.2(b)(3)
            </h2>
            <p className="text-gray-600 mb-4">
              New York court papers in a foreign language fall under CPLR
              2101(b). The English translation must come with an affidavit from
              the translator stating that the translation is accurate and that
              they are competent to translate.
            </p>
            <p className="text-gray-600 mb-4">
              USCIS filings fall under 8 CFR 103.2(b)(3). Any foreign-language
              document must come with a full English translation and a
              translator certification that it is complete and accurate, and
              that the translator is competent to translate into English.
            </p>
            <p className="text-gray-600 mb-4">
              Same translation. Two attestations, depending on where the filing
              goes. CreditEval prepares the certified translation online.
              Preview first. Pay when you are ready. We fulfill nationwide.
            </p>
            <p className="text-gray-600">
              For the upload and preview flow, see{" "}
              <Link
                to="/translation"
                className="text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Certified Translation
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CertifiedTranslationsNewYork;
