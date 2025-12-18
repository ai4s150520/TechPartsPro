import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { sellerAPI } from '../../services/api';

const SellerBulkUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [report, setReport] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setReport(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setReport(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      if (!isProfileComplete && !profileLoading) {
        toast.error('Please complete your seller profile (bank details / email) before bulk uploading.');
        setUploading(false);
        return;
      }
      const { data } = await apiClient.post('/catalog/products/bulk-upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 600000, // 10 minutes for large files
      });
      
      // Handle both async (with task_id) and sync responses
      if (data.task_id) {
        setTaskId(data.task_id);
        toast.success(data.message);
      } else if (data.status === 'success') {
        // Synchronous response
        setReport(data);
        setUploading(false);
        toast.success(`Upload completed! ${data.created} created, ${data.updated} updated`);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || "Upload failed";
      toast.error(msg);
      setUploading(false);
    }
  };

  // Poll task status
  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/catalog/products/bulk-upload/status/${taskId}/`);
        
        if (data.state === 'PROGRESS') {
          setProgress({ current: data.current, total: data.total });
        } else if (data.state === 'SUCCESS') {
          setReport(data.result);
          setUploading(false);
          setTaskId(null);
          toast.success('Upload completed!');
          clearInterval(interval);
        } else if (data.state === 'FAILURE') {
          toast.error('Upload failed');
          setUploading(false);
          setTaskId(null);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [taskId]);

  useEffect(() => {
    let mounted = true;
    setProfileLoading(true);
    sellerAPI.getProfile()
      .then(res => { if (!mounted) return; setIsProfileComplete(!!res.data.is_approved); })
      .catch(() => { if (!mounted) return; setIsProfileComplete(false); })
      .finally(() => mounted && setProfileLoading(false));

    return () => { mounted = false };
  }, []);

  const downloadTemplate = () => {
    const headers = "Name,SKU,Category,MRP,Stock,GST_Percent,Discount_Percent,Brand,Image_URLs,Description";
    const example = "Vivo V21 Screen,VIVO-V21-LCD,Screens,6000,50,18,10,Vivo,\"http://img.com/1.jpg, http://img.com/2.jpg\",Original Display";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Product Upload</h1>
        <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Template
        </Button>
      </div>

      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileSpreadsheet className="w-10 h-10 text-green-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your Excel/CSV</h3>
        <p className="text-gray-500 text-sm mb-6">
          Supports .xlsx and .csv. Max 10,000 rows per file.
        </p>

        <div className="flex justify-center mb-6">
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            disabled={!isProfileComplete}
            className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        {!profileLoading && !isProfileComplete && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">Please complete your seller profile (bank details / email) before bulk uploading. <a href="/seller/profile" className="underline font-medium">Complete profile</a></div>
        )}

        {uploading && progress.total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Processing...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpload} 
          disabled={!file || uploading || (!isProfileComplete && !profileLoading)} 
          isLoading={uploading}
          variant="seller"
          className="w-48"
        >
          {uploading ? (
            <span className="flex items-center">
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </span>
          ) : 'Start Upload'}
        </Button>
      </div>

      {/* Result Report */}
      {report && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-bold text-gray-900">Upload Results</h3>
            <div className="flex gap-2">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                {report.created} Created
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                {report.updated} Updated
                </span>
            </div>
          </div>
          
          {report.errors && report.errors.length > 0 ? (
            <div className="p-4 bg-red-50 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> Errors Found ({report.errors.length})
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {report.errors.map((err, idx) => (
                  <li key={idx} className="text-sm text-red-700">{err}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-8 text-center text-green-600">
              <CheckCircle className="w-12 h-12 mx-auto mb-2" />
              <p>All rows processed successfully!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SellerBulkUploadPage;