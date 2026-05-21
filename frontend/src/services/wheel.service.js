import api from './api';

export const WheelService = {
  async createWheel(entryFee) {
    const { data } = await api.post('/wheels', { entryFee });
    return data;
  },

  async joinWheel(wheelId) {
    const { data } = await api.post(`/wheels/${wheelId}/join`);
    return data;
  },

  async startWheel(wheelId) {
    const { data } = await api.post(`/wheels/${wheelId}/start`);
    return data;
  },

  async getActiveWheel() {
    const { data } = await api.get('/wheels/active/current');
    return data;
  },

  async getWheel(wheelId) {
    const { data } = await api.get(`/wheels/${wheelId}`);
    return data;
  },
};
