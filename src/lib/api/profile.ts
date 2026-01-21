import apiClient from "./apiClient";
import axios from "axios";

export interface ProfileResponse {
  data: Array<object>;
  farmProfile: object | null;
  id: string;
  uid: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  farmName: string;
  farmType: string;
  farmSize: number | string;
  farmSizeUnit: string;
  establishedYear: number;
  country: string;
  state: string;
  city: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  currency: string;
  timezone: string;
  primaryCrops?: string[];
  farmingMethods?: string[];
  seasonalPattern: string;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getProfile = async (
  id: string,
): Promise<ProfileResponse | null> => {
  try {
    const { data } = await apiClient.get(`/api/get-profile/${id}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle 404 gracefully - profile doesn't exist yet
      if (error.response?.status === 404) {
        return null;
      }
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to fetch profile";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const createProfile = async (
  id: string,
  profileData: Partial<ProfileResponse>,
): Promise<any> => {
  try {
    const { data } = await apiClient.post(`/api/create-farm-profile`, profileData);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create profile";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

export const updateProfile = async (
  id: string,
  profileData: Partial<ProfileResponse>,
): Promise<any> => {
  try {
    const { data } = await apiClient.put(`/api/update-farm-profile/${id}`, profileData);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to update profile";
      throw new Error(message);
    }
    throw new Error("Network error occurred");
  }
};

