import api from '../../../services/api';

export const VendorService = {
  getVendors: async () => {
    const res = await api.get('/vendors');
    return res.data.data;
  },
  
  createVendor: async (data) => {
    const res = await api.post('/vendors', data);
    return res.data;
  },

  updateVendor: async (id, data) => {
    const res = await api.put(`/vendors/${id}`, data);
    return res.data;
  },

  deleteVendor: async (id) => {
    const res = await api.delete(`/vendors/${id}`);
    return res.data;
  }
};
