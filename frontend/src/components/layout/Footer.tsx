import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface Category {
  id: string;
  name: string;
  slug: string;
}

const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/catalog/categories/');
        setCategories((response.data.results || response.data).slice(0, 5));
      } catch (error) {
        console.error('Failed to load footer categories', error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-8 border-t border-gray-800 relative z-0">
      <div className="container mx-auto px-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Company Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">TechParts<span className="text-blue-500">Pro</span></h3>
            <p className="text-sm leading-relaxed mb-6 text-gray-400">
              The #1 Marketplace for high-quality mobile spare parts. 
              We serve over 10,000 repair shops and DIY enthusiasts with premium components.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Shop Links - Dynamic from DB */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-sm">
              {categories.length > 0 ? (
                categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link to={`/shop?category=${cat.slug}`} className="hover:text-blue-400 transition">
                      {cat.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li><Link to="/shop" className="hover:text-blue-400 transition">View All Products</Link></li>
              )}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account/orders" className="hover:text-blue-400 transition">Track Your Order</Link></li>
              <li><Link to="/legal/returns" className="hover:text-blue-400 transition">Return Policy</Link></li>
              <li><Link to="/info/contact" className="hover:text-blue-400 transition">Contact Us</Link></li>
              <li><Link to="/info/faq" className="hover:text-blue-400 transition">FAQs</Link></li>
              <li><Link to="/seller/register" className="text-orange-400 hover:text-orange-300 transition">Become a Seller</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                <span>123 Tech Park, Electronics City,<br/>Bangalore, India 560100</span>
              </li>
              <li className="flex items-center">
                <Phone className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                <span>support@techpartspro.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>&copy; 2025 TechParts Pro. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/legal/privacy" className="hover:text-white transition">Privacy Policy</Link>
            <Link to="/legal/terms" className="hover:text-white transition">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;