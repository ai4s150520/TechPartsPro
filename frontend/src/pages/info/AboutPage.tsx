import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Award } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
           {/* Abstract background pattern */}
           <div className="absolute transform -rotate-12 -top-20 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl"></div>
           <div className="absolute transform rotate-12 bottom-0 left-0 w-80 h-80 bg-orange-600 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">
            Empowering <span className="text-blue-500">Repairs</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            We are the bridge between premium manufacturing and the hands that fix the world. 
            TechParts Pro is the leading B2B & B2C marketplace for mobile components.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/shop">
              <Button size="lg">Explore Catalog</Button>
            </Link>
            <Link to="/seller/register">
              <Button variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-gray-900">
                Partner With Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">50k+</p>
              <p className="text-sm text-gray-600 font-medium">Active Parts</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">10k+</p>
              <p className="text-sm text-gray-600 font-medium">Repair Shops</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">99%</p>
              <p className="text-sm text-gray-600 font-medium">Fulfillment Rate</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600 mb-2">24/7</p>
              <p className="text-sm text-gray-600 font-medium">Expert Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Why Choose TechParts Pro?</h2>
          <p className="text-gray-500 mt-2">The standard for quality in the aftermarket industry.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="p-8 bg-gray-50 rounded-2xl transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Guaranteed</h3>
            <p className="text-gray-600 leading-relaxed">
              Every screen, battery, and flex cable undergoes a rigorous 3-step QC process before it reaches your inventory. We don't sell junk.
            </p>
          </div>

          <div className="p-8 bg-gray-50 rounded-2xl transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast Logistics</h3>
            <p className="text-gray-600 leading-relaxed">
              We understand that in the repair business, time is money. Orders placed before 4 PM ship the same day via express partners.
            </p>
          </div>

          <div className="p-8 bg-gray-50 rounded-2xl transition hover:-translate-y-1 duration-300">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Wholesale Pricing</h3>
            <p className="text-gray-600 leading-relaxed">
              Our tiered pricing model supports businesses of all sizes. From freelance technicians to franchise chains, we have a plan for you.
            </p>
          </div>
        </div>
      </section>

      {/* Team CTA */}
      <section className="bg-blue-600 py-20 text-center text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Join the Revolution</h2>
          <p className="text-blue-100 max-w-xl mx-auto mb-8">
            Are you a supplier with high-quality components? Join our vendor network and reach thousands of customers instantly.
          </p>
          <Link to="/seller/register">
            <Button variant="outline" className="bg-white text-blue-600 hover:bg-gray-100 border-none font-bold px-8">
              Become a Seller
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;