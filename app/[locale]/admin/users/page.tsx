"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RoleConfig {
    value: string;
    label: string;
    color: string;
    icon: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    roles: string[];
    memberId: string;
    department: string;
    avatar: string;
    blocked: boolean;
    createdAt: string;
}

type ModalType = 'roles' | 'password' | 'details' | null;

export default function AdminUsersPage() {
    const { data: session } = useSession();
    const userRoles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalType, setModalType] = useState<ModalType>(null);
    const [editRoles, setEditRoles] = useState<string[]>([]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [editName, setEditName] = useState("");
    const [editDept, setEditDept] = useState("");
    const [editMemberId, setEditMemberId] = useState("");
    const [editAvatar, setEditAvatar] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [saving, setSaving] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<RoleConfig[]>([]);

    useEffect(() => {
        if (userRoles.length > 0 && !userRoles.includes("admin")) router.push("/admin");
    }, [userRoles, router]);

    useEffect(() => { fetchUsers(); fetchRoles(); }, []);

    const fetchRoles = async () => {
        try {
            const res = await secureFetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                const COLOR_MAP: Record<string, string> = {
                    red: 'bg-red-500/15 text-red-400 border-red-500/30',
                    orange: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
                    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    yellow: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                    green: 'bg-green-500/15 text-green-400 border-green-500/30',
                    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                    cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
                    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                    pink: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
                };
                setAvailableRoles((data.roles || []).map((r: any) => ({
                    value: r.slug,
                    label: r.name,
                    color: COLOR_MAP[r.color] || 'bg-slate-500/15 text-slate-400 border-slate-500/30',
                    icon: r.icon || '👤',
                })));
            }
        } catch { }
    };

    const fetchUsers = async () => {
        try {
            const res = await secureFetch("/api/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data.map((u: any) => ({ ...u, roles: u.roles || (u.role ? [u.role] : ['member']) })));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const showMsg = (type: 'success' | 'error', msg: string) => {
        if (type === 'success') { setActionSuccess(msg); setActionError(""); }
        else { setActionError(msg); setActionSuccess(""); }
        setTimeout(() => { setActionSuccess(""); setActionError(""); }, 4000);
    };

    const openModal = (user: User, type: ModalType) => {
        setSelectedUser(user);
        setModalType(type);
        setEditRoles([...user.roles]);
        setNewPassword("");
        setConfirmPassword("");
        setEditName(user.name);
        setEditDept(user.department || "");
        setEditMemberId(user.memberId || "");
        setEditAvatar(user.avatar || "");
        setActionError("");
    };

    const closeModal = () => { setSelectedUser(null); setModalType(null); setSaving(false); };

    const toggleBlock = async (user: User) => {
        try {
            const res = await secureFetch(`/api/users/${user._id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocked: !user.blocked }),
            });
            if (res.ok) { showMsg('success', user.blocked ? `${user.name} unblocked` : `${user.name} blocked`); fetchUsers(); }
            else { const d = await res.json().catch(() => ({})); showMsg('error', d.error || 'Failed'); }
        } catch { showMsg('error', 'Network error'); }
    };

    const saveRoles = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            const res = await secureFetch(`/api/users/${selectedUser._id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roles: editRoles }),
            });
            if (res.ok) { showMsg('success', 'Roles updated'); closeModal(); fetchUsers(); }
            else { const d = await res.json().catch(() => ({})); showMsg('error', d.error || 'Failed'); }
        } catch { showMsg('error', 'Network error'); }
        finally { setSaving(false); }
    };

    const resetPassword = async () => {
        if (!selectedUser) return;
        if (newPassword.length < 8) { showMsg('error', 'Password must be at least 8 characters'); return; }
        if (newPassword !== confirmPassword) { showMsg('error', 'Passwords do not match'); return; }
        setSaving(true);
        try {
            const res = await secureFetch(`/api/users/${selectedUser._id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword }),
            });
            if (res.ok) { showMsg('success', `Password reset for ${selectedUser.name}`); closeModal(); }
            else { const d = await res.json().catch(() => ({})); showMsg('error', d.error || 'Failed'); }
        } catch { showMsg('error', 'Network error'); }
        finally { setSaving(false); }
    };

    const saveDetails = async () => {
        if (!selectedUser) return;
        if (!editName.trim()) { showMsg('error', 'Name is required'); return; }
        setSaving(true);
        try {
            const res = await secureFetch(`/api/users/${selectedUser._id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName.trim(), department: editDept.trim(), memberId: editMemberId.trim(), avatar: editAvatar }),
            });
            if (res.ok) { showMsg('success', 'User updated'); closeModal(); fetchUsers(); }
            else { const d = await res.json().catch(() => ({})); showMsg('error', d.error || 'Failed'); }
        } catch { showMsg('error', 'Network error'); }
        finally { setSaving(false); }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { showMsg('error', 'Image must be less than 10MB'); return; }
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await secureFetch("/api/upload/avatar", { method: "POST", body: formData });
            if (uploadRes.ok) {
                const { url } = await uploadRes.json();
                setEditAvatar(url);
            } else {
                showMsg('error', 'Failed to upload');
            }
        } catch { showMsg('error', 'Upload error'); }
        finally { setUploadingAvatar(false); }
    };

    const deleteUser = async (user: User) => {
        if (!confirm(`Delete ${user.name}? This cannot be undone.`)) return;
        try {
            const res = await secureFetch(`/api/users/${user._id}`, { method: "DELETE" });
            if (res.ok) { showMsg('success', `${user.name} deleted`); fetchUsers(); }
            else { const d = await res.json().catch(() => ({})); showMsg('error', d.error || 'Failed'); }
        } catch { showMsg('error', 'Network error'); }
    };

    const toggleRole = (role: string) => {
        setEditRoles(prev => {
            if (prev.includes(role)) {
                if (prev.length <= 1) return prev;
                return prev.filter(r => r !== role);
            }
            return [...prev, role];
        });
    };

    const getRoleConfig = (role: string) => availableRoles.find(r => r.value === role) || { value: role, label: role, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: '👤' };

    const filteredUsers = users.filter(u => {
        const matchFilter = filter === "all" || (filter === "blocked" ? u.blocked : u.roles.includes(filter));
        const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const inputClass = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:border-transparent transition-all text-sm";

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white flex items-center gap-2">👥 Users</h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">{users.length} total · {users.filter(u => u.blocked).length} blocked · {users.filter(u => u.roles.includes('admin')).length} admins</p>
                </div>
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
                {actionError && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">❌ {actionError}</motion.div>
                )}
                {actionSuccess && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">✅ {actionSuccess}</motion.div>
                )}
            </AnimatePresence>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] text-sm"
                    />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)} title="Filter users"
                    className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#007EA7] min-w-[140px]">
                    <option value="all">All Users ({users.length})</option>
                    <option value="blocked">Blocked ({users.filter(u => u.blocked).length})</option>
                    {availableRoles.map(r => {
                        const c = users.filter(u => u.roles.includes(r.value)).length;
                        return c > 0 ? <option key={r.value} value={r.value}>{r.icon} {r.label} ({c})</option> : null;
                    })}
                </select>
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-10 text-center text-slate-500">
                    {search ? `No users matching "${search}"` : "No users found"}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredUsers.map((user, i) => (
                        <motion.div key={user._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            className={`bg-white/[0.03] backdrop-blur-sm border rounded-xl p-4 hover:bg-white/[0.05] transition-all group ${user.blocked ? 'border-red-500/20' : 'border-white/[0.06]'}`}>
                            {/* Top: Avatar + Info */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className={`w-11 h-11 rounded-xl shrink-0 overflow-hidden ${user.blocked ? 'ring-2 ring-red-500/30' : ''}`}>
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                                    ) : (
                                        <div className={`w-full h-full rounded-xl flex items-center justify-center text-sm font-bold text-white ${user.blocked ? 'bg-red-500/30' : 'bg-gradient-to-tr from-[#003459] to-[#007EA7]'}`}>
                                            {user.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-white font-semibold text-sm truncate">{user.name}</p>
                                        {user.blocked && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-md font-bold">BLOCKED</span>}
                                    </div>
                                    <p className="text-slate-500 text-xs truncate">{user.email}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {user.memberId && <span className="text-[#00A8E8] text-[10px] font-mono bg-[#007EA7]/10 px-1.5 py-0.5 rounded">🆔 {user.memberId}</span>}
                                        <span className="text-slate-600 text-[10px]">{new Date(user.createdAt).toLocaleDateString()}{user.department && ` · ${user.department}`}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Roles */}
                            <div className="flex flex-wrap gap-1 mb-3">
                                {user.roles.map(r => {
                                    const rc = getRoleConfig(r);
                                    return <span key={r} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${rc.color}`}>{rc.icon} {rc.label}</span>;
                                })}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.04]">
                                <button onClick={() => openModal(user, 'details')} className="flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all" title="Edit details">
                                    ✏️ Edit
                                </button>
                                <button onClick={() => openModal(user, 'roles')} className="flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#007EA7]/10 text-[#00A8E8] hover:bg-[#007EA7]/20 transition-all" title="Edit roles">
                                    🔧 Roles
                                </button>
                                <button onClick={() => openModal(user, 'password')} className="flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all" title="Reset password">
                                    🔑 Password
                                </button>
                                <button onClick={() => toggleBlock(user)} className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${user.blocked ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}>
                                    {user.blocked ? '✅' : '🚫'}
                                </button>
                                <button onClick={() => deleteUser(user)} className="px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                    🗑️
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {selectedUser && modalType && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={closeModal}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#001a24] border border-white/[0.08] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            {/* Modal Header */}
                            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                                        {selectedUser.avatar ? (
                                            <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-[#003459] to-[#007EA7] flex items-center justify-center text-sm font-bold text-white">
                                                {selectedUser.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{selectedUser.name}</p>
                                        <p className="text-slate-500 text-xs">{selectedUser.email}{selectedUser.memberId && ` · ${selectedUser.memberId}`}</p>
                                    </div>
                                </div>
                                <button onClick={closeModal} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">✕</button>
                            </div>

                            <div className="p-5">
                                {/* Roles Editor */}
                                {modalType === 'roles' && (
                                    <div className="space-y-4">
                                        <h3 className="text-white font-bold text-sm">🔧 Manage Roles</h3>
                                        <p className="text-slate-400 text-xs">Select roles for this user. At least one role is required.</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableRoles.map(r => (
                                                <button key={r.value} onClick={() => toggleRole(r.value)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left ${
                                                        editRoles.includes(r.value) ? r.color + ' border-current shadow-sm' : 'bg-white/[0.02] text-slate-500 border-white/[0.06] hover:text-slate-300 hover:bg-white/[0.04]'
                                                    }`}>
                                                    <span className="text-base">{r.icon}</span>
                                                    <span>{r.label}</span>
                                                    {editRoles.includes(r.value) && <span className="ml-auto">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                        <button onClick={saveRoles} disabled={saving}
                                            className="w-full py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-50">
                                            {saving ? "Saving..." : "Save Roles"}
                                        </button>
                                    </div>
                                )}

                                {/* Password Reset */}
                                {modalType === 'password' && (
                                    <div className="space-y-4">
                                        <h3 className="text-white font-bold text-sm">🔑 Reset Password</h3>
                                        <p className="text-slate-400 text-xs">Set a new password for {selectedUser.name}. Minimum 8 characters.</p>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
                                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Enter new password..." className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
                                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password..." className={inputClass} />
                                        </div>
                                        {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-red-400 text-xs">Passwords do not match</p>
                                        )}
                                        {newPassword && newPassword.length > 0 && newPassword.length < 8 && (
                                            <p className="text-amber-400 text-xs">Must be at least 8 characters ({newPassword.length}/8)</p>
                                        )}
                                        <button onClick={resetPassword} disabled={saving || newPassword.length < 8 || newPassword !== confirmPassword}
                                            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-50">
                                            {saving ? "Resetting..." : "Reset Password"}
                                        </button>
                                    </div>
                                )}

                                {/* Edit Details */}
                                {modalType === 'details' && (
                                    <div className="space-y-4">
                                        <h3 className="text-white font-bold text-sm">✏️ Edit User Details</h3>

                                        {/* Avatar Upload */}
                                        <div className="flex items-center gap-4">
                                            <div className="relative group">
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
                                                    {editAvatar ? (
                                                        <img src={editAvatar} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-500 text-xl">
                                                            {selectedUser.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                                                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#007EA7] rounded-full flex items-center justify-center text-white text-[10px] shadow-lg hover:bg-[#00A8E8] transition-colors">
                                                    {uploadingAvatar ? "⏳" : "📷"}
                                                </button>
                                                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-slate-400 text-xs">Profile Photo</p>
                                                <p className="text-slate-600 text-[10px]">JPG, PNG, WebP · Max 10MB</p>
                                                {editAvatar && (
                                                    <button onClick={() => setEditAvatar("")} className="text-red-400 text-[10px] hover:text-red-300 mt-1">Remove photo</button>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Name</label>
                                            <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="User name" className={inputClass} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Member ID</label>
                                            <input value={editMemberId} onChange={e => setEditMemberId(e.target.value)} placeholder="e.g. NC-A3B5K" className={inputClass + " font-mono"} />
                                            <p className="text-slate-600 text-[10px] mt-1">Auto-generated on registration. Change only if needed.</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1.5">Department</label>
                                            <input value={editDept} onChange={e => setEditDept(e.target.value)} placeholder="e.g. Computer Science" className={inputClass} />
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1 text-xs">
                                            <p className="text-slate-500">📧 Email: <span className="text-slate-300">{selectedUser.email}</span> (cannot change)</p>
                                            <p className="text-slate-500">📅 Joined: <span className="text-slate-300">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></p>
                                            <p className="text-slate-500">🔐 Status: <span className={selectedUser.blocked ? "text-red-400" : "text-green-400"}>{selectedUser.blocked ? 'Blocked' : 'Active'}</span></p>
                                        </div>
                                        <button onClick={saveDetails} disabled={saving}
                                            className="w-full py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-50">
                                            {saving ? "Saving..." : "Save Changes"}
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
