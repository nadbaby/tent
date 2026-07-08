import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { syncCartWithServer, fetchCartFromServer } from '../../redux/cartSlice';

/**
 * CartSync Component
 * Handles background synchronization of the cart between local state and the server.
 */
const CartSync = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.cart);
  const isFirstRender = useRef(true);
  const user = localStorage.getItem('user');
  
  // 1. On Mount: Fetch cart from server if user is logged in
  useEffect(() => {
    if (user) {
      dispatch(fetchCartFromServer());
    }
  }, [dispatch, user]);

  // 2. On Cart Change: Sync with server (with a small debounce/delay to avoid too many requests)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (user) {
      const timeoutId = setTimeout(() => {
        dispatch(syncCartWithServer(items));
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [items, user, dispatch]);

  return null; // This component doesn't render anything
};

export default CartSync;
