const { prisma } = require('../db');

const validFields = [
  'employeeCode', 'name', 'fatherName', 'department', 'designation', 
  'employeeCategory', 'employeeType', 'salary', 'phone', 'email', 
  'uanNumber', 'esiNumber', 'memberId', 'aadharNumber', 
  'panNumber', 'alternativeNumber', 'accountNo', 'bankName', 'ifscCode', 
  'paymode', 'joiningDate', 'resignationDate', 'isActive', 'profileImage',
  'aadharFile', 'panFile',
  'aadharNumberEncrypted', 'panNumberEncrypted',
  'aadharIv', 'panIv'
];

const cleanEmployeeData = (data) => {
  const { id, userId, createdAt, updatedAt, user, attendance, indents, salarySlips, ...payload } = data;
  const cleanData = {};
  
  validFields.forEach(field => {
    if (payload[field] !== undefined) {
      let val = payload[field];
      if (field === 'joiningDate' || field === 'resignationDate') {
        if (val) {
          try { cleanData[field] = new Date(val).toISOString(); } catch(e) { cleanData[field] = field === 'joiningDate' ? new Date().toISOString() : null; }
        } else { cleanData[field] = field === 'joiningDate' ? new Date().toISOString() : null; }
      } 
      else if (['aadharNumber', 'panNumber', 'employeeCode', 'memberId'].includes(field)) {
        cleanData[field] = val === "" ? null : val;
      }
      else if (field === 'salary') { cleanData[field] = Number(val) || 0; }
      else { cleanData[field] = val; }
    }
  });
  return cleanData;
};

const validateAadhar = (aadhar) => {
  if (!aadhar) return { valid: true };
  const clean = aadhar.replace(/[-\s]/g, '');
  if (clean.length !== 12 || !/^\d{12}$/.test(clean)) {
    return { valid: false, message: 'Invalid Aadhar format. Please enter as XXXX-XXXX-XXXX.' };
  }
  return { valid: true, formatted: `${clean.slice(0,4)}-${clean.slice(4,8)}-${clean.slice(8)}` };
};

const validatePAN = (pan) => {
  if (!pan) return { valid: true };
  const clean = pan.replace(/[-\s]/g, '').toUpperCase();
  if (clean.length !== 10 || !/^[A-Z]{5}\d{4}[A-Z]$/.test(clean)) {
    return { valid: false, message: 'Invalid PAN format. Please enter as AAAAA9999A.' };
  }
  return { valid: true, formatted: `${clean.slice(0,5)}-${clean.slice(5,9)}-${clean.slice(9)}` };
};

const validatePhone = (phone) => {
  if (!phone) return { valid: true };
  const clean = phone.replace(/[-\s]/g, '');
  if (clean.length !== 10 || !/^\d{10}$/.test(clean)) {
    return { valid: false, message: 'Primary Phone must be exactly 10 digits.' };
  }
  return { valid: true, formatted: clean };
};

module.exports = {
  cleanEmployeeData,
  validateAadhar,
  validatePAN,
  validatePhone
};
