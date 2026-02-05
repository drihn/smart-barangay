// src/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://smart-barangay-production.up.railway.app",
});

export default api;
