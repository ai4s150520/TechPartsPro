import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Effective Date: November 28, 2025</p>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing TechParts Pro, you agree to be bound by these Terms of Service. 
                If you do not agree, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Accounts</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>
                  <strong>B2B Accounts:</strong> Sellers and wholesale buyers must provide accurate business information 
                  (GST, Business Name). Misrepresentation may result in account termination.
                </li>
                <li>We reserve the right to suspend accounts suspicious of fraud or policy abuse.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Product Information</h2>
              <p>
                We strive for accuracy, but we do not warrant that product descriptions, compatibility lists, or prices are error-free.
                In the event of a pricing error, we reserve the right to cancel orders placed at the incorrect price.
              </p>
              <p className="mt-2">
                <strong>Quality Grades:</strong> "Original", "OLED", "OEM", and "Copy" grades are defined in our Quality Guide. 
                Buyer accepts responsibility for selecting the appropriate grade.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Limitation of Liability</h2>
              <p>
                TechParts Pro shall not be liable for any indirect, incidental, or consequential damages resulting from 
                the use or inability to use our products. Our liability is limited to the purchase price of the product.
                <br /><br />
                We are not responsible for damage caused to mobile devices during the installation of parts purchased from us. 
                Professional installation is highly recommended.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Intellectual Property</h2>
              <p>
                All content on this site (images, text, logos) is the property of TechParts Pro or its content suppliers 
                and is protected by copyright laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Governing Law</h2>
              <p>
                These terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive 
                jurisdiction of the courts in Bangalore, Karnataka.
              </p>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsPage;