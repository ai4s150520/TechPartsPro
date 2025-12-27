import { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
}

export const useSEO = (contentType?: string, objectId?: number) => {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contentType && objectId) {
      fetchSEOData(contentType, objectId);
    }
  }, [contentType, objectId]);

  const fetchSEOData = async (type: string, id: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/seo/${type}/${id}/`);
      setSeoData(response.data);
    } catch (error) {
      console.error('Failed to fetch SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSEO = (data: SEOData) => {
    setSeoData(data);
  };

  return {
    seoData,
    loading,
    updateSEO
  };
};