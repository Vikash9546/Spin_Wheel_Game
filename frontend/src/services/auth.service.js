import api from './api';

export const AuthService = {
  async register(name, coins = 1000) {
    const { data } = await api.post('/auth/register', { name, coins });
    return data; // { user, token }
  },

  async login(userId) {
    const { data } = await api.post('/auth/login', { userId });
    return data; // { user, token }
  },

  async seed() {
    const { data } = await api.post('/auth/seed');
    return data; // { admin, user1, user2, user3 }
  },
};
