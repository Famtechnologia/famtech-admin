// src/lib/api/auth.ts
import apiClient from "./apiClient"; // ✅ use the shared client
import axios from "axios";

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
}

export interface RegisterResponse {
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      role?: string;
      country?: string;
      state?: string;
      lga?: string;
      isVerified?: boolean;
    };
    tokens?: {
      accessToken: string;
      refreshToken?: string;
    };
  };
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  state: string;
  lga?: string; // 👈 optional LGA
}

export const register = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      "/auth/signup",
      payload,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const responseData = error.response.data;
      let errorMessage = "Registration failed"; // Default message

      if (responseData) {
        if (
          responseData.errors &&
          typeof responseData.errors === "object" &&
          Object.keys(responseData.errors).length > 0
        ) {
          const errorMessages = Object.values(responseData.errors)
            .flat()
            .map((error: unknown) => {
              if (typeof error === "string") {
                return error;
              } // Assuming the error object has a 'message' property
              if (
                error &&
                typeof error === "object" &&
                "message" in error &&
                typeof error.message === "string"
              ) {
                return error.message;
              } // Fallback for unexpected error structures
              return "An unknown validation error occurred.";
            }); // Join the messages, filtering out any null/undefined entries.
          errorMessage = errorMessages.filter(Boolean).join(". ");
        } else if (responseData.message || responseData.error) {
          errorMessage = responseData.message || responseData.error;
        }
      } // Ensure a final message is always available
      throw new Error(errorMessage || "Registration failed");
    }
    throw new Error("Network error occurred");
  }
};

export const verifyEmail = async (
  token: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    await apiClient.get(`/auth/verify-email?token=${token}`);
    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Email verification failed";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const getMe = async (id: string) => {
  try {
    const { data } = await apiClient.get(`/auth/admin/me/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const getUsers = async (limit?: number, page?: number) => {
  try {
    const params = new URLSearchParams();
    if (typeof limit === "number") params.append("limit", String(limit));
    if (typeof page === "number") params.append("page", String(page));

    const query = params.toString();
    const endpoint = query ? `/auth/farmers?${query}` : `/auth/farmers`;

    const { data } = await apiClient.get(endpoint);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch farmers";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const getUserById = async (id: string) => {
  try {
    const { data } = await apiClient.get(`/auth/farmers/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export interface UpdateUserPayload {
  country?: string;
  state?: string;
  lga?: string;
  language?: string;
}

export const update = async (id: string, payload: UpdateUserPayload) => {
  try {
    const { data } = await apiClient.put(`/auth/update/${id}`, payload);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const toggleVerify = async (id: string) => {
  try {
    const { data } = await apiClient.put(`/auth/toggle-verification/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const resendVerify = async (email: string) => {
  try {
    const { data } = await apiClient.post(`/auth/resend-verification`, {
      email,
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const deleteUser = async (id: string) => {
  try {
    const { data } = await apiClient.delete(`/auth/delete/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const deleteMultipleUser = async (ids: string[]) => {
  try {
    const { data } = await apiClient.post(`/auth//delete-multiple`, { ids });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete user";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const verifyMultipleUser = async (ids: string[]) => {
  try {
    const { data } = await apiClient.post(`/auth/verify-farmers`, { ids });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to verify users";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const unverifyMultipleUser = async (ids: string[]) => {
  try {
    const { data } = await apiClient.post(`/auth/unverify-farmers`, { ids });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to unverify users";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};


