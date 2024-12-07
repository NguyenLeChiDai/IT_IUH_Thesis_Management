export const apiUrl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:5000/api"
    : "https://khoaluantotnghiep-iuh.onrender.com/api"; // URL khi deploy

export const LOCAL_STORAGE_TOKEN_NAME = "token";

export const socketUrl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:5000"
    : "https://khoaluantotnghiep-iuh.onrender.com"; // URL khi deploy
