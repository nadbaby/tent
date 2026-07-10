const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");
const fs = require("fs");
const path = require("path");

describe("Firebase Security Rules Tests", () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "finebear-bf157",
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8")
      },
      storage: {
        rules: fs.readFileSync(path.resolve(__dirname, "../storage.rules"), "utf8")
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // --- FIRESTORE TESTS ---
  
  test("Firestore: Deny unauthenticated read of user profile", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const docRef = unauthedDb.collection("users").doc("user_abc");
    await assertFails(docRef.get());
  });

  test("Firestore: Allow owner read of user profile", async () => {
    const authedDb = testEnv.authenticatedContext("user_abc").firestore();
    const docRef = authedDb.collection("users").doc("user_abc");
    await assertSucceeds(docRef.get());
  });

  test("Firestore: Deny owner from changing role to admin", async () => {
    const authedDb = testEnv.authenticatedContext("user_abc").firestore();
    const docRef = authedDb.collection("users").doc("user_abc");
    
    // Setup initial document via admin context (bypassing rules)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("user_abc").set({
        email: "user@example.com",
        role: "user",
        createdAt: "2026-06-22"
      });
    });

    // Try updating role to admin (should fail)
    await assertFails(docRef.update({ role: "admin" }));
  });

  test("Firestore: Deny owner from updating protected fields (balance, createdAt)", async () => {
    const authedDb = testEnv.authenticatedContext("user_abc").firestore();
    const docRef = authedDb.collection("users").doc("user_abc");

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("users").doc("user_abc").set({
        email: "user@example.com",
        role: "user",
        createdAt: "2026-06-22",
        balance: 100
      });
    });

    await assertFails(docRef.update({ balance: 500 }));
  });

  // --- STORAGE TESTS ---
  
  test("Storage: Deny unauthenticated write", async () => {
    const unauthedStorage = testEnv.unauthenticatedContext().storage();
    const fileRef = unauthedStorage.ref("users/user_abc/avatar.png");
    await assertFails(fileRef.put(Buffer.from([])));
  });

  test("Storage: Allow owner to write images under 5MB", async () => {
    const authedStorage = testEnv.authenticatedContext("user_abc").storage();
    const fileRef = authedStorage.ref("users/user_abc/avatar.png");
    await assertSucceeds(
      fileRef.put(Buffer.from("fake-image"), { contentType: "image/png" })
    );
  });

  test("Storage: Deny owner from writing executable file", async () => {
    const authedStorage = testEnv.authenticatedContext("user_abc").storage();
    const fileRef = authedStorage.ref("users/user_abc/dangerous.exe");
    await assertFails(
      fileRef.put(Buffer.from("malware"), { contentType: "application/octet-stream" })
    );
  });
});
