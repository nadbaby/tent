import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiUrl } from '../utils/api';

// Async thunk to fetch all products from backend and normalize data for the UI
export const fetchProducts = createAsyncThunk('products/fetchAll', async () => {
  const response = await fetch(apiUrl('/api/products'));
  if (!response.ok) throw new Error('Failed to fetch products');
  const data = await response.json();
  return data.map(p => ({
    ...p,
    specs: p.description ? p.description.substring(0, 60) + '...' : (p.subcategory || p.brand),
    image: p.image || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600',
  }));
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetched: null,
  },
  reducers: {
    // Optimistic local updates for admin operations
    addProductLocally(state, action) {
      state.items.unshift(action.payload);
    },
    updateProductLocally(state, action) {
      const idx = state.items.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload };
    },
    deleteProductLocally(state, action) {
      state.items = state.items.filter(p => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { addProductLocally, updateProductLocally, deleteProductLocally } = productsSlice.actions;
export default productsSlice.reducer;
