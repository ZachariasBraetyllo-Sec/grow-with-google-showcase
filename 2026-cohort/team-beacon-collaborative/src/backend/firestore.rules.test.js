const fs = require("fs");
const path = require("path");

const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require("@firebase/rules-unit-testing");

const {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} = require("firebase/firestore");

const PROJECT_ID = "beacon-food-network";

let testEnv;

async function seedTestData() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // --------------------------------------------------
    // USERS
    // --------------------------------------------------

    await setDoc(doc(db, "users", "admin-test"), {
      role: "admin",
      accountStatus: "active",
      displayName: "Admin Test",
      organizationId: "platform-admin",
    });

    await setDoc(doc(db, "users", "donor-a-test"), {
      role: "donor",
      accountStatus: "active",
      displayName: "Donor A",
      organizationId: "donor-org-a",
    });

    await setDoc(doc(db, "users", "donor-b-test"), {
      role: "donor",
      accountStatus: "active",
      displayName: "Donor B",
      organizationId: "donor-org-b",
    });

    await setDoc(doc(db, "users", "recipient-a-test"), {
      role: "recipient",
      accountStatus: "active",
      displayName: "Recipient A",
      organizationId: "recipient-org-a",
    });

    await setDoc(doc(db, "users", "recipient-b-test"), {
      role: "recipient",
      accountStatus: "active",
      displayName: "Recipient B",
      organizationId: "recipient-org-b",
    });

    await setDoc(doc(db, "users", "suspended-donor-test"), {
      role: "donor",
      accountStatus: "suspended",
      displayName: "Suspended Donor",
      organizationId: "donor-org-a",
    });

    // --------------------------------------------------
    // ORGANIZATIONS
    // --------------------------------------------------

    await setDoc(doc(db, "organizations", "donor-org-a"), {
      name: "Donor Organization A",
      type: "donor",
      verificationStatus: "approved",
      createdBy: "donor-a-test",
    });

    await setDoc(doc(db, "organizations", "donor-org-b"), {
      name: "Donor Organization B",
      type: "donor",
      verificationStatus: "approved",
      createdBy: "donor-b-test",
    });

    await setDoc(doc(db, "organizations", "recipient-org-a"), {
      name: "Recipient Organization A",
      type: "recipient",
      verificationStatus: "approved",
      createdBy: "recipient-a-test",
    });

    await setDoc(doc(db, "organizations", "recipient-org-b"), {
      name: "Recipient Organization B",
      type: "recipient",
      verificationStatus: "approved",
      createdBy: "recipient-b-test",
    });

    // --------------------------------------------------
    // DONATIONS
    // --------------------------------------------------

    await setDoc(doc(db, "donations", "donation-a-001"), {
      organizationId: "donor-org-a",
      createdBy: "donor-a-test",
      status: "available",
      title: "Fresh Produce Box",
      description: "Mixed surplus fruits and vegetables",
      quantity: "10 boxes",
    });

    await setDoc(doc(db, "donations", "donation-reserved-001"), {
      organizationId: "donor-org-a",
      createdBy: "donor-a-test",
      status: "reserved",
      title: "Reserved Produce",
      description: "Already reserved",
      quantity: "2 boxes",
    });

    // --------------------------------------------------
    // RESERVATIONS
    // --------------------------------------------------

    await setDoc(doc(db, "reservations", "reservation-a-001"), {
      donationId: "donation-a-001",
      recipientOrganizationId: "recipient-org-a",
      createdBy: "recipient-a-test",
      status: "active",
    });
  });
}

async function runTests() {
  try {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: "127.0.0.1",
        port: 8080,
        rules: fs.readFileSync(
          path.join(__dirname, "..", "..", "firestore.rules"),
          "utf8"
        ),
      },
    });

    await testEnv.clearFirestore();
    await seedTestData();

    console.log("\nRunning Firestore security tests...\n");

    // --------------------------------------------------
    // AUTH CONTEXTS
    // --------------------------------------------------

    const adminDb =
      testEnv.authenticatedContext("admin-test").firestore();

    const donorADb =
      testEnv.authenticatedContext("donor-a-test").firestore();

    const donorBDb =
      testEnv.authenticatedContext("donor-b-test").firestore();

    const recipientADb =
      testEnv.authenticatedContext("recipient-a-test").firestore();

    const recipientBDb =
      testEnv.authenticatedContext("recipient-b-test").firestore();

    const suspendedDonorDb =
      testEnv.authenticatedContext("suspended-donor-test").firestore();

    const attackerDb =
      testEnv.authenticatedContext("attacker-test").firestore();

    const unauthenticatedDb =
      testEnv.unauthenticatedContext().firestore();

    // --------------------------------------------------
    // BASIC READ ACCESS
    // --------------------------------------------------

    await assertSucceeds(
      getDoc(doc(adminDb, "users", "donor-a-test"))
    );
    console.log(
      "PASS: Admin can read another user's profile"
    );

    await assertSucceeds(
      getDoc(doc(donorADb, "donations", "donation-a-001"))
    );
    console.log(
      "PASS: Approved donor can read donations"
    );

    await assertSucceeds(
      getDoc(doc(recipientADb, "donations", "donation-a-001"))
    );
    console.log(
      "PASS: Approved recipient can read donations"
    );

    await assertFails(
      getDoc(
        doc(
          unauthenticatedDb,
          "donations",
          "donation-a-001"
        )
      )
    );
    console.log(
      "PASS: Unauthenticated user cannot read donations"
    );

    // --------------------------------------------------
    // RESERVATION ACCESS
    // --------------------------------------------------

    await assertSucceeds(
      getDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-a-001"
        )
      )
    );
    console.log(
      "PASS: Recipient A can read its own reservation"
    );

    await assertFails(
      getDoc(
        doc(
          recipientBDb,
          "reservations",
          "reservation-a-001"
        )
      )
    );
    console.log(
      "PASS: Recipient B cannot read Recipient A's reservation"
    );

    // --------------------------------------------------
    // CROSS-ORG WRITE
    // --------------------------------------------------

    await assertFails(
      updateDoc(
        doc(
          donorBDb,
          "donations",
          "donation-a-001"
        ),
        {
          title: "Unauthorized Edit",
        }
      )
    );
    console.log(
      "PASS: Donor B cannot modify Donor A's donation"
    );

    // --------------------------------------------------
    // VALID DONOR CREATE
    // --------------------------------------------------

    await assertSucceeds(
      setDoc(
        doc(
          donorADb,
          "donations",
          "donation-a-002"
        ),
        {
          organizationId: "donor-org-a",
          createdBy: "donor-a-test",
          status: "available",
          title: "Bakery Surplus",
          description: "Bread and pastries",
          quantity: "6 boxes",
        }
      )
    );
    console.log(
      "PASS: Approved Donor A can create a donation"
    );

    // --------------------------------------------------
    // VALID RECIPIENT CREATE
    // --------------------------------------------------

    await assertSucceeds(
      setDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-a-002"
        ),
        {
          donationId: "donation-a-002",
          recipientOrganizationId: "recipient-org-a",
          createdBy: "recipient-a-test",
          status: "active",
        }
      )
    );
    console.log(
      "PASS: Approved Recipient A can create a reservation"
    );

    // --------------------------------------------------
    // NON-ADMIN ORGANIZATION UPDATE
    // --------------------------------------------------

    await assertFails(
      updateDoc(
        doc(
          donorADb,
          "organizations",
          "donor-org-a"
        ),
        {
          verificationStatus: "approved",
        }
      )
    );
    console.log(
      "PASS: Non-admin cannot update organization verification"
    );

    // --------------------------------------------------
    // SUSPENDED USER
    // --------------------------------------------------

    await assertFails(
      setDoc(
        doc(
          suspendedDonorDb,
          "donations",
          "suspended-donation-001"
        ),
        {
          organizationId: "donor-org-a",
          createdBy: "suspended-donor-test",
          status: "available",
          title: "Blocked Donation",
          description: "Should not be allowed",
          quantity: "1 box",
        }
      )
    );
    console.log(
      "PASS: Suspended donor cannot create donations"
    );

    // --------------------------------------------------
    // USER CANNOT CLAIM AN APPROVED ORGANIZATION
    // --------------------------------------------------

    await assertFails(
      setDoc(
        doc(
          attackerDb,
          "users",
          "attacker-test"
        ),
        {
          role: "donor",
          accountStatus: "active",
          displayName: "Attacker",
          organizationId: "donor-org-a",
        }
      )
    );
    console.log(
      "PASS: User cannot attach themselves to another approved organization"
    );

    // --------------------------------------------------
    // ORGANIZATION CANNOT SELF-APPROVE
    // --------------------------------------------------

    await assertFails(
      setDoc(
        doc(
          attackerDb,
          "organizations",
          "attacker-org"
        ),
        {
          name: "Attacker Organization",
          type: "donor",
          verificationStatus: "approved",
          createdBy: "attacker-test",
        }
      )
    );
    console.log(
      "PASS: Organization cannot self-approve during creation"
    );

    // --------------------------------------------------
    // RESERVATION REQUIRES EXISTING DONATION
    // --------------------------------------------------

    await assertFails(
      setDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-missing-donation"
        ),
        {
          donationId: "does-not-exist",
          recipientOrganizationId: "recipient-org-a",
          createdBy: "recipient-a-test",
          status: "active",
        }
      )
    );
    console.log(
      "PASS: Recipient cannot reserve a missing donation"
    );

    // --------------------------------------------------
    // RESERVATION REQUIRES AVAILABLE DONATION
    // --------------------------------------------------

    await assertFails(
      setDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-unavailable-donation"
        ),
        {
          donationId: "donation-reserved-001",
          recipientOrganizationId: "recipient-org-a",
          createdBy: "recipient-a-test",
          status: "active",
        }
      )
    );
    console.log(
      "PASS: Recipient cannot reserve a non-available donation"
    );

    // --------------------------------------------------
    // DONATION OWNERSHIP FIELDS ARE IMMUTABLE
    // --------------------------------------------------

    await assertFails(
      updateDoc(
        doc(
          donorADb,
          "donations",
          "donation-a-001"
        ),
        {
          organizationId: "donor-org-b",
        }
      )
    );
    console.log(
      "PASS: Donor cannot change donation organization ownership"
    );

    await assertFails(
      updateDoc(
        doc(
          donorADb,
          "donations",
          "donation-a-001"
        ),
        {
          createdBy: "donor-b-test",
        }
      )
    );
    console.log(
      "PASS: Donor cannot change donation creator ownership"
    );

    // --------------------------------------------------
    // RESERVATION OWNERSHIP FIELDS ARE IMMUTABLE
    // --------------------------------------------------

    await assertFails(
      updateDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-a-001"
        ),
        {
          recipientOrganizationId: "recipient-org-b",
        }
      )
    );
    console.log(
      "PASS: Recipient cannot change reservation organization ownership"
    );

    await assertFails(
      updateDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-a-001"
        ),
        {
          donationId: "donation-reserved-001",
        }
      )
    );
    console.log(
      "PASS: Recipient cannot change reservation donation ownership"
    );

    await assertFails(
      updateDoc(
        doc(
          recipientADb,
          "reservations",
          "reservation-a-001"
        ),
        {
          createdBy: "recipient-b-test",
        }
      )
    );
    console.log(
      "PASS: Recipient cannot change reservation creator ownership"
    );

    console.log(
      "\nAll current security tests passed.\n"
    );
  } catch (error) {
    console.error("\nTEST FAILURE:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (testEnv) {
      await testEnv.cleanup();
    }
  }
}

runTests();