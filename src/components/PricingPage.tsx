import React from 'react';

const PricingPage: React.FC = () => {
  return (
    <section className="bg-gray-50 py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services & Pricing</h2>
        <p className="text-gray-600 text-lg mb-12">Choose the service that best fits your needs.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Certified Translations */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-semibold text-blue-600 mb-2">💼 Certified Translations</div>
              <p className="text-3xl font-semibold text-gray-900 mb-4">$24.99<span className="text-base font-medium text-gray-500"> / page</span></p> {/* Reduced font weight */}
              <ul className="text-left space-y-2 text-gray-700 mb-6">
                <li>✅ USCIS-Accepted</li>
                <li>✅ Certified Translator</li>
                <li>✅ Signed/Stamped Certification</li>
                <li>✅ Dedicated Support</li>
              </ul>
            </div>
            <a href="/order-wizard" className="mt-auto inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Order Translation</a>
          </div>

          {/* Credential Evaluations */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col justify-between border-2 border-blue-600">
            <div>
              <div className="text-2xl font-semibold text-blue-600 mb-2">🎓 Credential Evaluations</div>
              <p className="text-xl font-semibold text-gray-900">Diploma Evaluation – <span className="text-blue-600">$85</span></p> {/* Reduced font weight */}
              <p className="text-xl font-semibold text-gray-900 mb-4">Course-by-Course – <span className="text-blue-600">$150</span></p> {/* Reduced font weight */}
              <ul className="text-left space-y-2 text-gray-700 mb-6">
                <li>✅ USCIS & University Accepted</li>
                <li>✅ GPA & U.S. Equivalency</li>
                <li>✅ Electronic + Physical Copies</li>
                <li>✅ 2–3 Business Day Delivery</li>
              </ul>
            </div>
            <a href="/order-wizard" className="mt-auto inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Order Evaluation</a>
          </div>

          {/* Expert Opinion Letter */}
          <div className="bg-white rounded-2xl shadow p-8 flex flex-col justify-between">
            <div>
              <div className="text-2xl font-semibold text-blue-600 mb-2">🧠 Expert Opinion Letter</div>
              <p className="text-3xl font-semibold text-gray-900 mb-4">$599<span className="text-base font-medium text-gray-500"> / letter</span></p> {/* Reduced font weight */}
              <ul className="text-left space-y-2 text-gray-700 mb-6">
                <li>✅ For H-1B, O-1, EB-2 NIW, etc.</li>
                <li>✅ Written by Experts</li>
                <li>✅ USCIS-Tailored Language</li>
                <li>✅ 3–5 Business Days</li>
              </ul>
            </div>
            <a href="/order-wizard" className="mt-auto inline-block bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition">Order Expert Letter</a>
          </div>
        </div>

        {/* Benefits Comparison Section */}
        <div className="mt-16 pt-12 border-t border-gray-200">
          <h3 className="text-3xl font-bold text-gray-900 mb-8">Service Benefits Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {/* Certified Translations Benefits */}
            <div>
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Certified Translations</h4>
              <ul className="space-y-2 text-gray-700">
                <li>Guaranteed USCIS Acceptance</li>
                <li>Handled by Professional Certified Translators</li>
                <li>Includes Signed & Stamped Certification Page</li>
                <li>Dedicated Customer Support</li>
                <li>Secure Document Handling</li>
              </ul>
            </div>
            {/* Credential Evaluations Benefits */}
            <div>
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Credential Evaluations</h4>
              <ul className="space-y-2 text-gray-700">
                <li>Accepted by USCIS & Universities</li>
                <li>Includes GPA Calculation & U.S. Equivalency</li>
                <li>Provides Electronic & Physical Copies</li>
                <li>Fast Turnaround (2–3 Business Days Standard)</li>
                <li>Compliant with Academic Standards</li>
              </ul>
            </div>
            {/* Expert Opinion Letters Benefits */}
            <div>
              <h4 className="text-xl font-semibold text-blue-600 mb-4">Expert Opinion Letters</h4>
              <ul className="space-y-2 text-gray-700">
                <li>Specifically for USCIS Visa Petitions (H-1B, O-1, etc.)</li>
                <li>Written by Recognized Subject Matter Experts</li>
                <li>Letter Tailored to Specific Immigration Requirements</li>
                <li>Detailed Analysis and Justification</li>
                <li>Standard Delivery in 3–5 Business Days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPage;
