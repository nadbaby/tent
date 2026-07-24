import { createSlice } from '@reduxjs/toolkit';

// Load persisted user from localStorage on startup
const loadUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const userSlice = createSlice({
  name: 'user',
  initialState: {
    currentUser: loadUser(),
    isAdmin: localStorage.getItem('isAdminAuthenticated') === 'true',
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null,
  },
  reducers: {
    loginSuccess(state, action) {
      const { user, isAdmin, token, role } = action.payload;
      state.currentUser = user;
      state.isAdmin = isAdmin;
      state.token = token || null;
      state.role = role;
      // Persist
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAdminAuthenticated', isAdmin ? 'true' : 'false');
      localStorage.setItem('role', role);
      if (token) localStorage.setItem('token', token);
    },
    logoutUser(state) {
      state.currentUser = null;
      state.isAdmin = false;
      state.token = null;
      state.role = null;
      localStorage.removeItem('user');
      localStorage.removeItem('isAdminAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    },
    updateUserProfile(state, action) {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.currentUser));
      }
    },
  },
});

export const { loginSuccess, logoutUser, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
