import React from 'react';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const RefundsPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Return & Refund Policy</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We aim for 100% satisfaction. However, due to the sensitive nature of electronic components, 
            we adhere to strict return guidelines to ensure quality for all customers.
          </p>
        </div>

        <div className="grid gap-8">
          
          {/* Visual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">7 Days Return</h3>
              <p className="text-sm text-gray-500 mt-2">Report issues within 7 days of delivery.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">Warranty Seals</h3>
              <p className="text-sm text-gray-500 mt-2">Must be intact. Do not remove films.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">Easy Refund</h3>
              <p className="text-sm text-gray-500 mt-2">To Bank or Wallet within 48 hours of QC.</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 text-gray-700 leading-relaxed space-y-8">
            
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Eligibility for Returns</h2>
              <p>Items are eligible for return if:</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>The product is dead on arrival (DOA).</li>
                <li>The wrong product was sent.</li>
                <li>The product has a manufacturing defect (e.g., touch issues, lines on display).</li>
              </ul>
              <div className="mt-4 p-4 bg-red-50 text-red-800 rounded-lg text-sm border border-red-100">
                <strong>CRITICAL:</strong> For Screens/Displays/Touch Digitizers, the warranty is void if the 
                <strong> protective film is removed</strong> or the <strong>warranty seal is broken</strong>. 
                Please test the display logic board <em>before</em> installing it permanently.
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Non-Returnable Items</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Products physically damaged during installation (e.g., flex cable tear, glass crack).</li>
                <li>Soldering equipment and consumables (paste, wire) once opened.</li>
                <li>Items marked as "Non-Returnable" or "Clearance" on the product page.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. The Process</h2>
              <ol className="list-decimal pl-5 space-y-3">
                <li>Go to <strong>My Account &gt; Orders</strong>.</li>
                <li>Select the order and click <strong>Return Item</strong>.</li>
                <li>Upload clear photos of the item showing the warranty seal and the defect.</li>
                <li>Our support team will approve the request within 24 hours.</li>
                <li>A courier will pick up the item.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Refund Methods</h2>
              <p>Once the item reaches our warehouse and passes Quality Check (QC):</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>TechParts Wallet:</strong> Instant credit (Use for future purchases).</li>
                <li><strong>Original Payment Source:</strong> 5-7 business days for Credit Cards/UPI.</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundsPage;