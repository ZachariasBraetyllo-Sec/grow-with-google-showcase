import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

/**
 * Returns the signed-in user's Firestore profile.
 */
export async function getCurrentUserProfile(db, auth) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error("User profile does not exist.");
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

/**
 * Creates a new donation for the signed-in donor.
 *
 * Security Rules still enforce:
 * - active account
 * - donor role
 * - approved organization
 * - matching organizationId
 * - matching createdBy UID
 * - initial status = available
 */
export async function createDonation(
  db,
  auth,
  {
    title,
    description,
    quantity,
  }
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const profile =
    await getCurrentUserProfile(db, auth);

  if (profile.role !== "donor") {
    throw new Error(
      "Only donor accounts can create donations."
    );
  }

  const donation = {
    organizationId: profile.organizationId,
    createdBy: user.uid,
    status: "available",
    title: title.trim(),
    description: description.trim(),
    quantity: quantity.trim(),
  };

  const donationRef = await addDoc(
    collection(db, "donations"),
    donation
  );

  return {
    id: donationRef.id,
    ...donation,
  };
}

/**
 * Returns donations created by the signed-in donor.
 */
export async function getMyDonations(db, auth) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const profile =
    await getCurrentUserProfile(db, auth);

  if (profile.role !== "donor") {
    throw new Error(
      "Only donor accounts can view donor donations."
    );
  }

  const donationsQuery = query(
    collection(db, "donations"),
    where("createdBy", "==", user.uid)
  );

  const snapshot = await getDocs(donationsQuery);

  return snapshot.docs.map((donationDoc) => ({
    id: donationDoc.id,
    ...donationDoc.data(),
  }));
}

/**
 * Returns donations currently marked available.
 *
 * Firestore Security Rules determine whether
 * the current user is permitted to read them.
 */
export async function getAvailableDonations(db) {
  const donationsQuery = query(
    collection(db, "donations"),
    where("status", "==", "available")
  );

  const snapshot =
    await getDocs(donationsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

/**
 * Atomically reserves one donation.
 *
 * The reservation document ID intentionally equals
 * the donation document ID.
 *
 * Both writes succeed together:
 *
 * donations/{donationId}
 * status: available -> reserved
 *
 * reservations/{donationId}
 * new active reservation
 *
 * Security Rules independently enforce the same
 * relationship with getAfter().
 */
export async function reserveDonation(
  db,
  auth,
  donationId
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const profile =
    await getCurrentUserProfile(db, auth);

  if (profile.role !== "recipient") {
    throw new Error(
      "Only recipient accounts can reserve donations."
    );
  }

  const donationRef = doc(
    db,
    "donations",
    donationId
  );

  const reservationRef = doc(
    db,
    "reservations",
    donationId
  );

  await runTransaction(
    db,
    async (transaction) => {
      const donationSnapshot =
        await transaction.get(donationRef);

      if (!donationSnapshot.exists()) {
        throw new Error(
          "Donation does not exist."
        );
      }

      const donation =
        donationSnapshot.data();

      if (donation.status !== "available") {
        throw new Error(
          "Donation is no longer available."
        );
      }

      transaction.update(
        donationRef,
        {
          status: "reserved",
        }
      );

      transaction.set(
        reservationRef,
        {
          donationId,
          recipientOrganizationId:
            profile.organizationId,
          createdBy: user.uid,
          status: "active",
        }
      );
    }
  );

  return {
    donationId,
    reservationId: donationId,
    status: "active",
  };
}

/**
 * Returns reservations belonging to the signed-in
 * recipient organization.
 */
export async function getMyReservations(
  db,
  auth
) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User must be signed in.");
  }

  const profile =
    await getCurrentUserProfile(db, auth);

  if (profile.role !== "recipient") {
    throw new Error(
      "Only recipient accounts have recipient reservations."
    );
  }

  const reservationsQuery = query(
    collection(db, "reservations"),
    where(
      "recipientOrganizationId",
      "==",
      profile.organizationId
    ),
    where("createdBy", "==", user.uid)
  );

  const snapshot =
    await getDocs(reservationsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}
/**
 * Returns recipient reservations with their donation details.
 */
export async function getMyReservationDetails(db, auth) {
  const reservations =
    await getMyReservations(db, auth);

  return Promise.all(
    reservations.map(async (reservation) => {
      const donationSnapshot = await getDoc(
        doc(db, "donations", reservation.donationId)
      );

      return {
        ...reservation,
        donation: donationSnapshot.exists()
          ? {
              id: donationSnapshot.id,
              ...donationSnapshot.data(),
            }
          : null,
      };
    })
  );
}


/**
 * Approves an organization.
 *
 * This is intended for an authenticated admin.
 * Firestore Security Rules provide the authoritative
 * authorization check.
 */
export async function approveOrganization(
  db,
  organizationId
) {
  const organizationRef = doc(
    db,
    "organizations",
    organizationId
  );

  await updateDoc(
    organizationRef,
    {
      verificationStatus: "approved",
    }
  );

  return {
    organizationId,
    verificationStatus: "approved",
  };
}

/**
 * Rejects an organization.
 *
 * Firestore Security Rules restrict organization
 * updates to admins.
 */
export async function rejectOrganization(
  db,
  organizationId
) {
  const organizationRef = doc(
    db,
    "organizations",
    organizationId
  );

  await updateDoc(
    organizationRef,
    {
      verificationStatus: "rejected",
    }
  );

  return {
    organizationId,
    verificationStatus: "rejected",
  };
}

