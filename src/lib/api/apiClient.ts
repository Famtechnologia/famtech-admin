import axios from "axios";
import { token } from "../api";

export const API_URL = "http://localhost:4000";
 //export const API_URL = "https://api-famtech-backend-app.onrender.com";

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  withCredentials: true,
});

// 🚀 Request Interceptor → attach accessToken automatically

apiClient.interceptors.request.use(
  async (config) => {
    let accessToken;

    if (typeof window !== "undefined") {
      // Client-side: Read from document.cookie
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(";").shift();
      };
      accessToken = getCookie("famtech-token");
    } else {
      // Server-side: Use the server action
      try {
        const t = await token();
        accessToken = t?.value;
      } catch (error) {
        console.warn("Failed to retrieve token on server:", error);
      }
    }

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
