process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "beacon-food-network";

const admin = require("../functions/node_modules/firebase-admin");

admin.initializeApp({
  projectId: "beacon-food-network",
});

const auth = admin.auth();
const db = admin.firestore();

const PASSWORD = "TeamBeacon2026!";

async function ensureUser({
  email,
  role,
  displayName,
  organizationId,
  organizationName,
}) {
  let user;

  try {
    user = await auth.getUserByEmail(email);
    console.log(`Auth user already exists: ${email}`);
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }

    user = await auth.createUser({
      email,
      password: PASSWORD,
      displayName,
    });

    console.log(`Created Auth user: ${email}`);
  }

  await db.collection("users").doc(user.uid).set({
    role,
    accountStatus: "active",
    displayName,
    organizationId,
  });

  await db.collection("organizations").doc(organizationId).set({
    name: organizationName,
    type: role,
    verificationStatus: "approved",
    createdBy: user.uid,
  });

  return user;
}

async function main() {
  const donor = await ensureUser({
    email: "donor-a@example.com",
    role: "donor",
    displayName: "Donor Test",
    organizationId: "donor-org-test",
    organizationName: "Donor Test Organization",
  });

  const recipient = await ensureUser({
    email: "recipient-a@example.com",
    role: "recipient",
    displayName: "Recipient Test",
    organizationId: "recipient-org-test",
    organizationName: "Recipient Test Organization",
  });

  await db.collection("donations").doc("test-bakery-box").set({
    organizationId: "donor-org-test",
    createdBy: donor.uid,
    status: "available",
    title: "Test Bakery Box",
    description: [
      "Category: bakery",
      "Expiry: 4 hours",
      "Pickup address: 123 Test Street",
      "Instructions: Retrieval integration test",
    ].join("\n"),
    quantity: "5 items",
  });

  console.log("");
  console.log("Emulator seed complete.");
  console.log(`Donor: donor-a@example.com / ${PASSWORD}`);
  console.log(`Recipient: recipient-a@example.com / ${PASSWORD}`);
  console.log(`Donor UID: ${donor.uid}`);
  console.log(`Recipient UID: ${recipient.uid}`);
  console.log("Donation: Test Bakery Box");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  });