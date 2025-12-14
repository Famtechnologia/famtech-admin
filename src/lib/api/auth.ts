// src/lib/api/auth.ts
import apiClient from "./apiClient"; // ✅ use the shared client
import axios from "axios";

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface RegisterResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: {
    country: string;
    state: string;
    city: string;
    address: string;
  };
  action: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
  isVerified?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    const { data } = await apiClient.post<LoginResponse>(
      "/v1/api/admin/login",
      {
        email,
        password,
      }
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred during login.");
  }
};

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  location: {
    country: string;
    state: string;
    city: string;
    address: string;
  };
  action: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  };
}

export const register = async (
  payload: RegisterPayload
): Promise<RegisterResponse> => {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      "/auth/signup",
      payload
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error?.response) {
      const responseData = error?.response?.data;
      let errorMessage = "Registration failed"; // Default message

      if (responseData) {
        if (
          responseData?.errors &&
          typeof responseData?.errors === "object" &&
          Object?.keys(responseData?.errors)?.length > 0
        ) {
          const errorMessages = Object.values(responseData?.errors)?
            .flat()?
            .map((error: unknown) => {
              if (typeof error === "string") {
                return error;
              } // Assuming the error object has a 'message' property
              if (
                error &&
                typeof error === "object" &&
                "message" in error &&
                typeof error?.message === "string"
              ) {
                return error?.message;
              } // Fallback for unexpected error structures
              return "An unknown validation error occurred.";
            }); // Join the messages, filtering out any null/undefined entries.
          errorMessage = errorMessages?.filter(Boolean)?.join(". ");
        } else if (responseData?.message || responseData?.error) {
          errorMessage = responseData?.message || responseData?.error;
        }
      } // Ensure a final message is always available
      throw new Error(errorMessage || "Registration failed");
    }
    throw new Error("Network error occurred");
  }
};

export const profile = async () => {
  try {
    const { data } = await apiClient.get(
      "/v1/api/admin/profile"
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred during login.");
  }
};

export const getUsers = async () => {
  try {
    const { data } = await apiClient.get(
      "/v1/api/admin/farmers"
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Login failed";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred during login.");
  }
};