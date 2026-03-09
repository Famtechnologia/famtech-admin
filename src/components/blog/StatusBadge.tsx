"use client";

type Status = "approved" | "pending" | "in-review";

interface StatusBadgeProps {
  status: Status;
}

const config: Record<Status, { label: string; className: string }> = {
  approved: {
    label: "Approved",
    className: "bg-green-50 text-green-600 border border-green-200",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-600 border border-amber-200",
  },
  "in-review": {
    label: "In Review",
    className: "bg-blue-50 text-blue-600 border border-blue-200",
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = config[status] ?? config.pending;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}