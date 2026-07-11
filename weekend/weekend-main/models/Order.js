const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../services/encryptionService");

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  userId: { type: String },
  items: [
    {
      id: { type: Number },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      totalPrice: { type: Number },
      image: { type: String }
    }
  ],
  subtotal: { type: Number },
  discountAmount: { type: Number },
  gstAmount: { type: Number },
  shippingCharge: { type: Number, default: 0 },
  total: { type: Number },
  shippingDetails: {
    method: { type: String }, // e.g., "DOX", "PER_KG", "PARCEL"
    zone: { type: String },   // e.g., "LOCAL/PUNJAB", "DELHI/NCR"
    totalWeight: { type: Number },
    roundWeight: { type: Number }
  },
  shippingAddress: {
    fullName: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    phone: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    email: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    company: String,
    street: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    city: String,
    state: String,
    zip: String,
    country: String,
    lat: Number,
    lng: Number,
    landmark: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    nearbyPlaces: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    gstNumber: String,
    deliveryInstructions: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt }
  },
  paymentDetails: {
    status: { type: String, enum: ["PENDING", "SUCCESS", "FAILED"], default: "PENDING" },
    transactionId: String,
    errorMessage: String,
    gatewayResponse: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    updatedAt: { type: Date, default: Date.now }
  },
  deliveryMethod: { type: String, enum: ["STANDARD", "PORTER"], default: "STANDARD" },
  porterDeliveryDetails: {
    fullName: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    phone: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    fullAddress: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    landmark: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    preferredTime: String,
    deliveryInstructions: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    urgency: String, // Normal / Urgent / Machine Breakdown
    bookManually: { type: Boolean, default: false },
    porterStatus: { type: String, enum: ["Porter Booking Pending", "Assigned", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"], default: "Porter Booking Pending" }
  },
  status: { type: String, default: "PENDING" },
  trackingId: { type: String },
  trackingLink: { type: String },
  couponCode: { type: String },
  purchaseCount: { type: Number },
  createdAt: { type: String, default: () => new Date().toISOString() },
  paidAt: { type: String },
  hiddenFromUser: { type: Boolean, default: false }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

module.exports = mongoose.model("Order", OrderSchema);
