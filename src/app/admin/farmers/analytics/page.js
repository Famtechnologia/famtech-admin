"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Users,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { getUsers } from "@/lib/api/user";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FarmAnalytics() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalFarmers: 0,
    verified: 0,
    unverified: 0,
    withFarmProfile: 0,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      const res = await getUsers(10000, 1); // Fetch all users for analytics

      if (res.ok) {
        const farmers = res?.data?.farmers || [];
        setUsers(farmers);

        // Calculate statistics
        const totalFarmers = farmers.length;
        const verified = farmers.filter(
          (user) => user.isVerified === true,
        ).length;
        const unverified = farmers.filter(
          (user) => user.isVerified === false,
        ).length;
        const withFarmProfile = farmers.filter(
          (user) => user.farmProfile && user.farmProfile !== "",
        ).length;

        setStats({
          totalFarmers,
          verified,
          unverified,
          withFarmProfile,
        });
      } else {
        setUsers([]);
      }
    } catch (error) {
      setError("Failed to fetch analytics data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const verifiedWithProfile = users.filter(
    (u) => u.isVerified === true && u.farmProfile && u.farmProfile !== "",
  ).length;

  const verifiedChartRef = useRef(null);
  const profileCoverageChartRef = useRef(null);
  const profileGapChartRef = useRef(null);

  const createOptions = (title) => ({
    plugins: {
      legend: {
        position: "bottom",
        labels: { boxWidth: 12, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw ?? 0;
            const total = context.dataset.data.reduce(
              (sum, val) => sum + (typeof val === "number" ? val : 0),
              0,
            );
            const percent =
              total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
            return `${context.label}: ${value} (${percent}%)`;
          },
        },
      },
      title: title
        ? {
            display: true,
            text: title,
            position: "top",
            color: "#111827",
            font: { weight: "bold", size: 16 },
          }
        : undefined,
    },
    cutout: "65%",
  });

  const verifiedVsUnverifiedData = {
    labels: ["Verified", "Unverified"],
    datasets: [
      {
        data: [stats.verified, stats.unverified],
        backgroundColor: ["#2563eb", "#f97316"],
        borderWidth: 0,
      },
    ],
  };

  const totalVsProfileData = {
    labels: ["With Farm Profile", "Without Farm Profile"],
    datasets: [
      {
        data: [
          stats.withFarmProfile,
          Math.max(stats.totalFarmers - stats.withFarmProfile, 0),
        ],
        backgroundColor: ["#16a34a", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const verifiedVsProfileData = {
    labels: ["Verified + Profile", "Verified - Profile"],
    datasets: [
      {
        data: [
          verifiedWithProfile,
          Math.max(stats.verified - verifiedWithProfile, 0),
        ],
        backgroundColor: ["#16a34a", "#2563eb"],
        borderWidth: 0,
      },
    ],
  };

  const withoutFarmProfile = Math.max(
    stats.totalFarmers - stats.withFarmProfile,
    0,
  );

  const totalVsNoProfileData = {
    labels: ["With Profile", "Without Profile"],
    datasets: [
      {
        data: [stats.withFarmProfile, withoutFarmProfile],
        backgroundColor: ["#16a34a", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const cardColors = {
    green: {
      border: "border-green-200",
      iconBg: "bg-green-100 text-green-700",
    },
    blue: { border: "border-blue-200", iconBg: "bg-blue-100 text-blue-700" },
    orange: {
      border: "border-orange-200",
      iconBg: "bg-orange-100 text-orange-700",
    },
    purple: {
      border: "border-purple-200",
      iconBg: "bg-purple-100 text-purple-700",
    },
  };

  const percentOfTotal = (value) =>
    stats.totalFarmers > 0
      ? `${((value / stats.totalFarmers) * 100).toFixed(1)}%`
      : "0%";

  const statCards = [
    {
      title: "Total Farmers",
      value: stats.totalFarmers,
      icon: <Users className="h-8 w-8" />,
      color: "green",
      subtitle: null,
    },
    {
      title: "Verified Farmers",
      value: stats.verified,
      icon: <CheckCircle className="h-8 w-8" />,
      color: "blue",
      subtitle: percentOfTotal(stats.verified),
    },
    {
      title: "Unverified Farmers",
      value: stats.unverified,
      icon: <XCircle className="h-8 w-8" />,
      color: "orange",
      subtitle: percentOfTotal(stats.unverified),
    },
    {
      title: "Farm Profiles",
      value: stats.withFarmProfile,
      icon: <FileText className="h-8 w-8" />,
      color: "purple",
      subtitle: percentOfTotal(stats.withFarmProfile),
    },
  ];

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    const marginLeft = 14;
    const lineHeight = 8;

    const getChartImage = (chartRef) => {
      try {
        return chartRef?.current?.toBase64Image?.();
      } catch (e) {
        return null;
      }
    };

    doc.setFontSize(16);
    doc.text("Farm Analytics Report", marginLeft, 18);

    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, marginLeft, 26);

    // Summary table
    const summaryRows = [
      ["Total Farmers", stats.totalFarmers],
      [
        "Verified Farmers",
        `${stats.verified} (${percentOfTotal(stats.verified)})`,
      ],
      [
        "Unverified Farmers",
        `${stats.unverified} (${percentOfTotal(stats.unverified)})`,
      ],
      [
        "Farm Profiles",
        `${stats.withFarmProfile} (${percentOfTotal(stats.withFarmProfile)})`,
      ],
      [
        "Verified Without Farm Profile",
        `${withoutFarmProfile} (${percentOfTotal(withoutFarmProfile)})`,
      ],
      [
        "Verified + Profile",
        `${verifiedWithProfile} (${
          stats.verified > 0
            ? ((verifiedWithProfile / stats.verified) * 100).toFixed(1)
            : "0.0"
        }%)`,
      ],
    ];

    autoTable(doc, {
      startY: 34,
      head: [["Metric", "Value"]],
      body: summaryRows,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    // Breakdown table
    const breakdownStartY = doc.lastAutoTable.finalY + lineHeight;
    autoTable(doc, {
      startY: breakdownStartY,
      head: [["Category", "Count", "% of Total"]],
      body: [
        ["Verified", stats.verified, percentOfTotal(stats.verified)],
        ["Unverified", stats.unverified, percentOfTotal(stats.unverified)],
        [
          "With Farm Profile",
          stats.withFarmProfile,
          percentOfTotal(stats.withFarmProfile),
        ],
        [
          "Without Farm Profile",
          withoutFarmProfile,
          percentOfTotal(withoutFarmProfile),
        ],
        [
          "Verified + Profile",
          verifiedWithProfile,
          stats.totalFarmers > 0
            ? `${((verifiedWithProfile / stats.totalFarmers) * 100).toFixed(1)}%`
            : "0%",
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Progress overview table
    const progressStartY = doc.lastAutoTable.finalY + lineHeight;
    const progressRows = [
      ["Verified", stats.verified, percentOfTotal(stats.verified)],
      ["Unverified", stats.unverified, percentOfTotal(stats.unverified)],
      [
        "With Profile",
        stats.withFarmProfile,
        percentOfTotal(stats.withFarmProfile),
      ],
      [
        "Without Profile",
        withoutFarmProfile,
        percentOfTotal(withoutFarmProfile),
      ],
    ];

    autoTable(doc, {
      startY: progressStartY,
      head: [["Progress Segment", "Count", "% of Total"]],
      body: progressRows,
      theme: "striped",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 163, 74] },
    });

    // Charts page
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Charts", marginLeft, 18);

    const chartImages = [
      { title: "Verified vs Unverified", img: getChartImage(verifiedChartRef) },
      {
        title: "Farm Profile Coverage",
        img: getChartImage(profileCoverageChartRef),
      },
      { title: "Profile Gap", img: getChartImage(profileGapChartRef) },
    ];

    let yPos = 32;
    const imgWidth = 80;
    const imgHeight = 80;
    const gapX = 20;
    const startX = marginLeft;

    chartImages.forEach((chart, idx) => {
      if (!chart.img) return;
      if (idx % 2 === 0 && idx !== 0) {
        yPos += imgHeight + 22;
      }
      const xPos = idx % 2 === 0 ? startX : startX + imgWidth + gapX;
      doc.setFontSize(11);
      doc.text(chart.title, xPos, yPos - 4);
      doc.addImage(chart.img, "PNG", xPos, yPos, imgWidth, imgHeight);
    });

    doc.save("farm-analytics-report.pdf");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="animate-spin h-12 w-12 text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Farm Analytics
            </h1>
            <p className="text-gray-600">
              Overview of farmer statistics and verification status
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => fetchUsers()}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-gray-800 text-sm font-semibold rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Syncing..." : "Refresh / Sync"}
            </button>

            <button
              type="button"
              onClick={handleGenerateReport}
              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const colors = cardColors[card.color];

            return (
              <div
                key={card.title}
                className={`bg-white rounded-lg border p-6 shadow-sm ${colors.border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-md ${colors.iconBg}`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Verified vs Unverified */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Verified vs Unverified
                </h2>
                <p className="text-sm text-gray-500">
                  Verification distribution
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Doughnut
              ref={verifiedChartRef}
              data={verifiedVsUnverifiedData}
              options={createOptions()}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#2563eb]" />
                <span>Verified: {stats.verified}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#f97316]" />
                <span>Unverified: {stats.unverified}</span>
              </div>
            </div>
          </div>

          {/* Total vs Farm Profile */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Farm Profile Coverage
                </h2>
                <p className="text-sm text-gray-500">
                  Profiles vs total farmers
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Doughnut
              ref={profileCoverageChartRef}
              data={totalVsProfileData}
              options={createOptions()}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#16a34a]" />
                <span>With Profile: {stats.withFarmProfile}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#ef4444]" />
                <span>Without: {withoutFarmProfile}</span>
              </div>
            </div>
          </div>

          {/* Profile Gap (Total vs Without Profile) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Profile Gap</h2>
                <p className="text-sm text-gray-500">
                  Total farmers vs without profile
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Doughnut
              ref={profileGapChartRef}
              data={totalVsNoProfileData}
              options={createOptions()}
            />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#16a34a]" />
                <span>With Profile: {stats.withFarmProfile}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-block w-3 h-3 rounded-full bg-[#ef4444]" />
                <span>Without Profile: {withoutFarmProfile}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Progress Overview
              </h2>
              <p className="text-sm text-gray-500">
                Totals against key segments
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>

          <div className="space-y-4">
            {[
              {
                label: "Verified",
                value: stats.verified,
                color: "bg-[#2563eb]",
              },
              {
                label: "Unverified",
                value: stats.unverified,
                color: "bg-[#f97316]",
              },
              {
                label: "With Profile",
                value: stats.withFarmProfile,
                color: "bg-[#16a34a]",
              },
              {
                label: "Without Profile",
                value: withoutFarmProfile,
                color: "bg-[#ef4444]",
              },
            ].map((item) => {
              const percent =
                stats.totalFarmers > 0
                  ? Math.min((item.value / stats.totalFarmers) * 100, 100)
                  : 0;

              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-sm text-gray-700 mb-1">
                    <span>{item.label}</span>
                    <span className="font-semibold">
                      {item.value} ({percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
