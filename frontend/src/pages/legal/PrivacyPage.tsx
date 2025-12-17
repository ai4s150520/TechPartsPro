import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: November 28, 2025</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p>
                At TechParts Pro ("we", "our", or "us"), we are committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website 
                and use our services, including our B2B Seller Platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Personal Data:</strong> Name, email address, phone number, and shipping address when you register or place an order.
                </li>
                <li>
                  <strong>Business Data (For Sellers):</strong> GST/Tax ID, business name, and bank account details for payouts.
                </li>
                <li>
                  <strong>Financial Data:</strong> Payment method details (processed securely via Stripe/Razorpay; we do not store full card numbers).
                </li>
                <li>
                  <strong>Usage Data:</strong> IP address, browser type, and device information for security and analytics.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p>We use the collected data for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Processing and fulfilling your orders.</li>
                <li>Verifying business identities for wholesale pricing tiers.</li>
                <li>Sending order updates, invoices, and security alerts.</li>
                <li>Detecting and preventing fraud (e.g., verifying IP addresses during checkout).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
              <p>
                We implement industry-standard security measures, including SSL encryption for data in transit and AES-256 encryption 
                for sensitive data at rest. Access to personal data is restricted to authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Third-Party Sharing</h2>
              <p>
                We do not sell your data. We share data only with necessary service providers:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Logistics Partners:</strong> (e.g., FedEx, BlueDart) to deliver your package.</li>
                <li><strong>Payment Gateways:</strong> To process transactions.</li>
                <li><strong>Cloud Infrastructure:</strong> (e.g., AWS) to host our services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact Us</h2>
              <p>
                If you have questions about this policy, please contact our Data Protection Officer at:
                <br />
                <a href="mailto:privacy@techpartspro.com" className="text-blue-600 hover:underline">privacy@techpartspro.com</a>
              </p>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;