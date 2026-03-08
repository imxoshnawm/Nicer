"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface AuditEntry {
    _id: string;
    action: string;
    actor: { id: string; name: string; email: string };
    target?: { type: string; id?: string; name?: string };
    details?: Record<string, any>;
    ip?: string;
    severity: "info" | "warning" | "critical";
    timestamp: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const SEVERITY_STYLES: Record<string, string> = {
    info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
};

const ACTION_LABELS: Record<string, string> = {
    "auth.login_success": "🔓 Login",
    "auth.login_failed": "🔴 Failed Login",
    "auth.login_blocked": "⛔ Blocked Login",
    "auth.register": "📝 Registration",
    "user.update": "👤 User Updated",
    "user.delete": "🗑️ User Deleted",
    "user.block": "🚫 User Blocked",
    "user.unblock": "✅ User Unblocked",
    "user.role_change": "🔑 Role Changed",
    "post.create": "📄 Post Created",
    "post.update": "✏️ Post Updated",
    "post.delete": "🗑️ Post Deleted",
    "post.approve": "✅ Post Approved",
    "post.reject": "❌ Post Rejected",
    "post.submit_approval": "📨 Submit Approval",
    "activity.create": "📅 Activity Created",
    "activity.update": "✏️ Activity Updated",
    "activity.delete": "🗑️ Activity Deleted",
    "settings.update": "⚙️ Settings Updated",
    "security.csrf_violation": "🛡️ CSRF Violation",
    "security.rate_limit": "⚠️ Rate Limited",
};

export default function AuditLogPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [logs, setLogs] = useState<AuditEntry[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const roles: string[] = (session?.user as any)?.roles || [];
    const isAdmin = roles.includes("admin");

    useEffect(() => {
        if (!isAdmin) {
            router.push("/admin");
            return;
        }
        fetchLogs(1);
    }, []);

    const fetchLogs = async (page: number) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "50" });
            if (filter) params.set("action", filter);
            if (severityFilter) params.set("severity", severityFilter);

            const res = await secureFetch(`/api/audit?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs);
                setPagination(data.pagination);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchLogs(1);
    };

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        return d.toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl md:text-3xl font-black text-white">🔒 Audit Log</h1>
                <p className="text-slate-400 text-sm mt-1">Security events &amp; admin actions (auto-deleted after 90 days)</p>
            </motion.div>

            {/* Filters */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[160px]">
                    <label className="block text-xs text-slate-400 mb-1">Action Type</label>
                    <input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="e.g. auth, user, post..."
                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7]"
                    />
                </div>
                <div className="min-w-[140px]">
                    <label className="block text-xs text-slate-400 mb-1">Severity</label>
                    <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        title="Filter by severity"
                        className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#007EA7]"
                    >
                        <option value="">All</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <button onClick={handleFilter}
                    className="px-4 py-2 bg-[#007EA7] text-white rounded-xl text-sm font-medium hover:bg-[#005f7f] transition-all">
                    Filter
                </button>
            </motion.div>

            {/* Stats summary */}
            <div className="flex gap-3 text-sm">
                <span className="bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl text-slate-300">
                    Total: <span className="text-white font-bold">{pagination.total}</span>
                </span>
                <span className="bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 rounded-xl text-slate-300">
                    Page: <span className="text-white font-bold">{pagination.page}/{pagination.pages || 1}</span>
                </span>
            </div>

            {/* Log entries */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading audit logs...</div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 text-slate-400">No audit logs found</div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    className="space-y-2">
                    {logs.map((log) => (
                        <div key={log._id}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer"
                            onClick={() => setExpandedId(expandedId === log._id ? null : log._id)}
                        >
                            <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
                                {/* Severity badge */}
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[log.severity] || SEVERITY_STYLES.info}`}>
                                    {log.severity}
                                </span>

                                {/* Action */}
                                <span className="text-sm text-white font-medium min-w-[160px]">
                                    {ACTION_LABELS[log.action] || log.action}
                                </span>

                                {/* Actor */}
                                <span className="text-xs text-slate-400">
                                    by <span className="text-slate-300">{log.actor.name}</span>
                                    <span className="text-slate-500 ml-1">({log.actor.email})</span>
                                </span>

                                {/* Target */}
                                {log.target?.name && (
                                    <span className="text-xs text-slate-500">
                                        → {log.target.type}: <span className="text-slate-400">{log.target.name}</span>
                                    </span>
                                )}

                                {/* Time */}
                                <span className="text-xs text-slate-500 ml-auto whitespace-nowrap">
                                    {formatTime(log.timestamp)}
                                </span>
                            </div>

                            {/* Expanded details */}
                            {expandedId === log._id && (
                                <div className="px-4 pb-3 border-t border-white/[0.04] pt-3 text-xs space-y-1">
                                    <p className="text-slate-400">
                                        <span className="text-slate-500">Actor ID:</span> {log.actor.id}
                                    </p>
                                    {log.target?.id && (
                                        <p className="text-slate-400">
                                            <span className="text-slate-500">Target ID:</span> {log.target.id}
                                        </p>
                                    )}
                                    {log.ip && (
                                        <p className="text-slate-400">
                                            <span className="text-slate-500">IP:</span> {log.ip}
                                        </p>
                                    )}
                                    {log.details && Object.keys(log.details).length > 0 && (
                                        <div className="text-slate-400">
                                            <span className="text-slate-500">Details:</span>
                                            <pre className="mt-1 bg-black/30 p-2 rounded-lg overflow-x-auto text-[11px]">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => fetchLogs(pagination.page - 1)}
                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        ← Previous
                    </button>
                    <button
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => fetchLogs(pagination.page + 1)}
                        className="px-4 py-2 bg-white/[0.04] border border-white/[0.06] text-slate-300 rounded-xl text-sm hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
