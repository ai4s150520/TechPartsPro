import { useEffect } from 'react';

interface StructuredDataProps {
  data: object;
  id?: string;
}

export const StructuredData: React.FC<StructuredDataProps> = ({ data, id = 'structured-data' }) => {
  useEffect(() => {
    // Remove existing structured data script
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data script
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [data, id]);

  return null;
};