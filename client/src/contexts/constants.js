export const apiUrl =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:5000/api"
    : "somedeployURL";

export const LOCAL_STORAGE_TOKEN_NAME = "chidai";
