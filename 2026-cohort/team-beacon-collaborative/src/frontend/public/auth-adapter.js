import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { auth } from "../../backend/firebaseConfig.js";
import { loginWithEmail } from "../../backend/authHelpers.js";

window.NourishShareAuth = {
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
