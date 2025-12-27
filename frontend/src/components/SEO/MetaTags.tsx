import { useEffect } from 'react';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

interface MetaTagsProps {
  seoData?: SEOData;
  defaultTitle?: string;
  defaultDescription?: string;
}

export const MetaTags: React.FC<MetaTagsProps> = ({
  seoData,
  defaultTitle = "TechParts Pro - Mobile Parts & Accessories",
  defaultDescription = "Buy genuine mobile parts and accessories online. Fast delivery, easy returns, best prices guaranteed."
}) => {
  useEffect(() => {
    const title = seoData?.title || defaultTitle;
    const description = seoData?.description || defaultDescription;
    const keywords = seoData?.keywords || "mobile parts, accessories, buy online";
    
    // Update document title
    document.title = title;
    
    // Update meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    
    // Open Graph tags
    updateMetaTag('og:title', seoData?.og_title || title, 'property');
    updateMetaTag('og:description', seoData?.og_description || description, 'property');
    updateMetaTag('og:type', 'website', 'property');
    
    if (seoData?.og_image) {
      updateMetaTag('og:image', seoData.og_image, 'property');
    }
    
    // Canonical URL
    if (seoData?.canonical_url) {
      updateLinkTag('canonical', seoData.canonical_url);
    }
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seoData?.og_title || title);
    updateMetaTag('twitter:description', seoData?.og_description || description);
    
  }, [seoData, defaultTitle, defaultDescription]);

  return null;
};

function updateMetaTag(name: string, content: string, attribute: string = 'name') {
  let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  
  element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  
  element.setAttribute('href', href);
}