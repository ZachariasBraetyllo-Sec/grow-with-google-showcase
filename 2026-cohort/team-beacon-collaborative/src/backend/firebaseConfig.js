import {
  initializeApp,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";

import {
  getAuth,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
  getFirestore,
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";

const firebaseConfig = {
  projectId: "beacon-food-network",
  appId: "1:123292770172:web:cdafd8ea8b210e982d4ef9",
  storageBucket: "beacon-food-network.firebasestorage.app",
  apiKey: "AIzaSyCa3zCmH2m-ZKS74SZOHigg3zkOAvHdnco",
  authDomain: "beacon-food-network.firebaseapp.com",
  messagingSenderId: "123292770172",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);