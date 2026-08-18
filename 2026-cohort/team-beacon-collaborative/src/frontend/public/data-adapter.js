import {
  connectAuthEmulator,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
  connectFirestoreEmulator,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

import {
  auth,
  db,
} from "../../backend/firebaseConfig.js";

import {
  createDonation,
  reserveDonation,
} from "../../backend/firebaseHelpers.js";

const isLocalDevelopment =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

if (isLocalDevelopment && !auth.emulatorConfig) {
  connectAuthEmulator(
    auth,
    "http://127.0.0.1:9099",
    { disableWarnings: true }
  );
}

if (isLocalDevelopment) {
  try {
    connectFirestoreEmulator(
      db,
      "127.0.0.1",
      8080
    );
  } catch (error) {
    // Ignore if this Firestore instance was already connected.
  }
}

window.NourishShareData = {
  createDonation: async ({
    title,
    description,
    quantity,
  }) => {
    return createDonation(
      db,
      auth,
      {
        title,
        description,
        quantity,
      }
    );
  },

  reserveDonation: async (donationId) => {
    return reserveDonation(
      db,
      auth,
      donationId
    );
  },
};
