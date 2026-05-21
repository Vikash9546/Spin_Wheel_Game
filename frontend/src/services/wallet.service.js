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

  async getTransactions() {
    const { data } = await api.get('/wallets/transactions');
    return data;
  },

  async getSummary() {
    const { data } = await api.get('/wallets/summary');
    return data;
  },
};
