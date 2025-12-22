import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import apiClient from '../../lib/apiClient';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
  color: string;
}

const defaultSlides: Slide[] = [
  {
    id: 1,
    title: "Premium Mobile Spare Parts",
    subtitle: "Original Quality Parts at Wholesale Prices",
    cta: "Shop Now",
    link: "/shop",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=2070&auto=format&fit=crop",
    color: "bg-black"
  },
  {
    id: 2,
    title: "Professional Repair Tools",
    subtitle: "Upgrade your workbench with 10% Off",
    cta: "View Tools",
    link: "/shop",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop",
    color: "bg-blue-900"
  },
  {
    id: 3,
    title: "Bulk Deals Available",
    subtitle: "High capacity replacements for all brands",
    cta: "Buy Wholesale",
    link: "/shop",
    image: "https://images.unsplash.com/photo-1629813280065-02203e33b62f?q=80&w=2070&auto=format&fit=crop",
    color: "bg-green-900"
  }
];

const HeroCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(defaultSlides);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = () => {
    setCurrent(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrent(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/catalog/categories/');
        const categories: Category[] = (response.data.results || response.data).slice(0, 3);
        
        if (categories.length > 0) {
          const dynamicSlides: Slide[] = categories.map((cat, idx) => ({
            id: idx + 1,
            title: `${cat.name} Collection`,
            subtitle: `Explore our premium ${cat.name.toLowerCase()} range`,
            cta: `Shop ${cat.name}`,
            link: `/shop?category=${cat.slug}`,
            image: defaultSlides[idx]?.image || defaultSlides[0].image,
            color: defaultSlides[idx]?.color || "bg-gray-900"
          }));
          setSlides(dynamicSlides);
        }
      } catch (error) {
        console.error('Failed to load carousel categories', error);
      }
    };
    fetchCategories();
  }, []);

  // Auto-play Logic
  useEffect(() => {
    if (slides.length === 0 || isPaused) return;
    
    timeoutRef.current = setTimeout(nextSlide, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, isPaused, nextSlide, slides.length]);

  return (
    <div 
      className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-2xl shadow-xl group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay for Text Readability */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.color}/90 to-transparent opacity-80`} />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center container mx-auto px-6 md:px-12">
            <div className="max-w-lg text-white space-y-4 md:space-y-6 transform translate-y-0 transition-transform duration-700 delay-100">
              <span className="inline-block py-1 px-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-bold uppercase tracking-wider">
                Featured Deal
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 font-medium">
                {slide.subtitle}
              </p>
              <Link 
                to={slide.link}
                className="inline-flex items-center bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors shadow-lg"
              >
                {slide.cta}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows (Visible on Hover) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/10 hover:bg-white/30 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;