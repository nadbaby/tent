import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiUrl } from '../utils/api';

// Async Thunks for Server Sync
export const syncCartWithServer = createAsyncThunk(
  'cart/syncWithServer',
  async (cartItems, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(apiUrl('/api/cart/sync'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cart: cartItems })
      });

      if (!response.ok) throw new Error('Failed to sync cart');
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCartFromServer = createAsyncThunk(
  'cart/fetchFromServer',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(apiUrl('/api/cart'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch cart');
      const data = await response.json();
      return data.cart;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper to load state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('cart');
    if (serializedState === null) {
      return {
        items: [],
        totalQuantity: 0,
      };
    }
    const state = JSON.parse(serializedState);
    if (state && Array.isArray(state.items)) {
      state.items = state.items.map(item => ({
        ...item,
        totalPrice: item.totalPrice || ((item.price || 0) * (item.quantity || 1))
      }));
    }
    return state;
  } catch (err) {
    return {
      items: [],
      totalQuantity: 0,
    };
  }
};

// Helper to save state to localStorage
const saveState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('cart', serializedState);
  } catch (err) {
    // Ignore write errors
  }
};

const initialState = loadState();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const newItem = action.payload;
      const quantityToAdd = newItem.quantity || 1;
      const sizeToAdd = newItem.size || "";
      const existingItem = state.items.find((item) => item.id === newItem.id && (item.size || "") === sizeToAdd);

      if (!existingItem) {
        state.totalQuantity += quantityToAdd;
        state.items.push({
          id: newItem.id,
          name: newItem.name,
          price: newItem.price,
          quantity: quantityToAdd,
          totalPrice: newItem.price * quantityToAdd,
          image: newItem.image,
          size: sizeToAdd,
        });
      } else {
        if (newItem.replace) {
          // If replace is true, set the quantity exactly to the new value
          state.totalQuantity = state.totalQuantity - existingItem.quantity + quantityToAdd;
          existingItem.quantity = quantityToAdd;
          existingItem.totalPrice = (newItem.price || existingItem.price) * quantityToAdd;
        } else {
          // Standard additive behavior
          state.totalQuantity += quantityToAdd;
          existingItem.quantity += quantityToAdd;
          existingItem.totalPrice += ((newItem.price || existingItem.price) * quantityToAdd);
        }
      }
      saveState(state);
    },
    removeItem(state, action) {
      const payload = action.payload;
      const id = typeof payload === 'object' && payload !== null ? payload.id : payload;
      const size = typeof payload === 'object' && payload !== null ? payload.size : undefined;

      const existingItem = state.items.find((item) => item.id === id && (size === undefined || (item.size || "") === (size || "")));
      if (existingItem) {
        state.totalQuantity--;
        if (existingItem.quantity === 1) {
          state.items = state.items.filter((item) => !(item.id === id && (size === undefined || (item.size || "") === (size || ""))));
        } else {
          existingItem.quantity--;
          existingItem.totalPrice -= existingItem.price;
        }
      }
      saveState(state);
    },
    deleteFromCart(state, action) {
      const payload = action.payload;
      const id = typeof payload === 'object' && payload !== null ? payload.id : payload;
      const size = typeof payload === 'object' && payload !== null ? payload.size : undefined;

      const existingItem = state.items.find((item) => item.id === id && (size === undefined || (item.size || "") === (size || "")));
      if (existingItem) {
        state.totalQuantity -= existingItem.quantity;
        state.items = state.items.filter((item) => !(item.id === id && (size === undefined || (item.size || "") === (size || ""))));
      }
      saveState(state);
    },
    clearCart(state) {
      state.items = [];
      state.totalQuantity = 0;
      saveState(state);
    },
    mergeCart(state, action) {
      const itemsToMerge = action.payload; // Should be an array of items
      if (!Array.isArray(itemsToMerge)) return;

      itemsToMerge.forEach(newItem => {
        const existingItem = state.items.find(item => item.id === newItem.id);
        const resolvedPrice = newItem.price || 0;
        const resolvedQty = newItem.quantity || 1;
        const resolvedTotalPrice = newItem.totalPrice || (resolvedPrice * resolvedQty);

        if (!existingItem) {
          state.items.push({
            ...newItem,
            totalPrice: resolvedTotalPrice
          });
          state.totalQuantity += resolvedQty;
        } else {
          if (resolvedQty > existingItem.quantity) {
            state.totalQuantity += (resolvedQty - existingItem.quantity);
            existingItem.quantity = resolvedQty;
            existingItem.totalPrice = resolvedTotalPrice;
          }
        }
      });
      saveState(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchCartFromServer.fulfilled, (state, action) => {
      if (action.payload && Array.isArray(action.payload)) {
        state.items = action.payload.map(item => ({
          ...item,
          totalPrice: item.totalPrice || ((item.price || 0) * (item.quantity || 1))
        }));
        state.totalQuantity = action.payload.reduce((total, item) => total + item.quantity, 0);
        saveState(state);
      }
    });
  },
});

export const { addItem, removeItem, clearCart, deleteFromCart, mergeCart } = cartSlice.actions;
export default cartSlice.reducer;
