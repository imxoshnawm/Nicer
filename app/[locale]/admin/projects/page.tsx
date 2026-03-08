"use client";

import { useState, useEffect } from "react";
import secureFetch from "@/lib/secureFetch";
import { useAdmin } from "../layout";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface ProjectMember {
    user: { _id: string; name: string; memberId?: string; avatar?: string };
    role: string;
}

interface Project {
    _id: string;
    title: string;
    description: string;
    images: string[];
    members: ProjectMember[];
    link?: string;
    videoUrl?: string;
    createdBy: { _id: string; name: string };
    status: string;
    createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
    published: "bg-green-500/15 text-green-400 border-green-500/20",
    draft: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    rejected: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function AdminProjectsPage() {
    const { roles } = useAdmin();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("all");
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editStatus, setEditStatus] = useState("published");
    const [editLink, setEditLink] = useState("");
    const [editVideoUrl, setEditVideoUrl] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const isAdmin = roles.includes('admin');
    const canManage = isAdmin || roles.includes('president');

    useEffect(() => { fetchProjects(); }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // Admin fetch all projects including drafts
            const res = await secureFetch("/api/projects?all=true");
            if (res.ok) {
                const data = await res.json();
                setProjects(data.projects || []);
            }
        } catch { }
        setLoading(false);
    };

    const handleEdit = (project: Project) => {
        setEditProject(project);
        setEditTitle(project.title);
        setEditDesc(project.description);
        setEditStatus(project.status);
        setEditLink(project.link || "");
        setEditVideoUrl(project.videoUrl || "");
        setMessage({ text: "", type: "" });
    };

    const handleSave = async () => {
        if (!editProject) return;
        setSaving(true);
        try {
            const res = await secureFetch(`/api/projects/${editProject._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDesc,
                    status: editStatus,
                    link: editLink || undefined,
                    videoUrl: editVideoUrl || undefined,
                    members: editProject.members.map(m => ({ user: m.user._id, role: m.role })),
                }),
            });
            if (res.ok) {
                setMessage({ text: "Updated successfully!", type: "success" });
                fetchProjects();
                setTimeout(() => setEditProject(null), 800);
            } else {
                const data = await res.json();
                setMessage({ text: data.error || "Failed to update", type: "error" });
            }
        } catch {
            setMessage({ text: "Something went wrong", type: "error" });
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await secureFetch(`/api/projects/${id}`, { method: "DELETE" });
            if (res.ok) {
                setProjects(prev => prev.filter(p => p._id !== id));
                setDeleteConfirm(null);
            }
        } catch { }
    };

    const filteredProjects = filter === "all"
        ? projects
        : projects.filter(p => p.status === filter);

    if (!canManage) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>You do not have permission to manage projects.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between flex-wrap gap-4">
                <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-lg">🚀</span>
                    Projects Management
                </h1>
                <span className="text-slate-500 text-sm">{projects.length} total projects</span>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { key: "all", label: "All", count: projects.length },
                    { key: "published", label: "Published", count: projects.filter(p => p.status === "published").length },
                    { key: "draft", label: "Drafts", count: projects.filter(p => p.status === "draft").length },
                    { key: "rejected", label: "Rejected", count: projects.filter(p => p.status === "rejected").length },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                            filter === tab.key
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white'
                        }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                    <span className="text-4xl block mb-3">📂</span>
                    <p className="text-slate-400 text-sm">No projects in this category</p>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="space-y-4">
                    {filteredProjects.map(project => (
                        <motion.div key={project._id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.1] transition-all">
                            <div className="flex items-start gap-4">
                                {/* Thumbnail */}
                                {project.images.length > 0 && (
                                    <img src={project.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 hidden sm:block" />
                                )}

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-white font-bold text-lg">{project.title}</h3>
                                            <p className="text-slate-500 text-xs mt-0.5">
                                                By {project.createdBy.name} · {new Date(project.createdAt).toLocaleDateString()} · {project.members.length} members
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${STATUS_STYLES[project.status] || STATUS_STYLES.draft}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-400 text-sm mt-2 line-clamp-2">{project.description}</p>

                                    {/* Team avatars */}
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="flex -space-x-2">
                                            {project.members.slice(0, 5).map((pm, i) => (
                                                pm.user.avatar ? (
                                                    <img key={i} src={pm.user.avatar} alt="" className="w-6 h-6 rounded-full border-2 border-[#00171F] object-cover" />
                                                ) : (
                                                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center border-2 border-[#00171F]">
                                                        <span className="text-[8px] font-bold text-white">{pm.user.name.charAt(0)}</span>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 shrink-0">
                                    <button onClick={() => handleEdit(project)}
                                        className="px-3 py-1.5 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/25 transition-colors">
                                        ✏️ Edit
                                    </button>
                                    {deleteConfirm === project._id ? (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleDelete(project._id)}
                                                className="px-2 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/30">Yes</button>
                                            <button onClick={() => setDeleteConfirm(null)}
                                                className="px-2 py-1.5 bg-white/[0.04] text-slate-400 rounded-lg text-xs hover:bg-white/[0.06]">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(project._id)}
                                            className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors">
                                            🗑 Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditProject(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#001a24] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-white mb-4">Edit Project</h3>

                            {message.text && (
                                <div className={`px-4 py-2 rounded-xl text-sm mb-4 ${
                                    message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                }`}>{message.text}</div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                                    <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={4}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                                    <select value={editStatus} onChange={e => setEditStatus(e.target.value)} title="Project status"
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40">
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Link</label>
                                    <input value={editLink} onChange={e => setEditLink(e.target.value)} type="url"
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Video URL</label>
                                    <input value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        placeholder="YouTube or Google Drive URL" />
                                </div>

                                {/* Team display (read-only in edit modal) */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Team Members</label>
                                    <div className="space-y-1.5">
                                        {editProject.members.map((pm, i) => (
                                            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg">
                                                <span className="text-white text-xs">{pm.user.name}</span>
                                                <span className="text-purple-400 text-[10px]">— {pm.role}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setEditProject(null)}
                                    className="flex-1 py-2.5 bg-white/[0.04] border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50">
                                    {saving ? "Saving..." : "💾 Save Changes"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
