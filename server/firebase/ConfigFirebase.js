const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
  apiKey: "AIzaSyBT8eLAjKP4Z7BQHM0aP7Atk_FUDfknpHo",
  authDomain: "it-iuh-thesis-management.firebaseapp.com",
  projectId: "it-iuh-thesis-management",
  storageBucket: "it-iuh-thesis-management.appspot.com",
  messagingSenderId: "826415557007",
  appId: "1:826415557007:web:253b963c83e5bff93183fa",
  measurementId: "G-54HJ29111N",
  databaseURL:
    "https://it-iuh-thesis-management-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

module.exports = { app, database };
