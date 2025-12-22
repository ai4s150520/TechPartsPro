import React, { useState, useEffect } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { sellerAPI } from '../../services/api';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getImageUrl } from '../../lib/utils';

interface ProductFormProps {
  onSuccess: () => void;
  initialData?: {
    name?: string;
    sku?: string;
    price?: number;
    discount_percentage?: number;
    tax_rate?: number;
    stock_quantity?: number;
    description?: string;
    category?: string;
    specifications?: Record<string, unknown>;
    images?: Array<{ id: number; image: string }>;
    slug?: string;
  };
}

const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '', // MRP
    discount_percentage: '0', 
    tax_rate: '18',
    stock_quantity: '',
    description: '',
    category: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: number; image: string }>>([]);
  
  const [specs, setSpecs] = useState<{key: string, value: string}[]>([{ key: '', value: '' }]);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Calculate Selling Price for Preview
  const mrp = parseFloat(formData.price) || 0;
  const percent = parseFloat(formData.discount_percentage) || 0;
  const calculatedSellingPrice = mrp - (mrp * (percent / 100));

  // 1. Fetch Categories
  useEffect(() => {
    apiClient.get('/catalog/categories/')
      .then(res => {
        const d = res.data;
        const results = d && (d.results || Array.isArray(d) ? (d.results || d) : []);
        setCategories(results);
      })
      .catch(() => setCategories([]));
  }, []);

  // 2. Check seller profile completeness (prevent creating products if incomplete)
  useEffect(() => {
    let mounted = true;
    setProfileLoading(true);
    sellerAPI.getProfile()
      .then(res => {
        if (!mounted) return;
        setIsProfileComplete(!!res.data.is_approved);
      })
      .catch(() => {
        if (!mounted) return;
        setIsProfileComplete(false);
      })
      .finally(() => mounted && setProfileLoading(false));

    return () => { mounted = false };
  }, []);

  // 2. Pre-fill Data if Editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        price: String(initialData.price || ''), // Ensure string for input
        discount_percentage: String(initialData.discount_percentage || '0'),
        tax_rate: String(initialData.tax_rate || '18'),
        stock_quantity: String(initialData.stock_quantity || ''),
        description: initialData.description || '',
        category: initialData.category || '',
      });

      // Specs
      if (initialData.specifications) {
        const mappedSpecs = Object.entries(initialData.specifications).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        if (mappedSpecs.length > 0) setSpecs(mappedSpecs);
      }

      // Existing Images
      if (initialData.images) {
        setExistingImages(initialData.images);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages(prev => [...prev, ...filesArray]);
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Logic to hide existing image in UI (In real app, call API DELETE endpoint)
  const removeExistingImage = (id: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const addSpecRow = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpecRow = (index: number) => setSpecs(specs.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Block create if seller profile incomplete
    if (!initialData && !profileLoading && !isProfileComplete) {
      setLoading(false);
      toast.error('Please complete your seller profile (bank details / email) before adding products.');
      return;
    }
    try {
      const specsObject = specs.reduce((acc, curr) => {
        if (curr.key) acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      const data = new FormData();
      data.append('name', formData.name);
      data.append('sku', formData.sku);
      data.append('price', formData.price);
      data.append('discount_percentage', formData.discount_percentage);
      data.append('tax_rate', formData.tax_rate);
      data.append('stock_quantity', formData.stock_quantity);
      data.append('description', formData.description);
      data.append('category', formData.category);
      data.append('specifications', JSON.stringify(specsObject));

      // Append NEW images
      images.forEach((image) => {
        data.append('uploaded_images', image);
      });

      if (initialData) {
        // UPDATE MODE
        await apiClient.patch(`/catalog/products/${initialData.slug}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Product Updated Successfully!");
      } else {
        // CREATE MODE
        await apiClient.post('/catalog/products/', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success("Product Created Successfully!");
      }

      onSuccess();

    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto bg-white p-6 rounded shadow">
      {!profileLoading && !isProfileComplete && !initialData && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">Please complete your seller profile (bank details / email) before adding products. <a href="/seller/profile" className="underline font-medium">Complete profile</a></div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Name" name="name" value={formData.name} onChange={handleChange} required />
        <Input label="SKU" name="sku" value={formData.sku} onChange={handleChange} required />
      </div>

      {/* Pricing Section */}
      <div className="grid grid-cols-3 gap-4 border p-4 rounded-lg bg-gray-50">
        <div>
          <Input 
            label="MRP (₹)" 
            type="number" 
            name="price" 
            value={formData.price} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div>
          <Input 
            label="Discount %" 
            type="number" 
            name="discount_percentage" 
            value={formData.discount_percentage} 
            onChange={handleChange} 
            max={99}
          />
        </div>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
           <div className="h-10 px-3 py-2 bg-gray-200 rounded-lg text-gray-700 font-bold border border-gray-300">
             ₹{calculatedSellingPrice.toFixed(2)}
           </div>
           <p className="text-xs text-gray-500 mt-1">Auto-calculated</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input 
           label="GST Rate (%)" 
           type="number" 
           name="tax_rate" 
           value={formData.tax_rate} 
           onChange={handleChange} 
           helperText="Standard rate for electronics is 18%"
        />
        <Input label="Stock Quantity" type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select 
          name="category" 
          value={formData.category} 
          onChange={handleChange} 
          required
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Select Category</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          required
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
        <div className="grid grid-cols-5 gap-4">
          
          {/* 1. Existing Images */}
          {existingImages.map((img) => (
            <div key={img.id} className="relative w-24 h-24 border rounded overflow-hidden group">
              <img src={getImageUrl(img.image)} alt={initialData?.name ? `${initialData.name} image` : 'product image'} className="w-full h-full object-cover opacity-90" />
              <button 
                type="button" 
                onClick={() => removeExistingImage(img.id)}
                aria-label={`Remove existing image ${img.id}`}
                title="Remove image"
                className="absolute top-0 right-0 bg-gray-800 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* 2. New Previews */}
          {previews.map((src, idx) => (
            <div key={idx} className="relative w-24 h-24 border rounded overflow-hidden group">
              <img src={src} alt={`preview ${idx + 1}`} className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(idx)}
                aria-label={`Remove preview image ${idx + 1}`}
                title="Remove image"
                className="absolute top-0 right-0 bg-red-500 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-500" aria-hidden={false}>
            <Upload className="text-gray-400" />
            <span className="sr-only">Upload product images</span>
            <input aria-label="Upload product images" type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Specs */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">Specifications</label>
          <button type="button" onClick={addSpecRow} className="text-xs text-blue-600 flex items-center">
            <Plus size={14} className="mr-1" /> Add Spec
          </button>
        </div>
        <div className="space-y-2">
          {specs.map((spec, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                id={`spec-key-${idx}`}
                name={`spec_key_${idx}`}
                aria-label={`Specification key ${idx + 1}`}
                placeholder="Key" 
                value={spec.key} 
                onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                className="w-1/3 border border-gray-300 rounded px-3 py-1 text-sm"
              />
              <input 
                id={`spec-value-${idx}`}
                name={`spec_value_${idx}`}
                aria-label={`Specification value ${idx + 1}`}
                placeholder="Value" 
                value={spec.value} 
                onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                className="w-2/3 border border-gray-300 rounded px-3 py-1 text-sm"
              />
              <button type="button" onClick={() => removeSpecRow(idx)} aria-label={`Remove specification ${idx + 1}`} className="text-red-500 p-1">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" isLoading={loading} className="w-full" disabled={!initialData && !isProfileComplete}>
        {initialData ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  );
};

export default ProductForm;