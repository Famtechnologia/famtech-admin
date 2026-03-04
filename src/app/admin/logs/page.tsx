"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, Search } from "lucide-react";

type LogLevel = "info" | "warning" | "success";

type LogItem = {
	id: number;
	actor: string;
	action: string;
	target?: string;
	level: LogLevel;
	timestamp: string;
};

const logs: LogItem[] = [
	{
		id: 1,
		actor: "Admin - Deborah",
		action: "Approved farmer profile",
		target: "Green Harvest Cooperative",
		level: "success",
		timestamp: "2026-03-02T08:15:00.000Z",
	},
	{
		id: 2,
		actor: "System",
		action: "Failed login attempts detected",
		target: "3 attempts from same IP",
		level: "warning",
		timestamp: "2026-03-02T07:49:00.000Z",
	},
	{
		id: 3,
		actor: "Admin - Michael",
		action: "Updated subscription configuration",
		target: "Starter Plan",
		level: "info",
		timestamp: "2026-03-02T07:20:00.000Z",
	},
	{
		id: 4,
		actor: "Admin - Esther",
		action: "Resolved support session",
		target: "Ticket #SUP-0281",
		level: "success",
		timestamp: "2026-03-02T06:58:00.000Z",
	},
	{
		id: 5,
		actor: "System",
		action: "Farmer verification queue increased",
		target: "12 pending profiles",
		level: "warning",
		timestamp: "2026-03-02T06:15:00.000Z",
	},
	{
		id: 6,
		actor: "Admin - Sandra",
		action: "Published blog post",
		target: "Dry Season Soil Guide",
		level: "info",
		timestamp: "2026-03-01T22:30:00.000Z",
	},
];

const levelClassMap: Record<LogLevel, string> = {
	info: "bg-blue-100 text-blue-700",
	warning: "bg-yellow-100 text-yellow-700",
	success: "bg-green-100 text-green-700",
};

const formatDateTime = (value: string) => {
	const date = new Date(value);
	return date.toLocaleString("en-US", {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

export default function LogsPage() {
	const [search, setSearch] = useState("");

	const filteredLogs = useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) {
			return logs;
		}

		return logs.filter((log) => {
			return (
				log.actor.toLowerCase().includes(query) ||
				log.action.toLowerCase().includes(query) ||
				log.target?.toLowerCase().includes(query)
			);
		});
	}, [search]);

	const summary = useMemo(() => {
		return {
			total: logs.length,
			warning: logs.filter((log) => log.level === "warning").length,
			success: logs.filter((log) => log.level === "success").length,
			lastEvent: logs[0]?.timestamp || null,
		};
	}, []);

	return (
		<main className="w-full mx-auto p-6 min-h-screen bg-gray-50">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">System Logs</h1>
				<p className="text-gray-600">Track admin actions and important platform events.</p>
			</div>

			<section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
				<article className="bg-white border border-gray-200 rounded-lg p-5">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-gray-600">Total Events</span>
						<Activity className="w-5 h-5 text-green-600" />
					</div>
					<p className="text-2xl font-bold text-gray-900">{summary.total}</p>
				</article>

				<article className="bg-white border border-gray-200 rounded-lg p-5">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-gray-600">Warnings</span>
						<AlertTriangle className="w-5 h-5 text-yellow-600" />
					</div>
					<p className="text-2xl font-bold text-gray-900">{summary.warning}</p>
				</article>

				<article className="bg-white border border-gray-200 rounded-lg p-5">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-gray-600">Successful Actions</span>
						<CheckCircle2 className="w-5 h-5 text-green-600" />
					</div>
					<p className="text-2xl font-bold text-gray-900">{summary.success}</p>
				</article>

				<article className="bg-white border border-gray-200 rounded-lg p-5">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-gray-600">Latest Event</span>
						<Clock3 className="w-5 h-5 text-blue-600" />
					</div>
					<p className="text-sm font-semibold text-gray-900">
						{summary.lastEvent ? formatDateTime(summary.lastEvent) : "No events"}
					</p>
				</article>
			</section>

			<section className="bg-white border border-gray-200 rounded-lg">
				<div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
					<h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
					<div className="relative w-full md:w-80">
						<Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search logs"
							className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
						/>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-50 text-gray-600">
							<tr>
								<th className="text-left px-4 py-3 font-semibold">Actor</th>
								<th className="text-left px-4 py-3 font-semibold">Action</th>
								<th className="text-left px-4 py-3 font-semibold">Target</th>
								<th className="text-left px-4 py-3 font-semibold">Level</th>
								<th className="text-left px-4 py-3 font-semibold">Time</th>
							</tr>
						</thead>
						<tbody>
							{filteredLogs.length === 0 ? (
								<tr>
									<td colSpan={5} className="px-4 py-8 text-center text-gray-500">
										No logs found
									</td>
								</tr>
							) : (
								filteredLogs.map((log) => (
									<tr key={log.id} className="border-t border-gray-100">
										<td className="px-4 py-3 text-gray-900 font-medium">{log.actor}</td>
										<td className="px-4 py-3 text-gray-700">{log.action}</td>
										<td className="px-4 py-3 text-gray-700">{log.target || "-"}</td>
										<td className="px-4 py-3">
											<span className={`inline-flex px-2 py-1 rounded text-xs font-semibold capitalize ${levelClassMap[log.level]}`}>
												{log.level}
											</span>
										</td>
										<td className="px-4 py-3 text-gray-600">{formatDateTime(log.timestamp)}</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</main>
	);
}
