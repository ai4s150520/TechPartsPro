import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import AccountSidebar from '../../components/layout/AccountSidebar';
import Modal from '../../components/ui/Modal';
import AddressForm from '../../components/forms/AddressForm';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';

const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get('/accounts/addresses/');
      
      // --- CRITICAL FIX START ---
      // Determine if response is Paginated ({ results: [...] }) or a List ([...])
      const addressList = Array.isArray(res.data) 
        ? res.data 
        : (res.data.results || []);
        
      setAddresses(addressList);
      // --- CRITICAL FIX END ---

    } catch (error) {
      console.error("Failed to fetch addresses:", error);
      setAddresses([]); // Fallback to avoid crashes
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;
    try {
      await apiClient.delete(`/accounts/addresses/${id}/`);
      // Optimistic update
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert("Failed to delete address");
    }
  };

  const openEdit = (addr: any) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    fetchAddresses(); // Refresh list from server to get updated data
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <AccountSidebar />
        </aside>
        
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
            <Button onClick={openAdd} size="sm" className="flex items-center">
              <Plus className="w-4 h-4 mr-2" /> Add New
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No addresses found. Add one to checkout faster.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className={`p-5 rounded-xl border ${addr.is_default ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white hover:border-gray-300'} relative group transition-all`}>
                  {addr.is_default && (
                    <span className="absolute top-4 right-4 text-[10px] uppercase font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">Default</span>
                  )}
                  
                  <h3 className="font-bold text-gray-900 pr-12">{addr.full_name}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{addr.street_address}</p>
                  <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.postal_code}</p>
                  <p className="text-sm text-gray-600 mt-2 font-medium flex items-center">
                    <span className="text-gray-400 mr-2">Phone:</span> {addr.phone_number}
                  </p>
                  
                  <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(addr)} 
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center bg-white px-3 py-1.5 rounded border border-gray-200 hover:border-blue-200"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(addr.id)} 
                      className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center bg-white px-3 py-1.5 rounded border border-gray-200 hover:border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Address Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? "Edit Address" : "Add New Address"}
        size="lg"
      >
        <AddressForm 
          initialData={editingAddress} 
          onSuccess={handleFormSuccess} 
          onCancel={() => setIsModalOpen(false)} 
        />
      </Modal>
    </div>
  );
};

export default AddressesPage;