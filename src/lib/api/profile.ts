// // src/lib/api/profile
// import apiClient from "./apiClient";
// import axios

// export interface ProfileResponse {
//   data: Array<object>;
//   farmProfile: object | null;
//   id: string;
//   uid: string;
//   farmName: string;
//   farmType: string;
//   farmSize: number;
//   farmSizeUnit: string;
//   establishedYear: number;
//   location: {
//     country: string;
//     state: string;
//     city: string;
//     address: string;
//     coordinates: [number, number];
//   };
//   currency: string;
//   timezone: string;
//   primaryCrops: string[];
//   farmingMethods: string[];
//   seasonalPattern: string;
//   language: string;
//   owner: {
//     firstName: string;
//     lastName: string;
//     phoneNumber: string;
//   };
//   createdAt: string;
//   updatedAt: string;
// }

// export const getProfile = async (
//   token: string,
//   id: string
// ): Promise<ProfileResponse | null> => {
//   try {
//     const { data } = await apiClient.get<ProfileResponse>(
//       `/api/get-profile/${id}`,
//       {
//         headers: { Authorization: `Bearer ${token}` },
//       }
//     );
//     return data;
//   } catch (error) {
//     if (axios.isAxiosError(error) && error.response?.status === 404) {
//       return null;
//     }
//     throw new Error("Failed to fetch profile");
//   }
// };
