import { createSlice } from '@reduxjs/toolkit';

// Load wishlist from localStorage
const loadWishlist = () => {
  try {
    const data = localStorage.getItem('wishlist');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveWishlist = (items) => {
  try {
    localStorage.setItem('wishlist', JSON.stringify(items));
  } catch {
    // Ignore write errors
  }
};

const wishlistSlice = createSlice({
  name: 'wishlist',


  initialState: {
    items: loadWishlist(),
  },
  reducers: {
    toggleWishlist(state, action) {
      const product = action.payload;
      const existingIndex = state.items.findIndex(item => item.id === product.id);

      if (existingIndex >= 0) {
        // Remove from wishlist
        state.items.splice(existingIndex, 1);
      } else {
        // Add to wishlist
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          brand: product.brand,
          category: product.category,
          sku: product.sku,
          addedAt: new Date().toISOString(),
        });
      }
      saveWishlist(state.items);
    },
    removeFromWishlist(state, action) {
      const id = action.payload;
      state.items = state.items.filter(item => item.id !== id);
      saveWishlist(state.items);
    },
    clearWishlist(state) {
      state.items = [];
      saveWishlist(state.items);
    },
  },
});

export const { toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;

export default wishlistSlice.reducer;



