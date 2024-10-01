import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBT8eLAjKP4Z7BQHM0aP7Atk_FUDfknpHo",
  authDomain: "it-iuh-thesis-management.firebaseapp.com",
  projectId: "it-iuh-thesis-management",
  storageBucket: "it-iuh-thesis-management.appspot.com",
  messagingSenderId: "826415557007",
  appId: "1:826415557007:web:253b963c83e5bff93183fa",
  measurementId: "G-54HJ29111N",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Firebase Auth và export
const auth = getAuth(app);

export { auth, app };
