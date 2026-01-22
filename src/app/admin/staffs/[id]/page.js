"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader, Save, ShieldCheck, Trash2 } from "lucide-react";
import { ErrorModal, SuccessModal } from "@/components/StatusModal";
import FormSelect from "@/components/FormSelect";
import {
  getAdminById,
  updateAdmin,
  deleteAdmin,
  verifyCode,
  toggleVerifyAdmin,
} from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";

export default function ViewAdminPage() {
  const router = useRouter();
  const params = useParams();
  const adminId = useMemo(() => params?.id, [params]);
  const { user } = useAuth();
  const [active, setActive] = useState(false);

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
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    const fetchAdmin = async () => {
      if (!adminId) return;
      setLoading(true);
      setError("");
      try {
        const res = await getAdminById(adminId);
        const admin = res?.admin;
        setActive(admin?.isActive || false);
        setFormData({
          firstName: admin?.firstName || "",
          lastName: admin?.lastName || "",
          email: admin?.email || "",
          phone: admin?.phone || "",
          password: "",
          office: admin?.office || "",
          location: {
            country: admin?.location?.country || "",
            state: admin?.location?.state || "",
            city: admin?.location?.city || "",
            address: admin?.location?.address || "",
          },
          action: {
            create: Boolean(admin?.action?.create),
            read: Boolean(admin?.action?.read),
            update: Boolean(admin?.action?.update),
            delete: Boolean(admin?.action?.delete),
          },
          role: admin?.role || "",
        });
      } catch (err) {
        setError(err?.message || "Failed to load admin");
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [adminId]);

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
    ];

    const missing = required.filter((r) => !String(formData[r.key]).trim());
    if (missing.length) {
      return `${missing.map((m) => m.label).join(", ")} required`;
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setModalError("");
    setConfirmAction("edit");
    setIsConfirmOpen(true);
  };

  const handleVerify = () => {
    setModalError("");
    setConfirmAction("verify");
    setIsConfirmOpen(true);
  };

  const handleDelete = () => {
    setModalError("");
    setConfirmAction("delete");
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setModalError("");
    if (!adminId) return;
    try {
      if (verificationCode.length !== 4) {
        setModalError("Please enter a 4-digit code.");
        return;
      }
      if (confirmAction === "edit") {
        setSaving(true);
        const validationError = validate();
        if (validationError) {
          setModalError(validationError);
          setSaving(false);
          return;
        }
        await verifyCode(verificationCode, user.email);
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await updateAdmin(adminId, payload);
        setSuccess("Admin updated successfully");
      } else if (confirmAction === "verify") {
        setVerifying(true);
        await verifyCode(verificationCode, user.email);
        await toggleVerifyAdmin(adminId);
        setSuccess("Admin verified");
      } else if (confirmAction === "delete") {
        setDeleting(true);
        await verifyCode(verificationCode, user.email);
        await deleteAdmin(adminId);
        router.push("/admin/staffs");
      }
      setIsConfirmOpen(false);
      setConfirmAction(null);
      setVerificationCode("");
    } catch (err) {
      setModalError(err?.message || "Invalid code. Could not perform action.");
    } finally {
      setSaving(false);
      setVerifying(false);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader className="animate-spin text-green-600" size={32} />
          <p className="text-gray-700">Loading admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="w-full mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Details</h1>
            <p className="text-gray-600 mt-1">
              View and edit admin information
            </p>
          </div>
          <div className="flex gap-2">
            {/* Verify/Deactivate button: only if user has update permission */}
            {user?.action?.update &&
              (active ? (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || deleting}
                  className="inline-flex items-center px-3 py-2 bg-amber-600 text-black rounded-lg hover:bg-amber-700 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {verifying ? "Deactivating..." : "Deactivate"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || deleting}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  {verifying ? "Verifying..." : "Verify"}
                </button>
              ))}
            {/* Delete button: only if user has delete permission */}
            {user?.action?.delete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || verifying}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
          </div>
        </div>

        <ErrorModal
          open={!!error}
          message={error}
          onClose={() => setError("")}
        />
        <SuccessModal
          open={!!success}
          message={success}
          onClose={() => setSuccess("")}
        />

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow p-6 space-y-6"
        >
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password (leave blank to keep)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
                  placeholder="Update password"
                />
              </div>
            </div>
          </div>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-600"
                  placeholder="123 Admin Way"
                />
              </div>
            </div>
          </div>

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
                <div key={perm.key} className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handlePermissionToggle(perm.key)}
                    className={`relative w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none ${formData.action[perm.key] ? "bg-green-600" : "bg-gray-300"}`}
                    aria-pressed={formData.action[perm.key]}
                  >
                    <span
                      className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.action[perm.key] ? "translate-x-6" : ""}`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">{perm.label}</span>
                </div>
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
              disabled={saving}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {isConfirmOpen && (
              <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg max-w-md w-full mx-4 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {confirmAction === "edit"
                      ? "Confirm Update"
                      : confirmAction === "verify"
                        ? "Verify Admin"
                        : confirmAction === "delete"
                          ? "Delete Admin"
                          : "Please Confirm"}
                  </h3>
                  <p className="text-gray-700 mb-6">
                    {confirmAction === "edit"
                      ? "Are you sure you want to update this admin's details?"
                      : confirmAction === "verify"
                        ? "Enter your verification code to verify this admin."
                        : confirmAction === "delete"
                          ? "Are you sure you want to delete this admin? This action cannot be undone."
                          : "Enter your verification code to continue."}
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
                        disabled={saving || verifying || deleting}
                      />
                      {modalError && (
                        <div className="text-red-600 text-sm mt-1">
                          {modalError}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setIsConfirmOpen(false);
                          setConfirmAction(null);
                          setVerificationCode("");
                          setModalError("");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        disabled={saving || verifying || deleting}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={
                          verificationCode.length !== 4 ||
                          saving ||
                          verifying ||
                          deleting
                        }
                        className={`px-4 py-2 ${confirmAction === "delete" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {saving || verifying || deleting
                          ? confirmAction === "delete"
                            ? "Deleting..."
                            : confirmAction === "edit"
                              ? "Saving..."
                              : "Verifying..."
                          : confirmAction === "delete"
                            ? "Delete"
                            : confirmAction === "edit"
                              ? "Update"
                              : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
