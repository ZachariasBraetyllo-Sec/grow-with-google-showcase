import {
  browserLocalPersistence,
  browserSessionPersistence,
  connectAuthEmulator,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { auth } from "../../backend/firebaseConfig.js";
import { loginWithEmail } from "../../backend/authHelpers.js";

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

window.NourishShareAuth = {
  authHost: auth.emulatorConfig
    ? `${auth.emulatorConfig.host}:${auth.emulatorConfig.port}`
    : "production",

  async signIn({ email, password, remember }) {
    await setPersistence(
      auth,
      remember
        ? browserLocalPersistence
        : browserSessionPersistence
    );

    return loginWithEmail(auth, email, password);
  },
};
