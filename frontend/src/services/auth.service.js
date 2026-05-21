import api from './api';

export const AuthService = {
  async register(name, email, password, role) {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return data; // { user, token }
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data; // { user, token }
  },

  async seed() {
    const { data } = await api.post('/auth/seed');
    return data; // { admin, user1, user2, user3 }
  },
};
