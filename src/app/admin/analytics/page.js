// "use client";

// import { useState, useEffect } from "react";
// import { analyticsAPI } from "../../lib/api";

// const AnalyticsDashboard = () => {
//   const [analyticsData, setAnalyticsData] = useState(null);
//   const [detailedData, setDetailedData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedPeriod, setSelectedPeriod] = useState("30d");
//   const [selectedType, setSelectedType] = useState("overview");

//   useEffect(() => {
//     fetchAnalyticsData();
//   }, []);

//   useEffect(() => {
//     if (selectedPeriod || selectedType) {
//       fetchDetailedData();
//     }
//   }, [selectedPeriod, selectedType]);

//   const fetchAnalyticsData = async () => {
//     try {
//       setLoading(true);
//       const response = await analyticsAPI.getAnalytics();
//       if (response.data.success) {
//         setAnalyticsData(response.data.data);
//       }
//     } catch (err) {
//       setError(err.response?.data?.message || "Error fetching analytics");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchDetailedData = async () => {
//     try {
//       const response = await analyticsAPI.getDetailedAnalytics(
//         selectedPeriod,
//         selectedType
//       );
//       if (response.data.success) {
//         setDetailedData(response.data.data);
//       }
//     } catch (err) {
//       console.error("Error fetching detailed analytics:", err);
//     }
//   };

//   const StatCard = ({ title, value, subtitle, trend, trendUp = true }) => (
//     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
//           <p className="text-2xl font-bold text-gray-900">{value}</p>
//           {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
//         </div>
//         {trend && (
//           <div
//             className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
//               trendUp
//                 ? "bg-green-100 text-green-800"
//                 : "bg-red-100 text-red-800"
//             }`}
//           >
//             <span className={`mr-1 ${trendUp ? "↗" : "↘"}`}>{trend}</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   const RoleDistributionChart = ({ data }) => {
//     if (!data || data.length === 0) return null;

//     const total = data.reduce((sum, item) => sum + item.count, 0);

//     return (
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">
//           User Role Distribution
//         </h3>
//         <div className="space-y-3">
//           {data.map((item, index) => (
//             <div key={index} className="flex items-center justify-between">
//               <div className="flex items-center">
//                 <div
//                   className="w-4 h-4 rounded-full mr-3"
//                   style={{
//                     backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
//                   }}
//                 />
//                 <span className="text-sm font-medium text-gray-700 capitalize">
//                   {item.role || "Unspecified"}
//                 </span>
//               </div>
//               <div className="text-right">
//                 <span className="text-sm font-semibold text-gray-900">
//                   {item.count}
//                 </span>
//                 <span className="text-xs text-gray-500 ml-2">
//                   ({((item.count / total) * 100).toFixed(1)}%)
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   const ActivityChart = ({ data, title = "Recent Activity" }) => {
//     if (!data || data.length === 0) return null;

//     const maxCount = Math.max(...data.map((item) => item.count));

//     return (
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
//         <div className="space-y-2">
//           {data.map((item, index) => (
//             <div key={index} className="flex items-center">
//               <div className="w-16 text-xs text-gray-500 mr-3">{item._id}</div>
//               <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
//                 <div
//                   className="bg-famtech-green h-2 rounded-full transition-all duration-300"
//                   style={{ width: `${(item.count / maxCount) * 100}%` }}
//                 />
//               </div>
//               <div className="w-8 text-xs font-medium text-gray-700">
//                 {item.count}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="flex items-center justify-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-famtech-green"></div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="max-w-7xl mx-auto">
//           <div className="bg-red-50 border border-red-200 rounded-lg p-6">
//             <p className="text-red-800">Error: {error}</p>
//             <button
//               onClick={fetchAnalyticsData}
//               className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
//             >
//               Retry
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">
//                 Analytics Dashboard
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 Comprehensive insights into user activity and system performance
//               </p>
//             </div>
//             <div className="flex space-x-3">
//               <select
//                 value={selectedPeriod}
//                 onChange={(e) => setSelectedPeriod(e.target.value)}
//                 className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-famtech-green focus:border-transparent"
//               >
//                 <option value="7d">Last 7 Days</option>
//                 <option value="30d">Last 30 Days</option>
//                 <option value="90d">Last 90 Days</option>
//                 <option value="1y">Last Year</option>
//               </select>
//               <select
//                 value={selectedType}
//                 onChange={(e) => setSelectedType(e.target.value)}
//                 className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-famtech-green focus:border-transparent"
//               >
//                 <option value="overview">Overview</option>
//                 <option value="users">Users</option>
//                 <option value="geography">Geography</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Overview Statistics */}
//         {analyticsData?.overview && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
//             <StatCard
//               title="Total Users"
//               value={analyticsData.overview.totalUsers.toLocaleString()}
//               subtitle="All registered users"
//             />
//             <StatCard
//               title="Active Users"
//               value={analyticsData.overview.activeUsers.toLocaleString()}
//               subtitle="Approved & active"
//               trend="+12%"
//               trendUp={true}
//             />
//             <StatCard
//               title="Pending Approval"
//               value={analyticsData.overview.pendingUsers.toLocaleString()}
//               subtitle="Awaiting review"
//               trend="-5%"
//               trendUp={false}
//             />
//             <StatCard
//               title="Suspended"
//               value={analyticsData.overview.suspendedUsers.toLocaleString()}
//               subtitle="Temporarily blocked"
//             />
//             <StatCard
//               title="Rejected"
//               value={analyticsData.overview.rejectedUsers.toLocaleString()}
//               subtitle="Declined applications"
//             />
//           </div>
//         )}

//         {/* Charts Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           {analyticsData?.usersByRole && (
//             <RoleDistributionChart data={analyticsData.usersByRole} />
//           )}

//           {analyticsData?.recentActivity && (
//             <ActivityChart
//               data={analyticsData.recentActivity}
//               title="Daily Registrations (Last 7 Days)"
//             />
//           )}
//         </div>

//         {/* Monthly Trends */}
//         {analyticsData?.monthlyRegistrations &&
//           analyticsData.monthlyRegistrations.length > 0 && (
//             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">
//                 Monthly Registration Trends
//               </h3>
//               <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
//                 {analyticsData.monthlyRegistrations.map((item, index) => (
//                   <div
//                     key={index}
//                     className="text-center p-4 bg-gray-50 rounded-lg"
//                   >
//                     <div className="text-xs text-gray-500 mb-1">
//                       {item._id.month}/{item._id.year}
//                     </div>
//                     <div className="text-xl font-bold text-famtech-green">
//                       {item.count}
//                     </div>
//                     <div className="text-xs text-gray-400">registrations</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//         {/* Detailed Analytics Section */}
//         {detailedData?.userGrowth && (
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               User Growth Trends ({selectedPeriod})
//             </h3>
//             <div className="space-y-3">
//               {detailedData.userGrowth.map((item, index) => (
//                 <div
//                   key={index}
//                   className="grid grid-cols-4 gap-4 py-2 border-b border-gray-100"
//                 >
//                   <div className="text-sm font-medium text-gray-700">
//                     {item._id}
//                   </div>
//                   <div className="text-sm text-gray-600">New: {item.new}</div>
//                   <div className="text-sm text-green-600">
//                     Approved: {item.approved}
//                   </div>
//                   <div className="text-sm text-yellow-600">
//                     Pending: {item.pending}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Location Data */}
//         {detailedData?.locationData && detailedData.locationData.length > 0 && (
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-900 mb-4">
//               Top Locations
//             </h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {detailedData.locationData.map((item, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//                 >
//                   <span className="font-medium text-gray-700">
//                     {item._id || "Unknown Location"}
//                   </span>
//                   <span className="text-famtech-green font-semibold">
//                     {item.count} users
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Quick Actions */}
//         <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">
//             Quick Actions
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <button
//               onClick={() => (window.location.href = "/admin/users")}
//               className="bg-famtech-green text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
//             >
//               Manage Users
//             </button>
//             <button
//               onClick={() =>
//                 (window.location.href = "/admin/users?filter=pending")
//               }
//               className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
//             >
//               Review Pending
//             </button>
//             <button
//               onClick={fetchAnalyticsData}
//               className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
//             >
//               Refresh Data
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AnalyticsDashboard;
