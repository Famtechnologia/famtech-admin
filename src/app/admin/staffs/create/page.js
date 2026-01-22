"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertTriangle, Save, RefreshCw, Eye, EyeOff } from "lucide-react";
import { createAdmin } from "@/lib/api/auth";
import FormSelect from "@/components/FormSelect";

export default function CreateAdminPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    office: "",
    location: {
      country: "",
      state: "",
      city: "",
      address: "",
    },
    action: {
      create: false,
      read: true,
      update: false,
      delete: false,
    },
    role: "admin",
  });

  const handleChange = (path, value) => {
    if (path.includes(".")) {
      const [parent, child] = path.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [path]: value }));
    }
  };

  const handlePermissionToggle = (perm) => {
    setFormData((prev) => ({
      ...prev,
      action: {
        ...prev.action,
        [perm]: !prev.action[perm],
      },
    }));
  };

  const validate = () => {
    const required = [
      { key: "firstName", label: "First Name" },
      { key: "lastName", label: "Last Name" },
      { key: "email", label: "Email" },
      { key: "office", label: "Office" },
      { key: "password", label: "Password" },
    ];

    const missing = required.filter((r) => !String(formData[r.key]).trim());
    if (missing.length) {
      return `${missing.map((m) => m.label).join(", ")} required`;
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSaving(true);
      const res = await createAdmin(formData);
      if (res && res.id) {
        setSuccessMessage("Admin created successfully");
        // Redirect after short delay to the admins list
        setTimeout(() => router.push("/admin/staffs"), 1200);
      } else {
        setSuccessMessage("Admin created");
        setTimeout(() => router.push("/admin/staffs"), 1200);
      }
    } catch (err) {
      setError(err?.message || "Failed to create admin");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="w-full mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create Admin</h1>
          <p className="text-gray-600 mt-1">Add a new admin account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <FormSelect
                  label="Office *"
                  value={formData.office}
                  onChange={(value) => handleChange("office", value)}
                  placeholder="Select office"
                  options={[
                    { label: "Customer Service", value: "customer" },
                    { label: "Operations", value: "operations" },
                    { label: "Finance", value: "finance" },
                    { label: "Human Resources", value: "hr" },
                    { label: "IT Support", value: "it" },
                    { label: "Logistics", value: "logistics" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="+234 803 123 4567"
                />
              </div>
              <div>
                <FormSelect
                  label="Role *"
                  value={formData.role}
                  onChange={(value) => handleChange("role", value)}
                  placeholder="Select role"
                  options={[
                    { label: "Administrator", value: "admin" },
                    { label: "Super Administrator", value: "superadmin" },
                  ]}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                    placeholder="StrongPass!234"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Location
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) =>
                    handleChange("location.country", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Nigeria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) =>
                    handleChange("location.state", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Lagos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) =>
                    handleChange("location.city", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="Ikeja"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) =>
                    handleChange("location.address", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400"
                  placeholder="123 Admin Way"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Permissions
            </h2>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "create", label: "Create" },
                { key: "read", label: "Read" },
                { key: "update", label: "Update" },
                { key: "delete", label: "Delete" },
              ].map((perm) => (
                <label
                  key={perm.key}
                  className="inline-flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={formData.action[perm.key]}
                    onChange={() => handlePermissionToggle(perm.key)}
                    className="h-4 w-4 text-green-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{perm.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Default grants Read access.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Creating..." : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
