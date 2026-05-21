import api from './api';

export const WalletService = {
  async deposit(amount) {
    const { data } = await api.post('/wallets/deposit', { amount });
    return data;
  },

  async withdraw(amount) {
    const { data } = await api.post('/wallets/withdraw', { amount });
    return data;
  },

  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    const url = `/wallets/transactions${queryString ? `?${queryString}` : ''}`;
    const { data } = await api.get(url);
    return data;
  },

  async getSummary() {
    const { data } = await api.get('/wallets/summary');
    return data;
  },

  async getStats() {
    const { data } = await api.get('/wallets/stats');
    return data;
  },
};
