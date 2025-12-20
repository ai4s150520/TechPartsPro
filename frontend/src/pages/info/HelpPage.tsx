import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    id: 1,
    category: 'Orders',
    question: "Where is my order?",
    answer: "You can track your order by going to 'My Account' > 'Orders'. We also send email updates with tracking numbers as soon as your package ships."
  },
  {
    id: 2,
    category: 'Orders',
    question: "Can I cancel my order?",
    answer: "You can cancel your order within 1 hour of placing it directly from the Orders page. After that, it may have already been processed by our warehouse."
  },
  {
    id: 3,
    category: 'Shipping',
    question: "Do you ship internationally?",
    answer: "Currently, we ship to all locations within India and select countries in Southeast Asia. International shipping costs are calculated at checkout."
  },
  {
    id: 4,
    category: 'Returns',
    question: "What is your return policy?",
    answer: "We accept returns for defective items within 3 days of delivery. The item must be in original condition with the warranty seal intact. Please visit the Returns page to initiate a request."
  },
  {
    id: 5,
    category: 'Account',
    question: "How do I become a seller?",
    answer: "Click on 'Become a Seller' in the footer or header. You will need to provide your GST number and business details. Approval typically takes 24-48 hours."
  },
  {
    id: 6,
    category: 'Products',
    question: "Are your parts original?",
    answer: "We sell both Service Center Originals (OEM) and High-Quality Aftermarket parts. The quality grade is clearly mentioned on every product page."
  }
];

const HelpPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header Search */}
      <div className="bg-blue-600 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-6">How can we help you?</h1>
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            placeholder="Search for answers (e.g. returns, shipping)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-4 pl-12 pr-4 rounded-full shadow-lg border-none focus:ring-4 focus:ring-blue-400/50 outline-none text-gray-900"
          />
          <Search className="absolute left-4 top-4 text-gray-400 w-6 h-6" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-10">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No matching results found for "{searchTerm}"</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className={`border border-gray-200 rounded-xl overflow-hidden transition-all duration-200 ${openIndex === faq.id ? 'shadow-md border-blue-200 ring-1 ring-blue-100' : 'hover:border-gray-300'}`}
              >
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full flex justify-between items-center p-5 text-left bg-white focus:outline-none"
                >
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 block">
                      {faq.category}
                    </span>
                    <span className="font-semibold text-gray-900 text-lg">
                      {faq.question}
                    </span>
                  </div>
                  {openIndex === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {/* Accordion Content */}
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 ${
                    openIndex === faq.id ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="p-5 text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories Quick Links */}
        <div className="mt-16 text-center">
          <h3 className="font-bold text-gray-900 mb-6">Browse by Category</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {['Orders', 'Shipping', 'Returns', 'Products', 'Account'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setSearchTerm(cat)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 font-medium transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpPage;