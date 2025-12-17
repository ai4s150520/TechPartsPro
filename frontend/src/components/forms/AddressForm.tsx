import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCreateAddress, useUpdateAddress } from '../../hooks/useAddresses';

interface AddressData {
  id?: number;
  full_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  title: 'HOME' | 'OFFICE' | 'OTHER';
  is_default: boolean;
}

interface AddressFormProps {
  initialData?: AddressData;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();
  
  const [formData, setFormData] = useState<AddressData>(initialData || {
    full_name: '',
    phone_number: '',
    street_address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    title: 'HOME',
    is_default: false
  });
  
  const loading = isCreating || isUpdating;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (initialData?.id) {
      updateAddress(
        { id: initialData.id, data: formData },
        {
          onSuccess: () => {
            toast.success('Address updated successfully');
            onSuccess();
          },
          onError: () => {
            toast.error('Failed to update address');
          }
        }
      );
    } else {
      createAddress(formData, {
        onSuccess: () => {
          toast.success('Address added successfully');
          onSuccess();
        },
        onError: () => {
          toast.error('Failed to add address');
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-bold text-gray-900">{initialData ? 'Edit Address' : 'Add New Address'}</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
        <Input label="Phone Number" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
      </div>

      <Input label="Street Address" name="street_address" value={formData.street_address} onChange={handleChange} required placeholder="Flat / House No / Building" />
      
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" name="city" value={formData.city} onChange={handleChange} required />
        <Input label="State" name="state" value={formData.state} onChange={handleChange} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Pincode" name="postal_code" value={formData.postal_code} onChange={handleChange} required />
        <Input label="Country" name="country" value={formData.country} onChange={handleChange} required />
      </div>

      <div className="flex gap-4 items-end">
        <div className="w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address Type</label>
          <select 
            name="title" 
            value={formData.title} 
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="HOME">Home</option>
            <option value="OFFICE">Office</option>
            <option value="WAREHOUSE">Warehouse</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div className="w-1/2 flex items-center mb-2">
           <input 
             type="checkbox" 
             id="is_default" 
             name="is_default" 
             checked={formData.is_default} 
             onChange={handleChange}
             className="w-4 h-4 text-blue-600 border-gray-300 rounded"
           />
           <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">Make Default Address</label>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Button type="button" variant="secondary" onClick={onCancel} className="w-1/2">Cancel</Button>
        <Button type="submit" isLoading={loading} className="w-1/2">Save Address</Button>
      </div>
    </form>
  );
};

export default AddressForm;