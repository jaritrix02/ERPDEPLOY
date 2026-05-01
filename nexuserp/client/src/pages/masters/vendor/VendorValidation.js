import * as Yup from 'yup';

export const vendorSchema = Yup.object().shape({
  companyName: Yup.string().required('Vendor Name is required'),
  printName: Yup.string(),
  groupName: Yup.string(),
  contactPerson: Yup.string(),
  
  mobile: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
    .required('Mobile Number is required'),
  email: Yup.string().email('Invalid email address').nullable(),
  phone: Yup.string(),
  website: Yup.string(),
  
  address: Yup.string().required('Address Line 1 is required'),
  address2: Yup.string(),
  address3: Yup.string(),
  city: Yup.string().required('City is required'),
  state: Yup.string(),
  country: Yup.string(),
  pinCode: Yup.string()
    .matches(/^[0-9]+$/, 'PIN Code must be numeric')
    .nullable(),
  fax: Yup.string(),

  panNumber: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .nullable(),
  gstNumber: Yup.string()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
    .required('GSTIN is required'),
  tanNumber: Yup.string(),
  cinNumber: Yup.string(),
  msmeNumber: Yup.string(),
  cstNumber: Yup.string(),
  tinNumber: Yup.string(),
  
  paymentTerms: Yup.string(),
  creditLimit: Yup.number().typeError('Must be a number').nullable(),
  openingBalance: Yup.number().typeError('Must be a number').nullable(),
  currency: Yup.string(),

  bankName: Yup.string(),
  accountNumber: Yup.string(),
  ifscCode: Yup.string()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format')
    .nullable(),
  branch: Yup.string(),

  transporterName: Yup.string(),
  purchaseExecutive: Yup.string(),
  isActive: Yup.boolean(),
  creditDays: Yup.number().typeError('Must be a number').nullable()
});
