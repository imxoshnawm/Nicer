"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
    _id: string;
    title: string;
    content: string;
    category: string;
    author: string;
    imageUrl: string;
    approvalStatus: string;
    approvals: { userId: string; userName: string; date: string }[];
    requiredApprovals: number;
    rejectionReason: string;
    createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; description: string }> = {
    draft: { label: 'Draft', icon: '📋', color: 'text-slate-400', bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30', description: 'Not yet submitted for review' },
    pending: { label: 'Pending Review', icon: '⏳', color: 'text-amber-400', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', description: 'Waiting for admin approval' },
    approved: { label: 'Approved', icon: '✅', color: 'text-green-400', bg: 'bg-green-500/15 text-green-400 border-green-500/30', description: 'Approved and ready to publish' },
    rejected: { label: 'Rejected', icon: '❌', color: 'text-red-400', bg: 'bg-red-500/15 text-red-400 border-red-500/30', description: 'Needs revisions before resubmitting' },
};

export default function AdminApprovalsPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || "";
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("pending");
    const [rejectId, setRejectId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [previewPost, setPreviewPost] = useState<Post | null>(null);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (role && role !== "admin") router.push("/admin");
    }, [role, router]);

    useEffect(() => { fetchPosts(); }, []);

    const fetchPosts = async () => {
        try {
            const res = await secureFetch("/api/posts");
            if (res.ok) setPosts(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };

    const submitForApproval = async (id: string) => {
        try {
            const res = await secureFetch(`/api/posts/${id}/approve`, { method: "POST" });
            if (res.ok) { showMsg('success', 'Submitted for review'); fetchPosts(); }
            else showMsg('error', 'Failed to submit');
        } catch { showMsg('error', 'Network error'); }
    };

    const approve = async (id: string) => {
        try {
            const res = await secureFetch(`/api/posts/${id}/approve`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve" }),
            });
            if (res.ok) { showMsg('success', 'Post approved'); fetchPosts(); }
            else showMsg('error', 'Failed to approve');
        } catch { showMsg('error', 'Network error'); }
    };

    const reject = async (id: string) => {
        if (!rejectReason.trim()) { showMsg('error', 'Please provide a reason for rejection'); return; }
        try {
            const res = await secureFetch(`/api/posts/${id}/approve`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject", reason: rejectReason }),
            });
            if (res.ok) { showMsg('success', 'Post rejected'); setRejectId(null); setRejectReason(""); fetchPosts(); }
            else showMsg('error', 'Failed to reject');
        } catch { showMsg('error', 'Network error'); }
    };

    const filtered = posts.filter(p => filter === "all" ? true : p.approvalStatus === filter);

    const tabs = [
        { key: 'pending', label: 'Pending', icon: '⏳', count: posts.filter(p => p.approvalStatus === 'pending').length },
        { key: 'draft', label: 'Drafts', icon: '📋', count: posts.filter(p => p.approvalStatus === 'draft').length },
        { key: 'approved', label: 'Approved', icon: '✅', count: posts.filter(p => p.approvalStatus === 'approved').length },
        { key: 'rejected', label: 'Rejected', icon: '❌', count: posts.filter(p => p.approvalStatus === 'rejected').length },
        { key: 'all', label: 'All', icon: '📋', count: posts.length },
    ];

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">📋 Approvals</h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">Review and approve posts before they go live</p>
            </motion.div>

            {/* Workflow Explanation */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                <p className="text-slate-500 text-[11px] font-medium mb-2">WORKFLOW</p>
                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="px-2 py-1 rounded-lg bg-slate-500/10 text-slate-400">📋 Draft</span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400">⏳ Pending</span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400">✅ Approved</span>
                    <span className="text-slate-600">→</span>
                    <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400">🌐 Published</span>
                </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {msg && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {msg.type === 'success' ? '✅' : '❌'} {msg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                            filter === tab.key
                                ? "bg-[#007EA7]/20 text-[#00A8E8] border border-[#007EA7]/30"
                                : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white"
                        }`}>
                        {tab.icon} {tab.label}
                        {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === tab.key ? 'bg-[#007EA7]/30' : 'bg-white/[0.06]'}`}>{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Posts */}
            {filtered.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-10 text-center">
                    <span className="text-4xl block mb-3">{STATUS_CONFIG[filter]?.icon || '📋'}</span>
                    <p className="text-slate-500">{filter === 'pending' ? 'No posts waiting for review' : `No ${filter} posts`}</p>
                    <p className="text-slate-600 text-xs mt-1">{STATUS_CONFIG[filter]?.description || ''}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((post, i) => {
                        const sc = STATUS_CONFIG[post.approvalStatus] || STATUS_CONFIG.draft;
                        const approvalPct = post.requiredApprovals ? Math.min(100, ((post.approvals?.length || 0) / post.requiredApprovals) * 100) : 0;

                        return (
                            <motion.div key={post._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl p-4 md:p-5 hover:bg-white/[0.04] transition-all">

                                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                                    {/* Post Info */}
                                    <div className="flex-1 min-w-0">
                                        {/* Status + Category */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${sc.bg}`}>
                                                {sc.icon} {sc.label}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                                                {post.category}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-white font-semibold text-sm mb-1">{post.title}</h3>
                                        <p className="text-slate-500 text-xs">by {post.author} · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>

                                        {/* Content Preview */}
                                        {post.content && (
                                            <p className="text-slate-400 text-xs line-clamp-2 mt-2">{post.content}</p>
                                        )}

                                        {/* Approval Progress Bar */}
                                        {post.approvalStatus !== "draft" && (
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Approval Progress</span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">{post.approvals?.length || 0} / {post.requiredApprovals} approvals</span>
                                                </div>
                                                <div className="bg-white/[0.06] rounded-full h-2 overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${approvalPct}%` }}
                                                        className={`h-full rounded-full transition-all ${approvalPct >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-[#007EA7] to-[#00A8E8]'}`} />
                                                </div>
                                                {post.approvals?.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {post.approvals.map((a, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] border border-green-500/20">
                                                                ✅ {a.userName} · {new Date(a.date).toLocaleDateString()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Rejection Reason */}
                                        {post.approvalStatus === "rejected" && post.rejectionReason && (
                                            <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/15 rounded-xl">
                                                <p className="text-[10px] text-red-300 font-semibold uppercase mb-0.5">Rejection Reason</p>
                                                <p className="text-red-400 text-xs">{post.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Panel */}
                                    <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                                        {/* Preview */}
                                        <button onClick={() => setPreviewPost(post)}
                                            className="flex-1 lg:flex-initial px-3 py-2 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl text-xs font-medium transition-all text-center">
                                            👁️ Preview
                                        </button>

                                        {post.approvalStatus === "draft" && (
                                            <button onClick={() => submitForApproval(post._id)}
                                                className="flex-1 lg:flex-initial px-3 py-2 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 rounded-xl text-xs font-medium transition-all text-center">
                                                📤 Submit
                                            </button>
                                        )}

                                        {post.approvalStatus === "pending" && (
                                            <>
                                                <button onClick={() => approve(post._id)}
                                                    className="flex-1 lg:flex-initial px-3 py-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-xl text-xs font-medium transition-all text-center">
                                                    ✅ Approve
                                                </button>
                                                <button onClick={() => setRejectId(rejectId === post._id ? null : post._id)}
                                                    className="flex-1 lg:flex-initial px-3 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-xl text-xs font-medium transition-all text-center">
                                                    ❌ Reject
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Inline Reject Form */}
                                <AnimatePresence>
                                    {rejectId === post._id && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 p-4 bg-red-500/5 border border-red-500/15 rounded-xl overflow-hidden">
                                            <label className="block text-xs font-medium text-red-400 mb-1.5">Why are you rejecting this post?</label>
                                            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                                placeholder="Provide specific feedback so the author can improve..." rows={3}
                                                className="w-full px-4 py-3 bg-white/[0.04] border border-red-500/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm resize-none" />
                                            <div className="flex gap-2 mt-3">
                                                <button onClick={() => reject(post._id)} disabled={!rejectReason.trim()}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-40">
                                                    Confirm Rejection
                                                </button>
                                                <button onClick={() => { setRejectId(null); setRejectReason(""); }}
                                                    className="px-4 py-2 bg-white/[0.06] text-slate-300 rounded-xl text-xs hover:bg-white/[0.1] transition-colors">
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Preview Modal */}
            <AnimatePresence>
                {previewPost && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setPreviewPost(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#001a24] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            {/* Preview Header */}
                            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">👁️</span>
                                    <h2 className="text-white font-bold">Post Preview</h2>
                                </div>
                                <button onClick={() => setPreviewPost(null)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">✕</button>
                            </div>

                            {/* Image */}
                            {previewPost.imageUrl && (
                                <div className="h-48 bg-white/[0.02] overflow-hidden">
                                    <img src={previewPost.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="p-5 space-y-4">
                                {/* Meta */}
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${STATUS_CONFIG[previewPost.approvalStatus]?.bg}`}>
                                        {STATUS_CONFIG[previewPost.approvalStatus]?.icon} {STATUS_CONFIG[previewPost.approvalStatus]?.label}
                                    </span>
                                    <span className="text-slate-500 text-xs">{previewPost.category}</span>
                                    <span className="text-slate-600 text-xs">·</span>
                                    <span className="text-slate-500 text-xs">by {previewPost.author}</span>
                                </div>

                                {/* Title & Content */}
                                <h2 className="text-white font-bold text-xl">{previewPost.title}</h2>
                                <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {previewPost.content || <span className="text-slate-500 italic">No content</span>}
                                </div>

                                {/* Quick Actions */}
                                {previewPost.approvalStatus === "pending" && (
                                    <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
                                        <button onClick={() => { approve(previewPost._id); setPreviewPost(null); }}
                                            className="flex-1 py-2.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-xl text-sm font-medium transition-all">
                                            ✅ Approve
                                        </button>
                                        <button onClick={() => { setPreviewPost(null); setRejectId(previewPost._id); }}
                                            className="flex-1 py-2.5 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-xl text-sm font-medium transition-all">
                                            ❌ Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
