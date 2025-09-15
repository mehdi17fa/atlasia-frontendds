import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: API_URL,
});

// Add token automatically if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // or sessionStorage depending on your login logic
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
