export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const isAdmin = () => {
  return localStorage.getItem('isAdminAuthenticated') === 'true';
};