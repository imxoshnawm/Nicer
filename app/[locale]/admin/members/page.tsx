"use client";

import { useState, useEffect } from "react";
import secureFetch from "@/lib/secureFetch";
import { useAdmin } from "../layout";
import { motion, AnimatePresence } from "framer-motion";

interface Member {
    _id: string;
    name: string;
    email: string;
    memberId: string;
    avatar?: string;
    bio?: string;
    roles: string[];
    department?: string;
    displayOrder: number;
    blocked: boolean;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin', president: 'President', vice_president: 'Vice Pres.',
    secretary: 'Secretary', treasurer: 'Treasurer', media: 'Media',
    editor: 'Editor', designer: 'Designer', developer: 'Developer',
    coordinator: 'Coordinator', member: 'Member',
};

export default function AdminMembersPage() {
    const { roles } = useAdmin();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [editBio, setEditBio] = useState("");
    const [editOrder, setEditOrder] = useState(999);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });

    const isAdmin = roles.includes('admin');
    const canManage = isAdmin || roles.includes('president');

    useEffect(() => { fetchMembers(); }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/members");
            if (res.ok) {
                const data = await res.json();
                setMembers(data.members || []);
            }
        } catch { }
        setLoading(false);
    };

    const handleEdit = (member: Member) => {
        setEditingMember(member);
        setEditBio(member.bio || "Member of NICER");
        setEditOrder(member.displayOrder || 999);
        setMessage({ text: "", type: "" });
    };

    const handleSave = async () => {
        if (!editingMember) return;
        setSaving(true);
        try {
            const res = await secureFetch(`/api/users/${editingMember._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bio: editBio, displayOrder: editOrder }),
            });
            if (res.ok) {
                setMessage({ text: "Saved successfully!", type: "success" });
                setMembers(prev => prev.map(m =>
                    m._id === editingMember._id ? { ...m, bio: editBio, displayOrder: editOrder } : m
                ).sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999)));
                setTimeout(() => setEditingMember(null), 800);
            } else {
                const data = await res.json();
                setMessage({ text: data.error || "Failed to save", type: "error" });
            }
        } catch {
            setMessage({ text: "Something went wrong", type: "error" });
        }
        setSaving(false);
    };

    const moveUp = async (member: Member) => {
        const idx = members.findIndex(m => m._id === member._id);
        if (idx <= 0) return;
        const prev = members[idx - 1];
        const newOrder = (prev.displayOrder || 999) - 1;
        try {
            await secureFetch(`/api/users/${member._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayOrder: newOrder }),
            });
            setMembers(prevMembers => {
                const updated = prevMembers.map(m =>
                    m._id === member._id ? { ...m, displayOrder: newOrder } : m
                );
                return updated.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
            });
        } catch { }
    };

    const moveDown = async (member: Member) => {
        const idx = members.findIndex(m => m._id === member._id);
        if (idx >= members.length - 1) return;
        const next = members[idx + 1];
        const newOrder = (next.displayOrder || 999) + 1;
        try {
            await secureFetch(`/api/users/${member._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayOrder: newOrder }),
            });
            setMembers(prevMembers => {
                const updated = prevMembers.map(m =>
                    m._id === member._id ? { ...m, displayOrder: newOrder } : m
                );
                return updated.sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
            });
        } catch { }
    };

    if (!canManage) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <p>You do not have permission to manage members.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-lg">👥</span>
                    Members Management
                </h1>
                <span className="text-slate-500 text-sm">{members.length} members</span>
            </motion.div>

            <p className="text-slate-400 text-sm">
                Manage member display order and bios. Members are shown on the public page in this order. Role holders appear in the &quot;Leadership Team&quot; section.
            </p>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-400"></div>
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs">Order</th>
                                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs">Member</th>
                                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs hidden sm:table-cell">Roles</th>
                                    <th className="text-left text-slate-500 font-medium px-4 py-3 text-xs hidden md:table-cell">Bio</th>
                                    <th className="text-right text-slate-500 font-medium px-4 py-3 text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member, idx) => (
                                    <tr key={member._id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => moveUp(member)} disabled={idx === 0}
                                                    className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors text-xs">▲</button>
                                                <span className="text-slate-400 font-mono text-xs w-8 text-center">{member.displayOrder}</span>
                                                <button onClick={() => moveDown(member)} disabled={idx === members.length - 1}
                                                    className="p-1 text-slate-500 hover:text-white disabled:opacity-20 transition-colors text-xs">▼</button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                                                        <span className="text-xs font-bold text-white">{member.name.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-medium text-sm">{member.name}</p>
                                                    <p className="text-slate-500 text-xs">{member.memberId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {member.roles.map(r => (
                                                    <span key={r} className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">
                                                        {ROLE_LABELS[r] || r}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="text-slate-400 text-xs truncate max-w-[200px]">{member.bio || 'Member of NICER'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => handleEdit(member)}
                                                className="px-3 py-1.5 bg-purple-500/15 text-purple-300 rounded-lg text-xs font-medium hover:bg-purple-500/25 transition-colors">
                                                ✏️ Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editingMember && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditingMember(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-[#001a24] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-white mb-1">Edit Member</h3>
                            <p className="text-slate-500 text-sm mb-5">{editingMember.name} ({editingMember.memberId})</p>

                            {message.text && (
                                <div className={`px-4 py-2 rounded-xl text-sm mb-4 ${
                                    message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                }`}>{message.text}</div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Bio / Caption</label>
                                    <textarea
                                        value={editBio}
                                        onChange={e => setEditBio(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm resize-none"
                                        placeholder="Member of NICER"
                                    />
                                    <p className="text-slate-600 text-xs mt-1">{editBio.length}/500</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Display Order</label>
                                    <input
                                        type="number"
                                        value={editOrder}
                                        onChange={e => setEditOrder(parseInt(e.target.value) || 999)}
                                        min={1}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 text-sm"
                                    />
                                    <p className="text-slate-600 text-xs mt-1">Lower number = appears first</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setEditingMember(null)}
                                    className="flex-1 py-2.5 bg-white/[0.04] border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50">
                                    {saving ? "Saving..." : "💾 Save"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
