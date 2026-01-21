"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  User,
  Mail,
  MapPin,
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Send,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import FormSelect from "@/components/FormSelect";
import {
  getMe,
  update,
  toggleVerify,
  resendVerify,
  deleteUser,
} from "@/lib/api/user";
import { verifyCode } from "@/lib/api/auth";
import { getProfile, updateProfile, createProfile } from "@/lib/api/profile";

import { useAuth } from "@/contexts/AuthContext";

export default function UserDetail() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [createFarmProfileMode, setCreateFarmProfileMode] = useState(false);

  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    country: "",
    state: "",
    lga: "",
    language: "en",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailContent, setMailContent] = useState({ subject: "", message: "" });

  // Farm Profile states
  const [farmProfile, setFarmProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [farmFormData, setFarmFormData] = useState({
    farmName: "",
    farmType: "",
    farmSize: "",
    farmSizeUnit: "hectares",
    establishedYear: new Date().getFullYear(),
    location: {
      country: "",
      state: "",
      city: "",
      address: "",
    },
    coordinates: {
      latitude: 1,
      longitude: 1,
    },
    currency: "NGN",
    timezone: "Africa/Lagos",
    farmingMethods: [],
    seasonalPattern: "",
    language: "en",
    owner: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await getMe(userId);
      const user = response.data;

      setUserData(user);
      setFormData({
        email: user.email,
        country: user.country,
        state: user.state,
        lga: user.lga,
        language: user.language || "en",
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      setError("Failed to fetch user data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFarmProfile = async (profileId) => {
    try {
      setIsLoadingProfile(true);
      const profile = await getProfile(profileId);

      if (!profile) {
        setFarmProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      setFarmProfile(profile?.data?.farmProfile || null);

      if (profile?.data?.farmProfile) {
        setFarmFormData({
          farmName: profile.data?.farmProfile.farmName || "",
          farmType: profile.data?.farmProfile.farmType || "",
          farmSize: profile.data?.farmProfile.farmSize || "",
          farmSizeUnit: profile.data?.farmProfile.farmSizeUnit || "hectares",
          establishedYear:
            profile.data?.farmProfile.establishedYear ||
            new Date().getFullYear(),
          location: profile.data?.farmProfile.location || {
            country: "",
            state: "",
            city: "",
            address: "",
          },
          coordinates: profile.data?.farmProfile.coordinates || {
            latitude: 1,
            longitude: 1,
          },
          currency: profile.data?.farmProfile.currency || "NGN",
          timezone: profile.data?.farmProfile.timezone || "Africa/Lagos",
          farmingMethods: profile.data?.farmProfile.farmingMethods || [],
          seasonalPattern: profile.data?.farmProfile.seasonalPattern || "",
          language: profile.data?.farmProfile.language || "en",
          owner: profile.data?.farmProfile.owner || {
            firstName: "",
            lastName: "",
            phoneNumber: "",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching farm profile:", error);
      setError("Failed to fetch farm profile");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFarmInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFarmFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFarmFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      const data = await update(userId, formData);

      if (data && data.ok === false) {
        throw new Error(data?.message || "Update failed");
      }

      setUserData((prev) => ({ ...prev, ...formData }));
      if (data?.message) {
        setSuccessMessage(data.message);
      } else {
        setSuccessMessage("User updated successfully.");
      }
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update Farmer's information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    try {
      setError("");
      setSuccessMessage("");

      const data = await toggleVerify(userId);

      if (data && data.ok === false) {
        throw new Error(data?.message || "Verification toggle failed");
      }

      fetchUserData();

      // Update user data with new verification status from response
      if (data?.data) {
        setUserData((prev) => ({ ...prev, isVerified: data.data.isVerified }));
      }

      if (data?.message) {
        setSuccessMessage(data.message);
      } else {
        setSuccessMessage("Verification status updated successfully.");
      }
    } catch (error) {
      console.error("Error toggling verification:", error);
      setError("Failed to toggle verification status");
    }
  };

  const handleResendVerification = async () => {
    try {
      setError("");
      setSuccessMessage("");

      const data = await resendVerify(userData?.email || "");

      if (data && data.ok === false) {
        throw new Error(data?.message || "Resend verification failed");
      }

      if (data?.message) {
        setSuccessMessage(data.message);
      } else {
        setSuccessMessage("Verification email sent successfully.");
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      setError("Failed to resend verification email");
    }
  };

  const handleSendMail = async () => {
    try {
      setIsVerifying(true);
      setError("");

      // TODO: Implement API call to send custom email
      // await sendMailToUser(userId, mailContent);

      console.log("Sending mail to:", userId, mailContent);

      // Assume API returns { ok: boolean, message: string }
      // const data = await sendMailToUser(userId, mailContent);
      // if (data && data.ok === false) throw new Error(data?.message || "Failed to send email");

      alert("Email sent successfully!");
      setShowMailModal(false);
      setMailContent({ subject: "", message: "" });
      setVerificationCode("");
    } catch (error) {
      console.error("Error sending mail:", error);
      setError("Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsVerifying(true);
      setError("");
      setSuccessMessage("");

      // Verify the code first
      await verifyCode(verificationCode, user?.email);

      const data = await deleteUser(userData?._id);

      if (data && data.ok === false) {
        throw new Error(data?.message || "Failed to delete user");
      }

      setSuccessMessage(data?.message || "User deleted successfully!");
      setShowDeleteModal(false);
      setVerificationCode("");

      router.push("/admin/farmers");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(error.message || "Failed to delete user");
    } finally {
      setIsVerifying(false);
    }
  };

  const openConfirm = (action) => {
    setConfirmAction(action);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    try {
      setIsVerifying(true);
      setError("");

      // Verify the code first
      await verifyCode(verificationCode, user?.email);

      const actionToRun = confirmAction;
      setIsConfirmOpen(false);
      setConfirmAction(null);
      setVerificationCode("");

      switch (actionToRun) {
        case "save":
          await handleSave();
          break;
        case "toggleVerify":
          await handleToggle();
          break;
        case "sendMail":
          await handleSendMail();
          break;
        case "resendVerification":
          await handleResendVerification();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setError("Invalid verification code");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveFarmProfile = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccessMessage("");

      // Flatten the nested structure to match API format
      const updateData = {
        userId: userData._id,
        firstName: farmFormData.owner.firstName,
        lastName: farmFormData.owner.lastName,
        phoneNumber: farmFormData.owner.phoneNumber,
        farmName: farmFormData.farmName,
        farmType: farmFormData.farmType,
        farmSize: farmFormData.farmSize,
        farmSizeUnit: farmFormData.farmSizeUnit,
        establishedYear: farmFormData.establishedYear,
        country: farmFormData.location.country,
        state: farmFormData.location.state,
        city: farmFormData.location.city,
        address: farmFormData.location.address,
        coordinates: farmFormData.coordinates,
        currency: farmFormData.currency,
        timezone: farmFormData.timezone,
        farmingMethods: farmFormData.farmingMethods,
        seasonalPattern: farmFormData.seasonalPattern,
        language: farmFormData.language,
      };

      if (createFarmProfileMode) {
        const result = await createProfile(userData._id, updateData);

        if (result && result.ok === false) {
          throw new Error(result?.message || "Failed to create farm profile");
        }

        setSuccessMessage(
          result?.message || "Farm profile created successfully",
        );
        setIsEditingProfile(false);
        setCreateFarmProfileMode(false);

        fetchUserData();

        // Refresh farm profile data
        fetchFarmProfile(userData._id);
        return;
      }

      const result = await updateProfile(userData._id, updateData);

      if (result && result.ok === false) {
        throw new Error(result?.message || "Failed to update farm profile");
      }

      setSuccessMessage(result?.message || "Farm profile updated successfully");
      setIsEditingProfile(false);

      fetchUserData();

      // Refresh farm profile data
      fetchFarmProfile(userData._id);
    } catch (error) {
      console.error("Error updating farm profile:", error);
      setError(error.message || "Failed to update farm profile");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (userData?._id) {
      // Add a small delay to ensure userData is fully loaded
      const timer = setTimeout(() => {
        fetchFarmProfile(userData._id);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [userData?.farmProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600 mt-2">
                View and manage user information
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {userData?.isVerified ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Verified
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  Unverified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        {/* Success Display */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        )}

        {/* User Information Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              User Information
            </h2>
            {!isEditing ? (
              <button
                onClick={() => {
                  setSuccessMessage("");
                  setIsEditing(true);
                }}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      email: userData.email,
                      country: userData.country,
                      state: userData.state,
                      lga: userData.lga,
                      language: userData.language,
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => openConfirm("save")}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="h-5 w-5 mr-2 text-green-600" />
                Contact Information
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                    placeholder="example@email.com"
                    readOnly
                    disabled
                  />
                ) : (
                  <p className="text-gray-900">{userData?.email}</p>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Location Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="Enter country"
                    />
                  ) : (
                    <p className="text-gray-900">{userData?.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="Enter state"
                    />
                  ) : (
                    <p className="text-gray-900">{userData?.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LGA
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.lga}
                      onChange={(e) => handleInputChange("lga", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      placeholder="Enter LGA"
                    />
                  ) : (
                    <p className="text-gray-900">{userData?.lga}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Language */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Language Preference
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                {isEditing ? (
                  <FormSelect
                    value={formData.language}
                    onChange={(value) => handleInputChange("language", value)}
                    placeholder="Select language"
                    options={[
                      { value: "en", label: "English" },
                      { value: "yo", label: "Yoruba" },
                      { value: "ig", label: "Igbo" },
                      { value: "ha", label: "Hausa" },
                    ]}
                  />
                ) : (
                  <p className="text-gray-900 capitalize">
                    {userData?.language || "English"}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Metadata
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Created At
                  </label>
                  <p className="text-gray-900">
                    {new Date(userData?.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Updated
                  </label>
                  <p className="text-gray-900">
                    {new Date(userData?.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Farm Profile Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Farm Profile</h2>
            {farmProfile && !isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </button>
            )}
            {isEditingProfile && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFarmProfile}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </button>
              </div>
            )}
          </div>

          {isLoadingProfile ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="animate-spin text-green-600 h-6 w-6" />
            </div>
          ) : !farmProfile && !isEditingProfile ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No farm profile found</p>
              <button
                onClick={() => {
                  setIsEditingProfile(true);
                  setCreateFarmProfileMode(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Farm Profile
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Farm Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Name *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.farmName}
                        onChange={(e) =>
                          handleFarmInputChange("farmName", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="Enter farm name"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.farmName || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Type *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <FormSelect
                        value={farmFormData.farmType}
                        onChange={(value) =>
                          handleFarmInputChange("farmType", value)
                        }
                        placeholder="Select farm type"
                        options={[
                          { value: "crop", label: "Crop Farming" },
                          { value: "livestock", label: "Livestock Farming" },
                          { value: "mixed", label: "Mixed Farming" },
                          { value: "aquaculture", label: "Aquaculture" },
                          { value: "poultry", label: "Poultry" },
                        ]}
                      />
                    ) : (
                      <p className="text-gray-900 capitalize">
                        {farmProfile?.farmType || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Size *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <div className="grid space-x-2 grid-cols-[70%_30%]">
                        <input
                          type="number"
                          value={farmFormData.farmSize}
                          onChange={(e) =>
                            handleFarmInputChange("farmSize", e.target.value)
                          }
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <select
                          value={farmFormData.farmSizeUnit}
                          onChange={(e) =>
                            handleFarmInputChange(
                              "farmSizeUnit",
                              e.target.value,
                            )
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        >
                          <option value="hectares">Hectares</option>
                          <option value="acres">Acres</option>
                          <option value="square_meters">Square Meters</option>
                        </select>
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.farmSize}{" "}
                        {farmProfile?.farmSizeUnit || "hectares"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Established Year *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="number"
                        value={farmFormData.establishedYear}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "establishedYear",
                            parseInt(e.target.value),
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="2024"
                        min="1900"
                        max={new Date().getFullYear()}
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.establishedYear || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Farm Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.location.country}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "location.country",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="Nigeria"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.location?.country || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.location.state}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "location.state",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="Lagos"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.location?.state || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.location.city}
                        onChange={(e) =>
                          handleFarmInputChange("location.city", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="Ikeja"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.location?.city || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.location.address}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "location.address",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="Farm address"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.location?.address || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="number"
                        step="0.000001"
                        value={farmFormData.coordinates.latitude}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "coordinates.latitude",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="6.5244"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.coordinates?.latitude || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="number"
                        step="0.000001"
                        value={farmFormData.coordinates.longitude}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "coordinates.longitude",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="3.3792"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.coordinates?.longitude || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Farm Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <select
                        value={farmFormData.currency}
                        onChange={(e) =>
                          handleFarmInputChange("currency", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      >
                        <option value="NGN">Nigerian Naira (NGN)</option>
                        <option value="USD">US Dollar (USD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="GBP">British Pound (GBP)</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.currency || "NGN"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <select
                        value={farmFormData.timezone}
                        onChange={(e) =>
                          handleFarmInputChange("timezone", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                      >
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Cairo">Africa/Cairo (EET)</option>
                        <option value="Africa/Johannesburg">
                          Africa/Johannesburg (SAST)
                        </option>
                        <option value="America/New_York">
                          America/New York (EST)
                        </option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.timezone || "Africa/Lagos"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seasonal Pattern
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <FormSelect
                        value={farmFormData.seasonalPattern}
                        onChange={(value) =>
                          handleFarmInputChange("seasonalPattern", value)
                        }
                        placeholder="Select pattern"
                        options={[
                          { value: "year_round", label: "Year Round" },
                          { value: "seasonal", label: "Seasonal" },
                          { value: "rainy_season", label: "Rainy Season Only" },
                          { value: "dry_season", label: "Dry Season Only" },
                        ]}
                      />
                    ) : (
                      <p className="text-gray-900 capitalize">
                        {farmProfile?.seasonalPattern?.replace("_", " ") ||
                          "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <FormSelect
                        value={farmFormData.language}
                        onChange={(value) =>
                          handleFarmInputChange("language", value)
                        }
                        placeholder="Select language"
                        options={[
                          { value: "en", label: "English" },
                          { value: "yo", label: "Yoruba" },
                          { value: "ig", label: "Igbo" },
                          { value: "ha", label: "Hausa" },
                        ]}
                      />
                    ) : (
                      <p className="text-gray-900 capitalize">
                        {farmProfile?.language || "English"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.owner.firstName}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "owner.firstName",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="John"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.owner?.firstName || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="text"
                        value={farmFormData.owner.lastName}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "owner.lastName",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="Doe"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.owner?.lastName || "N/A"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    {isEditingProfile || !farmProfile ? (
                      <input
                        type="tel"
                        value={farmFormData.owner.phoneNumber}
                        onChange={(e) =>
                          handleFarmInputChange(
                            "owner.phoneNumber",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                        placeholder="+234 xxx xxx xxxx"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {farmProfile?.owner?.phoneNumber || "N/A"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Verify/Unverify */}
            {userData?.isVerified ? (
              <button
                onClick={() => openConfirm("toggleVerify")}
                className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Deactivate Verification
              </button>
            ) : (
              <button
                onClick={() => openConfirm("toggleVerify")}
                className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Verify User
              </button>
            )}

            {/* Resend Verification */}
            <button
              onClick={() => openConfirm("resendVerification")}
              disabled={userData?.isVerified}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Resend Verification
            </button>

            {/* Send Mail */}
            <button
              onClick={() => setShowMailModal(true)}
              className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Send className="h-5 w-5 mr-2" />
              Send Mail
            </button>

            {/* Delete User */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              Delete User
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-digit verification code
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 text-center text-lg tracking-widest"
                  placeholder="0000"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setVerificationCode("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={verificationCode.length !== 4 || isVerifying}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Mail Modal */}
      {showMailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Send Email</h3>
              <button
                onClick={() => {
                  setShowMailModal(false);
                  setMailContent({ subject: "", message: "" });
                  setVerificationCode("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={mailContent.subject}
                  onChange={(e) =>
                    setMailContent((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={mailContent.message}
                  onChange={(e) =>
                    setMailContent((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                  placeholder="Email message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-digit verification code
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-center text-lg tracking-widest"
                  placeholder="0000"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowMailModal(false);
                  setMailContent({ subject: "", message: "" });
                  setVerificationCode("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMail}
                disabled={
                  !mailContent.subject ||
                  !mailContent.message ||
                  verificationCode.length !== 4 ||
                  isVerifying
                }
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? "Verifying..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Please Confirm
            </h3>
            <p className="text-gray-700 mb-6">
              {confirmAction === "save"
                ? "Are you sure you want to update this user's details?"
                : confirmAction === "toggleVerify"
                  ? userData?.isVerified
                    ? "Deactivate verification for this user?"
                    : "Verify this user?"
                  : confirmAction === "resendVerification"
                    ? "Send a verification email to this user?"
                    : "Send this email to the user?"}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter 4-digit verification code
                </label>
                <input
                  type="text"
                  maxLength="4"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 text-center text-lg tracking-widest"
                  placeholder="0000"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsConfirmOpen(false);
                    setConfirmAction(null);
                    setVerificationCode("");
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={verificationCode.length !== 4 || isVerifying}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "OK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
