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
  office: string;
  createdAt?: string;
  role?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const { data } = await apiClient.post<LoginResponse>(
      "/v1/api/admin/login",
      {
        email,
        password,
      },
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

export const verifyCode = async (
  code: string,
  email: string,
): Promise<LoginResponse> => {
  try {
    const { data } = await apiClient.post<LoginResponse>(
      "/v1/api/admin/verify-code",
      {
        code,
        email,
      },
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Verification failed";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred during verification.");
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
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      "/auth/signup",
      payload,
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
          const errorMessages = Object.values(responseData?.errors)
            ?.flat()
            ?.map((error: unknown) => {
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
    const { data } = await apiClient.get("/v1/api/admin/profile");
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
    const { data } = await apiClient.get("/v1/api/admin/farmers");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch users";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred during fetching users.");
  }
};

export const getAllAdmins = async () => {
  try {
    const { data } = await apiClient.get("/v1/api/admin/admins");
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch admins";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred while fetching admins.");
  }
};

// Get a single admin by id
export const getAdminById = async (id: string): Promise<RegisterResponse> => {
  try {
    const { data } = await apiClient.get<RegisterResponse>(
      `/v1/api/admin/${id}`,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch admin";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred while fetching admin.");
  }
};

export const verifyAdmin = async (
  id: string,
): Promise<{ message?: string; success?: boolean }> => {
  try {
    const { data } = await apiClient.post(`/v1/api/admin/verify/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to verify admin";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred while verifying admin.");
  }
};

export const deleteAdmin = async (
  id: string,
): Promise<{ message?: string; success?: boolean }> => {
  try {
    const { data } = await apiClient.delete(`/v1/api/admin/delete/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to delete admin";
      throw new Error(message);
    }
    throw new Error("An unknown error occurred while deleting admin.");
  }
};

// Create a new admin account
export const createAdmin = async (
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  try {
    const { data } = await apiClient.post<RegisterResponse>(
      "/v1/api/admin/create",
      payload,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error?.response) {
      const responseData = error?.response?.data;
      let errorMessage = "Admin creation failed";

      if (responseData) {
        if (
          responseData?.errors &&
          typeof responseData?.errors === "object" &&
          Object?.keys(responseData?.errors)?.length > 0
        ) {
          const errorMessages = Object.values(responseData?.errors)
            ?.flat()
            ?.map((err: unknown) => {
              if (typeof err === "string") return err;
              if (err && typeof err === "object" && "message" in err) {
                const msg = (err as { message?: string }).message;
                if (typeof msg === "string") return msg;
              }
              return "An unknown validation error occurred.";
            });
          errorMessage = errorMessages?.filter(Boolean)?.join(". ");
        } else if (responseData?.message || responseData?.error) {
          errorMessage = responseData?.message || responseData?.error;
        }
      }

      throw new Error(errorMessage || "Admin creation failed");
    }
    throw new Error("Network error occurred");
  }
};

// Create a new admin account
export const updateAdmin = async (
  id: string,
  payload: RegisterPayload,
): Promise<RegisterResponse> => {
  try {
    const { data } = await apiClient.put<RegisterResponse>(
      `/v1/api/admin/update/${id}`,
      payload,
    );
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error?.response) {
      const responseData = error?.response?.data;
      let errorMessage = "Admin update failed";

      if (responseData) {
        if (
          responseData?.errors &&
          typeof responseData?.errors === "object" &&
          Object?.keys(responseData?.errors)?.length > 0
        ) {
          const errorMessages = Object.values(responseData?.errors)
            ?.flat()
            ?.map((err: unknown) => {
              if (typeof err === "string") return err;
              if (err && typeof err === "object" && "message" in err) {
                const msg = (err as { message?: string }).message;
                if (typeof msg === "string") return msg;
              }
              return "An unknown validation error occurred.";
            });
          errorMessage = errorMessages?.filter(Boolean)?.join(". ");
        } else if (responseData?.message || responseData?.error) {
          errorMessage = responseData?.message || responseData?.error;
        }
      }

      throw new Error(errorMessage || "Admin update failed");
    }
    throw new Error("Network error occurred");
  }
};

// Toggle admin active status
export const toggleVerifyAdmin = async (
  id: string,
): Promise<{ message?: string; success?: boolean }> => {
  try {
    const { data } = await apiClient.put(`/v1/api/admin/toggle-active/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to toggle admin active status";
      throw new Error(message);
    }
    throw new Error(
      "An unknown error occurred while toggling admin active status.",
    );
  }
};
