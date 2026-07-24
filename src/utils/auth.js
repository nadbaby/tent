export const isAdmin = () => {
  return localStorage.getItem('isAdminAuthenticated') === 'true';
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const logout = () => {
  localStorage.removeItem('isAdminAuthenticated');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
};
