const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");
const Employee = require("../models/Employee");
const connectDB = require("../config/db");
const { hashPassword } = require("../services/encryptionService");

const DRY_RUN = process.env.DRY_RUN === "true";

const migrate = async () => {
  console.log("==========================================");
  console.log("DATABASE ENCRYPTION & HASHING MIGRATION");
  console.log("==========================================");
  console.log(`DRY_RUN MODE: ${DRY_RUN ? "ENABLED (No changes will be saved)" : "DISABLED (Changes WILL be saved)"}`);
  console.log("Backup Advice: Ensure you have backed up your User and Employee collections before running this script.");
  console.log("------------------------------------------");

  try {
    await connectDB();

    // 1. Migrate Employees
    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees to inspect.`);
    let migratedEmployeesCount = 0;

    for (const emp of employees) {
      let modified = false;

      // Check password
      if (emp.password && !emp.password.startsWith("$argon2")) {
        console.log(`[Employee] Hashing plaintext password for employee: ${emp.username}`);
        if (!DRY_RUN) {
          emp.password = await hashPassword(emp.password);
        }
        modified = true;
      }

      // Check email
      if (emp.email && !emp.emailLookupToken) {
        console.log(`[Employee] Encrypting email & setting lookup token for: ${emp.username}`);
        emp.markModified("email");
        modified = true;
      }

      // Check phone
      if (emp.phone && !emp.phoneLookupToken) {
        console.log(`[Employee] Encrypting phone & setting lookup token for: ${emp.username}`);
        emp.markModified("phone");
        modified = true;
      }

      if (modified) {
        migratedEmployeesCount++;
        if (!DRY_RUN) {
          await emp.save();
        }
      }
    }

    console.log(`[Employee] Inspection done. ${migratedEmployeesCount} employees marked for update.`);

    // 2. Migrate Users
    const users = await User.find({});
    console.log(`Found ${users.length} users to inspect.`);
    let migratedUsersCount = 0;

    for (const user of users) {
      let modified = false;

      // Check password
      if (user.password && !user.password.startsWith("$argon2")) {
        console.log(`[User] Hashing plaintext password for user: ${user.username || user.phone}`);
        if (!DRY_RUN) {
          user.password = await hashPassword(user.password);
        }
        modified = true;
      }

      // Check email
      if (user.email && !user.emailLookupToken) {
        console.log(`[User] Encrypting email & setting lookup token for: ${user.username || user.phone}`);
        user.markModified("email");
        modified = true;
      }

      // Check phone
      if (user.phone && !user.phoneLookupToken) {
        console.log(`[User] Encrypting phone & setting lookup token for: ${user.username || user.phone}`);
        user.markModified("phone");
        modified = true;
      }

      // Check addresses
      if (user.addresses && user.addresses.length > 0) {
        let addressesModified = false;
        for (const addr of user.addresses) {
          // If any sensitive field in address is not encrypted, mark addresses as modified
          const needsEncryption = (addr.fullName && typeof addr.fullName === "string") ||
                                  (addr.phone && typeof addr.phone === "string") ||
                                  (addr.email && typeof addr.email === "string") ||
                                  (addr.street && typeof addr.street === "string") ||
                                  (addr.landmark && typeof addr.landmark === "string") ||
                                  (addr.nearbyPlaces && typeof addr.nearbyPlaces === "string") ||
                                  (addr.deliveryInstructions && typeof addr.deliveryInstructions === "string");
          if (needsEncryption) {
            addressesModified = true;
            break;
          }
        }
        if (addressesModified) {
          console.log(`[User] Encrypting address fields for: ${user.username || user.phone}`);
          user.markModified("addresses");
          modified = true;
        }
      }

      if (modified) {
        migratedUsersCount++;
        if (!DRY_RUN) {
          await user.save();
        }
      }
    }

    console.log(`[User] Inspection done. ${migratedUsersCount} users marked for update.`);
    console.log("------------------------------------------");
    console.log("✅ Migration process completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

migrate();
