import React from 'react';

const TermsOfService = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
      <div className="prose max-w-none"> {/* Using prose for basic styling */}
        <p>
          Welcome to CreditEval, LLC ("CreditEval", "we", "us", or "our"). By
          accessing or using our website at https://www.crediteval.com ("Site")
          and the services provided, you agree to be bound by these Terms of
          Service ("Terms"). If you do not agree to these Terms, please do not
          use our Site.
        </p>

        <h2>1. Services</h2>
        <p>
          CreditEval provides credential evaluations and translation services
          for academic, professional, and immigration purposes. All services
          are provided based on the information you submit.
        </p>

        <h2>2. User Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate and complete information.</li>
          <li>
            Not misuse the Site or services for fraudulent or illegal
            activities.
          </li>
          <li>Use our services only for lawful and intended purposes.</li>
        </ul>

        <h2>3. Payment</h2>
        <p>
          All payments must be made in full before services are rendered. All
          sales are final unless otherwise stated in our refund policy.
        </p>

        <h2>4. Turnaround Time</h2>
        <p>
          Estimated delivery times are approximate. CreditEval is not liable
          for delays caused by third-party providers, document quality, or
          client response times.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          All content on this Site, including text, graphics, logos, and
          service content, is the property of CreditEval, LLC or its licensors
          and is protected by intellectual property laws.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          CreditEval is not liable for any indirect, incidental, or
          consequential damages arising from the use of our services. Our total
          liability shall not exceed the amount paid for the specific service.
        </p>

        <h2>7. Revisions and Refunds</h2>
        <p>
          We offer limited revisions as part of our service packages. Refunds
          are handled on a case-by-case basis. Please refer to our refund
          policy for more details.
        </p>

        <h2>8. Modifications</h2>
        <p>
          We may update these Terms at any time. Continued use of the Site
          after changes means you accept the new Terms.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Texas, without
          regard to its conflict of law provisions.
        </p>
      </div>
    </div>
  );
};

export default TermsOfService;
