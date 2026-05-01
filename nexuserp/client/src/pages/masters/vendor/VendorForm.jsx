import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { vendorSchema } from './VendorValidation';
import { VendorService } from './VendorService';
import VendorTabs from './VendorTabs';
import { Spinner } from '../../../components/ui';

const tabsConfig = [
  { id: 'company', label: 'Company Information' },
  { id: 'address', label: 'Location Address' },
  { id: 'statutory', label: 'Statutory Details' },
  { id: 'financial', label: 'Financial Details' },
  { id: 'bank', label: 'Bank Details' },
  { id: 'other', label: 'Other Information' }
];

export default function VendorForm({ isOpen, onClose, vendorId = null, onSuccess }) {
  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(vendorSchema),
    defaultValues: {
      isActive: true,
      country: 'India',
      currency: 'INR'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (vendorId) {
        // Fetch existing vendor data
        setIsLoading(true);
        VendorService.getVendors().then(vendors => {
          const v = vendors.find(x => x.id === vendorId);
          if (v) reset(v);
        }).finally(() => setIsLoading(false));
      } else {
        reset({ isActive: true, country: 'India', currency: 'INR' });
        setActiveTab('company');
      }
    }
  }, [isOpen, vendorId, reset]);

  const onSubmit = async (data) => {
    try {
      setIsSaving(true);
      if (vendorId) {
        await VendorService.updateVendor(vendorId, data);
        toast.success('Vendor profile updated successfully');
      } else {
        await VendorService.createVendor(data);
        toast.success('Vendor successfully onboarded');
      }
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save vendor');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
        className="bg-white dark:bg-[#121212] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - Glassmorphism */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-black/40 backdrop-blur-md border-b border-slate-200 dark:border-[#333] flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              {vendorId ? 'Revise Vendor Profile' : 'Onboard New Vendor'}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mt-0.5">
              SAP Master Data Layout
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-[#2a2a2a] rounded-full hover:bg-slate-300 dark:hover:bg-[#3a3a3a] transition-colors text-slate-600 dark:text-slate-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Form Body */}
        {isLoading ? (
          <div className="flex-1 min-h-[400px] flex items-center justify-center">
             <Spinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Common Fields */}
            <div className="p-6 bg-slate-50 dark:bg-[#1a1a1a] border-b border-slate-200 dark:border-[#333]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="flex flex-col space-y-1">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vendor Name <span className="text-red-500">*</span></label>
                   <input {...register('companyName')} className="input-field font-black text-lg text-blue-700 dark:text-blue-400 uppercase" placeholder="Full Legal Name" />
                   {errors.companyName && <span className="text-[10px] font-bold text-red-500">{errors.companyName.message}</span>}
                 </div>
                 <div className="flex flex-col space-y-1">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Print Name</label>
                   <input {...register('printName')} className="input-field font-bold uppercase" placeholder="As seen on Cheque/Docs" />
                 </div>
                 <div className="flex flex-col space-y-1">
                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group Name</label>
                   <input {...register('groupName')} className="input-field font-bold uppercase" placeholder="e.g. RM Suppliers" />
                 </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200 dark:border-[#333] px-4 pt-2">
              {tabsConfig.map(tab => (
                <button 
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Dynamic Tab Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#121212]">
               <VendorTabs activeTab={activeTab} register={register} errors={errors} />
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 bg-slate-50/80 dark:bg-black/40 backdrop-blur-md border-t border-slate-200 dark:border-[#333] flex justify-end gap-3 sticky bottom-0">
               <button type="button" onClick={() => reset()} className="btn-secondary px-6 font-bold shadow-sm">Reset</button>
               <button type="button" onClick={onClose} className="btn-secondary px-6 font-bold shadow-sm">Cancel</button>
               <button type="submit" disabled={isSaving} className="btn-primary px-10 font-bold shadow-lg flex items-center gap-2">
                 {isSaving && <Spinner className="w-4 h-4 text-white" />}
                 {vendorId ? 'Save Changes' : 'Save Vendor'}
               </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
