"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  CheckCircle2,
  Camera,
  MapPin,
} from "lucide-react";
import { changePassword } from "@/lib/api/auth";
import ViewCodeModal from "@/components/ViewCodeModal";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [showCodeModal, setShowCodeModal] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // const fetchMyProfile = useCallback(async () => {
  //   try {
  //     await checkUser();
  //   } catch (error) {
  //     console.error("Error fetching myProfile:", error);
  //     setError("Failed to load myProfile");
  //   }
  // }, [checkUser]);

  // useEffect(() => {
  //   fetchMyProfile();
  // }, [fetchMyProfile]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMessage("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New passwords do not match!");
      setIsSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long!");
      setIsSaving(false);
      return;
    }

    try {

      await changePassword({ oldPassword: passwordData.currentPassword, newPassword: passwordData.newPassword, confirmPassword: passwordData.confirmPassword });

      setSuccessMessage("Password changed successfully!");
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

    } catch (err) {
      setError("Failed to change password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin h-8 w-8 text-green-600" />
      </div>
    );
  }

  const userLocation = user?.location
    ? `${user.location.address}, ${user.location.city}, ${user.location.state}, ${user.location.country}`
    : "N/A";

  const userActions = user?.action
    ? Object.entries(user.action).filter(([, value]) => value)
    : [];

  const actionColors = {
    create: "bg-blue-100 text-blue-800",
    read: "bg-green-100 text-green-800",
    update: "bg-yellow-100 text-yellow-800",
    delete: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 flex flex-col md:flex-row items-center md:items-start gap-8 w-full mb-8">
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-green-300 to-green-500 flex items-center justify-center shadow-md">
              <span className="text-3xl font-bold text-white">
                {user?.firstName?.[0] || "A"}
                {user?.lastName?.[0] || "D"}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-green-700 transition-colors">
              <Camera size={16} />
            </button>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 text-base mt-1">{user?.email}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  user?.status === "active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <Shield size={14} className="mr-1.5" />
                {user?.status === "active" ? "Active" : "Inactive"}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <User size={14} className="mr-1.5" />
                {user?.role}
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto mt-4 md:mt-0">
            <h3 className="text-sm font-medium text-gray-500 mb-2 text-center md:text-left">
              Permissions
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {userActions.length > 0 ? (
                userActions.map(([action]) => (
                  <span
                    key={action}
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${actionColors[action.toLowerCase()]}`}
                  >
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No special permissions.</p>
              )}
            </div>
            {/* Show Code Button */}
            <div className="mt-4 flex justify-center md:justify-start">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors"
                onClick={() => setShowCodeModal(true)}
              >
                Show Code
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Personal Information
              </h2>
              <p className="text-gray-600 text-sm">
                Your personal and professional details.
              </p>
            </div>
            <div className="space-y-3">
              <NameInfoRow
                firstName={user?.firstName}
                lastName={user?.lastName}
              />
              <InfoRow label="Email Address" value={user?.email} />
              <InfoRow
                label="Phone Number"
                value={user?.phone || "Not provided"}
              />
              <InfoRow
                label="Department"
                value={user?.office || "Not specified"}
              />
              <InfoRow
                label="Location"
                value={userLocation}
                icon={<MapPin size={18} />}
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Change Password
              </h2>
              <p className="text-gray-600 text-sm">
                Update your password to keep your account secure.
              </p>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <PasswordInputField
                label="Current Password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                showPassword={showPasswords.current}
                toggleShowPassword={() => togglePasswordVisibility("current")}
              />
              <PasswordInputField
                label="New Password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                showPassword={showPasswords.new}
                toggleShowPassword={() => togglePasswordVisibility("new")}
                helpText="Must be at least 8 characters"
              />
              <PasswordInputField
                label="Confirm New Password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                showPassword={showPasswords.confirm}
                toggleShowPassword={() => togglePasswordVisibility("confirm")}
              />
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5 mr-2" />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Show Code Modal */}
      <ViewCodeModal
        open={showCodeModal}
        code={user?.code || "No code available"}
        onClose={() => setShowCodeModal(false)}
        onCopy={() => {
          if (user?.code) navigator.clipboard.writeText(user.code);
        }}
      />
    </div>
  );
}

const InfoRow = ({ label, value, icon }) => (
  <div className="border-b border-gray-200 pb-2 flex items-center gap-2">
    {icon && <span className="text-gray-500">{icon}</span>}
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  </div>
);

const NameInfoRow = ({ firstName, lastName }) => (
  <div className="border-b border-gray-200 pb-2 flex items-center gap-4">
    <div className="flex-1">
      <p className="text-sm text-gray-500">First Name</p>
      <p className="text-gray-900 font-medium">{firstName || "N/A"}</p>
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-500">Last Name</p>
      <p className="text-gray-900 font-medium">{lastName || "N/A"}</p>
    </div>
  </div>
);

const PasswordInputField = ({
  label,
  id,
  value,
  onChange,
  showPassword,
  toggleShowPassword,
  helpText,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500 text-gray-900 pr-10"
      />
      <button
        type="button"
        onClick={toggleShowPassword}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {showPassword ? (
          <EyeOff className="h-5 w-5" />
        ) : (
          <Eye className="h-5 w-5" />
        )}
      </button>
    </div>
    {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
  </div>
);
