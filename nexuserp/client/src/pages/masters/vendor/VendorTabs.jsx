import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Reusable Form Group component
const FormGroup = ({ label, error, children, required }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <span className="text-[10px] font-bold text-red-500 mt-1">{error.message}</span>}
  </div>
);

export default function VendorTabs({ activeTab, register, errors }) {
  
  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-[350px] p-2">
      <AnimatePresence mode="wait">
        
        {/* TAB 1: COMPANY INFORMATION */}
        {activeTab === 'company' && (
          <motion.div key="company" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="Contact Person" error={errors.contactPerson}>
              <input {...register('contactPerson')} className="input-field font-bold uppercase" placeholder="Mr. / Ms." />
            </FormGroup>
            <FormGroup label="Mobile Number" error={errors.mobile} required>
              <input {...register('mobile')} className="input-field font-bold" placeholder="10-digit number" />
            </FormGroup>
            <FormGroup label="Email ID" error={errors.email}>
              <input {...register('email')} type="email" className="input-field font-bold" placeholder="example@company.com" />
            </FormGroup>
            <FormGroup label="Phone Number" error={errors.phone}>
              <input {...register('phone')} className="input-field font-bold" placeholder="Landline or Alternate" />
            </FormGroup>
            <FormGroup label="Website" error={errors.website}>
              <input {...register('website')} className="input-field font-bold" placeholder="www.example.com" />
            </FormGroup>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Active Vendor [Y/N]</span>
              </label>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ADDRESS DETAILS */}
        {activeTab === 'address' && (
          <motion.div key="address" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormGroup label="Address Line 1" error={errors.address} required>
                <input {...register('address')} className="input-field font-bold uppercase" />
              </FormGroup>
              <FormGroup label="Address Line 2" error={errors.address2}>
                <input {...register('address2')} className="input-field font-bold uppercase" />
              </FormGroup>
              <FormGroup label="Address Line 3" error={errors.address3}>
                <input {...register('address3')} className="input-field font-bold uppercase" />
              </FormGroup>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="City" error={errors.city} required>
                  <input {...register('city')} className="input-field font-bold uppercase" />
                </FormGroup>
                <FormGroup label="State" error={errors.state}>
                  <input {...register('state')} className="input-field font-bold uppercase" />
                </FormGroup>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormGroup label="Country" error={errors.country}>
                  <input {...register('country')} className="input-field font-bold uppercase" defaultValue="India" />
                </FormGroup>
                <FormGroup label="PIN Code" error={errors.pinCode}>
                  <input {...register('pinCode')} className="input-field font-bold uppercase" />
                </FormGroup>
              </div>
              <FormGroup label="Fax Number" error={errors.fax}>
                <input {...register('fax')} className="input-field font-bold uppercase" />
              </FormGroup>
            </div>
          </motion.div>
        )}

        {/* TAB 3: STATUTORY DETAILS */}
        {activeTab === 'statutory' && (
          <motion.div key="statutory" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="GSTIN" error={errors.gstNumber} required>
              <input {...register('gstNumber')} className="input-field font-mono font-bold uppercase" placeholder="e.g. 22AAAAA0000A1Z5" />
            </FormGroup>
            <FormGroup label="PAN Number" error={errors.panNumber}>
              <input {...register('panNumber')} className="input-field font-mono font-bold uppercase" placeholder="e.g. ABCDE1234F" />
            </FormGroup>
            <FormGroup label="TAN Number" error={errors.tanNumber}>
              <input {...register('tanNumber')} className="input-field font-mono font-bold uppercase" />
            </FormGroup>
            <FormGroup label="CIN Number" error={errors.cinNumber}>
              <input {...register('cinNumber')} className="input-field font-mono font-bold uppercase" />
            </FormGroup>
            <FormGroup label="MSME Number" error={errors.msmeNumber}>
              <input {...register('msmeNumber')} className="input-field font-mono font-bold uppercase" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-4">
               <FormGroup label="TIN Number" error={errors.tinNumber}>
                 <input {...register('tinNumber')} className="input-field font-mono font-bold uppercase" />
               </FormGroup>
               <FormGroup label="TIN Date" error={errors.tinDate}>
                 <input type="date" {...register('tinDate')} className="input-field font-bold uppercase" />
               </FormGroup>
            </div>
          </motion.div>
        )}

        {/* TAB 4: FINANCIAL DETAILS */}
        {activeTab === 'financial' && (
          <motion.div key="financial" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="Payment Terms" error={errors.paymentTerms}>
              <select {...register('paymentTerms')} className="input-field font-bold">
                <option value="">Select Terms...</option>
                <option value="Immediate">Immediate</option>
                <option value="15 Days">15 Days</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
              </select>
            </FormGroup>
            <FormGroup label="Credit Limit" error={errors.creditLimit}>
              <input type="number" step="0.01" {...register('creditLimit')} className="input-field font-bold text-right" placeholder="0.00" />
            </FormGroup>
            <FormGroup label="Opening Balance" error={errors.openingBalance}>
              <input type="number" step="0.01" {...register('openingBalance')} className="input-field font-bold text-right" placeholder="0.00" />
            </FormGroup>
            <FormGroup label="Currency" error={errors.currency}>
              <select {...register('currency')} className="input-field font-bold">
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </FormGroup>
          </motion.div>
        )}

        {/* TAB 5: BANK DETAILS */}
        {activeTab === 'bank' && (
          <motion.div key="bank" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="Bank Name" error={errors.bankName}>
              <input {...register('bankName')} className="input-field font-bold uppercase" />
            </FormGroup>
            <FormGroup label="Account Number" error={errors.accountNumber}>
              <input {...register('accountNumber')} className="input-field font-mono font-bold" />
            </FormGroup>
            <FormGroup label="IFSC Code" error={errors.ifscCode}>
              <input {...register('ifscCode')} className="input-field font-mono font-bold uppercase" />
            </FormGroup>
            <FormGroup label="Branch" error={errors.branch}>
              <input {...register('branch')} className="input-field font-bold uppercase" />
            </FormGroup>
          </motion.div>
        )}

        {/* TAB 6: OTHER SETTINGS */}
        {activeTab === 'other' && (
          <motion.div key="other" variants={tabVariants} initial="hidden" animate="visible" exit="exit" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormGroup label="Transporter Name" error={errors.transporterName}>
              <input {...register('transporterName')} className="input-field font-bold uppercase" />
            </FormGroup>
            <FormGroup label="Purchase Executive" error={errors.purchaseExecutive}>
              <input {...register('purchaseExecutive')} className="input-field font-bold uppercase" />
            </FormGroup>
            <FormGroup label="Credit Days" error={errors.creditDays}>
              <input type="number" {...register('creditDays')} className="input-field font-bold" />
            </FormGroup>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
