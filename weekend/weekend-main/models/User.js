const mongoose = require("mongoose");
const { encrypt, decrypt, generateLookupToken, hashPassword, transformQuery } = require("../services/encryptionService");

const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  phone: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
  phoneLookupToken: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  name: { type: String },
  email: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
  emailLookupToken: { type: String, unique: true, sparse: true },
  password: { type: String },
  company: { type: String },
  role: { type: String, default: "user" },
  specialDiscount: { type: Number, default: 0 },
  gstNumber: { type: String },
  profilePic: { type: String },
  firebaseUid: { type: String, unique: true, sparse: true },
  addresses: [{
    id: { type: String, default: () => `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}` },
    fullName: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    phone: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    email: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    company: String,
    street: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    city: String,
    state: String,
    zip: String,
    country: { type: String, default: "India" },
    landmark: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    nearbyPlaces: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    gstNumber: String,
    deliveryInstructions: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false }
  }],
  cart: [{
    id: Number,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    addedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  toJSON: { getters: true },
  toObject: { getters: true },
  timestamps: false
});

// Pre-save hook for password hashing & lookup tokens
UserSchema.pre("save", async function(next) {
  if (this.isModified("password") && this.password) {
    if (!this.password.startsWith("$argon2")) {
      this.password = await hashPassword(this.password);
    }
  }

  // Set lookup tokens (read getters to get plain values)
  if (this.isModified("email") && this.email) {
    this.emailLookupToken = generateLookupToken(this.email);
  }
  if (this.isModified("phone") && this.phone) {
    this.phoneLookupToken = generateLookupToken(this.phone);
  }
  
  next();
});

// Pre-update hooks to keep lookup tokens in sync during updates
const handleUpdate = function(next) {
  const update = this.getUpdate();
  if (update) {
    if (update.$set) {
      if (update.$set.email) {
        update.$set.emailLookupToken = generateLookupToken(update.$set.email);
      }
      if (update.$set.phone) {
        update.$set.phoneLookupToken = generateLookupToken(update.$set.phone);
      }
    } else {
      // In case of direct replacement/updates without $set operator
      if (update.email) {
        update.emailLookupToken = generateLookupToken(update.email);
      }
      if (update.phone) {
        update.phoneLookupToken = generateLookupToken(update.phone);
      }
    }
  }
  if (typeof next === "function") next();
};

UserSchema.pre("updateOne", handleUpdate);
UserSchema.pre("findOneAndUpdate", handleUpdate);
UserSchema.pre("updateMany", handleUpdate);

// Query middleware to automatically convert searches on 'email' and 'phone' to lookup tokens
const handleQuery = function(next) {
  const query = this.getQuery();
  transformQuery(query);
  if (typeof next === "function") next();
};

UserSchema.pre("find", handleQuery);
UserSchema.pre("findOne", handleQuery);
UserSchema.pre("findOneAndUpdate", handleQuery);
UserSchema.pre("countDocuments", handleQuery);

module.exports = mongoose.model("User", UserSchema);
