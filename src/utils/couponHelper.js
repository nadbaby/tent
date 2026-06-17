import { apiUrl } from './api';
import { getAuthToken } from './auth';

/**
 * Fetches the eligible GST coupon for a given GST number.
 * Returns { eligible: boolean, code: string | null }
 */
export const getEligibleGstCoupon = async (gstNumber) => {
  if (!gstNumber) return { eligible: false, code: null };

  try {
    const token = getAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(apiUrl(`/api/coupons/eligible-gst?gstNumber=${encodeURIComponent(gstNumber)}`), {
      headers
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.error("Failed to fetch eligible GST coupon:", err);
  }

  return { eligible: false, code: null };
};
