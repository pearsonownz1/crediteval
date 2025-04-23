import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Privacy Policy</h1>
      <div className="prose max-w-none"> {/* Using prose for basic styling */}
        <p>
          CreditEval, LLC ("we", "us", or "our") respects your privacy and is
          committed to protecting your personal information. This Privacy Policy
          explains how we collect, use, and protect your data when you use
          https://www.crediteval.com.
        </p>

        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Personal Information:</strong> Name, email, phone, address,
            uploaded documents, and payment info.
          </li>
          <li>
            <strong>Usage Data:</strong> IP address, browser type, pages
            visited, and time spent on our site.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide services you request.</li>
          <li>Process payments.</li>
          <li>Improve our website and customer service.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your data. We only share your information with:
        </p>
        <ul>
          <li>
            Trusted service providers (e.g., payment processors, cloud
            storage).
          </li>
          <li>Government or legal authorities, when required by law.</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>
          We implement standard security measures to protect your data,
          including encryption and access controls. However, no method of
          transmission is 100% secure.
        </p>

        <h2>5. Cookies</h2>
        <p>
          We use cookies to enhance your browsing experience and analyze
          traffic. You can disable cookies in your browser settings.
        </p>

        <h2>6. Your Rights</h2>
        <p>You may request to:</p>
        <ul>
          <li>Access, correct, or delete your data.</li>
          <li>Opt out of certain data uses (e.g., marketing emails).</li>
        </ul>

        <h2>7. Third-Party Links</h2>
        <p>
          Our Site may contain links to external sites. We are not responsible
          for their privacy practices.
        </p>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this policy. Changes will be posted on this page with
          an updated effective date.
        </p>

        <h2>9. Contact Us</h2>
        <p>For questions, email us at support@crediteval.com</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
