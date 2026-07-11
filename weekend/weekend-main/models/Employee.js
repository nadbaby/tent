const mongoose = require("mongoose");
const { encrypt, decrypt, generateLookupToken, hashPassword, transformQuery } = require("../services/encryptionService");

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String },
  email: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
  emailLookupToken: { type: String, unique: true, sparse: true },
  role: { type: String, default: "Employee" },
  permissions: { type: [String], default: [] },
  phone: { type: mongoose.Schema.Types.Mixed, get: decrypt, set: encrypt },
  phoneLookupToken: { type: String, unique: true, sparse: true },
  gstNumber: { type: String },
  firebaseUid: { type: String, unique: true, sparse: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, {
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Pre-save hook for password hashing & lookup tokens
EmployeeSchema.pre("save", async function(next) {
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

EmployeeSchema.pre("updateOne", handleUpdate);
EmployeeSchema.pre("findOneAndUpdate", handleUpdate);
EmployeeSchema.pre("updateMany", handleUpdate);

// Query middleware to automatically convert searches on 'email' and 'phone' to lookup tokens
const handleQuery = function(next) {
  const query = this.getQuery();
  transformQuery(query);
  if (typeof next === "function") next();
};

EmployeeSchema.pre("find", handleQuery);
EmployeeSchema.pre("findOne", handleQuery);
EmployeeSchema.pre("findOneAndUpdate", handleQuery);
EmployeeSchema.pre("countDocuments", handleQuery);

module.exports = mongoose.model("Employee", EmployeeSchema);
