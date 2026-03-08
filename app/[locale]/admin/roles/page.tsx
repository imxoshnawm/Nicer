"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import secureFetch from "@/lib/secureFetch";
import { motion, AnimatePresence } from "framer-motion";

interface Role {
    _id: string;
    name: string;
    slug: string;
    description: string;
    permissions: string[];
    isSystem: boolean;
    color: string;
    icon: string;
    createdAt: string;
}

const COLOR_OPTIONS = [
    { value: 'red', bg: 'bg-red-500/15 text-red-400 border-red-500/30' },
    { value: 'orange', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    { value: 'amber', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    { value: 'yellow', bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    { value: 'green', bg: 'bg-green-500/15 text-green-400 border-green-500/30' },
    { value: 'emerald', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    { value: 'cyan', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
    { value: 'blue', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    { value: 'indigo', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    { value: 'purple', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    { value: 'pink', bg: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
];

const ICON_OPTIONS = ['👑', '🎓', '🎖️', '📋', '💰', '📸', '✏️', '🎨', '💻', '🔗', '👤', '🛡️', '⚡', '🔧', '📊', '🎯', '🌟', '🔑', '📁', '🧑‍💼'];

const PERMISSION_GROUPS: Record<string, { label: string; permissions: { key: string; label: string }[] }> = {
    dashboard: {
        label: '📊 Dashboard',
        permissions: [
            { key: 'dashboard.view', label: 'View Dashboard' },
        ],
    },
    posts: {
        label: '📝 Posts',
        permissions: [
            { key: 'posts.view', label: 'View Posts' },
            { key: 'posts.create', label: 'Create Posts' },
            { key: 'posts.edit', label: 'Edit Posts' },
            { key: 'posts.delete', label: 'Delete Posts' },
            { key: 'posts.publish', label: 'Publish Posts' },
        ],
    },
    approvals: {
        label: '✅ Approvals',
        permissions: [
            { key: 'approvals.view', label: 'View Approvals' },
            { key: 'approvals.manage', label: 'Manage Approvals' },
        ],
    },
    activities: {
        label: '📅 Activities',
        permissions: [
            { key: 'activities.view', label: 'View Activities' },
            { key: 'activities.create', label: 'Create Activities' },
            { key: 'activities.edit', label: 'Edit Activities' },
            { key: 'activities.delete', label: 'Delete Activities' },
        ],
    },
    users: {
        label: '👥 Users',
        permissions: [
            { key: 'users.view', label: 'View Users' },
            { key: 'users.edit', label: 'Edit Users' },
            { key: 'users.delete', label: 'Delete Users' },
            { key: 'users.manage_roles', label: 'Manage User Roles' },
        ],
    },
    members: {
        label: '🧑‍🤝‍🧑 Members',
        permissions: [
            { key: 'members.view', label: 'View Members' },
            { key: 'members.edit', label: 'Edit Members' },
        ],
    },
    projects: {
        label: '🚀 Projects',
        permissions: [
            { key: 'projects.view', label: 'View Projects' },
            { key: 'projects.manage', label: 'Manage Projects' },
        ],
    },
    messages: {
        label: '💬 Messages',
        permissions: [
            { key: 'messages.view', label: 'View Messages' },
            { key: 'messages.reply', label: 'Reply to Messages' },
        ],
    },
    settings: {
        label: '⚙️ Settings',
        permissions: [
            { key: 'settings.view', label: 'View Settings' },
            { key: 'settings.edit', label: 'Edit Settings' },
        ],
    },
    audit: {
        label: '🔒 Audit Log',
        permissions: [
            { key: 'audit.view', label: 'View Audit Log' },
        ],
    },
    roles: {
        label: '🛡️ Roles',
        permissions: [
            { key: 'roles.view', label: 'View Roles' },
            { key: 'roles.manage', label: 'Manage Roles' },
        ],
    },
};

function getColorClass(color: string): string {
    const c = COLOR_OPTIONS.find(o => o.value === color);
    return c?.bg || 'bg-blue-500/15 text-blue-400 border-blue-500/30';
}

export default function AdminRolesPage() {
    const { data: session } = useSession();
    const userRoles: string[] = (session?.user as any)?.roles || [];
    const router = useRouter();

    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formColor, setFormColor] = useState("blue");
    const [formIcon, setFormIcon] = useState("👤");
    const [formPerms, setFormPerms] = useState<string[]>([]);

    useEffect(() => {
        if (!userRoles.includes("admin")) router.push("/admin");
    }, [userRoles, router]);

    useEffect(() => { fetchRoles(); }, []);

    const fetchRoles = async () => {
        try {
            const res = await secureFetch("/api/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(data.roles || []);
            }
        } catch { }
        setLoading(false);
    };

    const showMsg = (type: 'success' | 'error', msg: string) => {
        if (type === 'success') { setSuccess(msg); setError(""); }
        else { setError(msg); setSuccess(""); }
        setTimeout(() => { setSuccess(""); setError(""); }, 4000);
    };

    const resetForm = () => {
        setFormName("");
        setFormDesc("");
        setFormColor("blue");
        setFormIcon("👤");
        setFormPerms([]);
        setEditingRole(null);
        setShowCreate(false);
    };

    const openCreate = () => {
        resetForm();
        setShowCreate(true);
    };

    const openEdit = (role: Role) => {
        setFormName(role.name);
        setFormDesc(role.description);
        setFormColor(role.color);
        setFormIcon(role.icon);
        setFormPerms([...role.permissions]);
        setEditingRole(role);
        setShowCreate(true);
    };

    const togglePerm = (perm: string) => {
        setFormPerms(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        );
    };

    const toggleGroupAll = (groupKey: string) => {
        const group = PERMISSION_GROUPS[groupKey];
        if (!group) return;
        const groupPerms = group.permissions.map(p => p.key);
        const allSelected = groupPerms.every(p => formPerms.includes(p));
        if (allSelected) {
            setFormPerms(prev => prev.filter(p => !groupPerms.includes(p)));
        } else {
            setFormPerms(prev => {
                const newPerms = new Set([...prev, ...groupPerms]);
                return Array.from(newPerms);
            });
        }
    };

    const selectAll = () => {
        const all = Object.values(PERMISSION_GROUPS).flatMap(g => g.permissions.map(p => p.key));
        setFormPerms(all);
    };

    const deselectAll = () => setFormPerms([]);

    const handleSave = async () => {
        if (!formName.trim()) { showMsg('error', 'Role name is required'); return; }
        setSaving(true);

        try {
            const body = {
                name: formName.trim(),
                description: formDesc.trim(),
                color: formColor,
                icon: formIcon,
                permissions: formPerms,
            };

            let res: Response;
            if (editingRole) {
                res = await secureFetch(`/api/roles/${editingRole._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            } else {
                res = await secureFetch('/api/roles', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
            }

            if (res.ok) {
                showMsg('success', editingRole ? 'Role updated successfully' : 'Role created successfully');
                resetForm();
                fetchRoles();
            } else {
                const data = await res.json();
                showMsg('error', data.error || 'Failed to save role');
            }
        } catch {
            showMsg('error', 'Something went wrong');
        }
        setSaving(false);
    };

    const handleDelete = async (roleId: string) => {
        try {
            const res = await secureFetch(`/api/roles/${roleId}`, { method: 'DELETE' });
            if (res.ok) {
                showMsg('success', 'Role deleted');
                setDeleteConfirm(null);
                fetchRoles();
            } else {
                const data = await res.json();
                showMsg('error', data.error || 'Failed to delete');
            }
        } catch {
            showMsg('error', 'Something went wrong');
        }
    };

    const container = { hidden: {}, show: { transition: { staggerChildren: 0.03 } } };
    const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">🛡️ Role Management</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Create custom roles and configure permissions for each role
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-bold text-sm hover:shadow-lg hover:scale-[1.03] transition-all"
                >
                    ➕ Create Role
                </button>
            </div>

            {/* Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">{success}</motion.div>
                )}
            </AnimatePresence>

            {/* Create/Edit Form */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">
                                    {editingRole ? `✏️ Edit: ${editingRole.name}` : '➕ Create New Role'}
                                </h2>
                                <button onClick={resetForm} className="text-slate-400 hover:text-white text-sm">✕ Close</button>
                            </div>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Role Name *</label>
                                    <input
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        placeholder="e.g. HR Manager, Content Lead..."
                                        maxLength={50}
                                        disabled={editingRole?.isSystem}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/40 placeholder-slate-500 disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                                    <input
                                        value={formDesc}
                                        onChange={e => setFormDesc(e.target.value)}
                                        placeholder="Short description of this role..."
                                        maxLength={200}
                                        disabled={editingRole?.isSystem && editingRole?.slug === 'admin'}
                                        className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/40 placeholder-slate-500 disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Icon & Color */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Icon</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {ICON_OPTIONS.map(ic => (
                                            <button key={ic} onClick={() => setFormIcon(ic)}
                                                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                                                    formIcon === ic
                                                        ? 'bg-[#007EA7]/30 border-2 border-[#00A8E8] scale-110'
                                                        : 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08]'
                                                }`}>
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Color</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {COLOR_OPTIONS.map(c => (
                                            <button key={c.value} onClick={() => setFormColor(c.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${c.bg} ${
                                                    formColor === c.value ? 'ring-2 ring-white/30 scale-105' : 'opacity-60 hover:opacity-100'
                                                }`}>
                                                {c.value}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Preview */}
                                    <div className="mt-3">
                                        <span className="text-xs text-slate-500 mr-2">Preview:</span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getColorClass(formColor)}`}>
                                            {formIcon} {formName || 'Role Name'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions */}
                            {!(editingRole?.isSystem && editingRole?.slug === 'admin') && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-medium text-slate-400">
                                            Permissions ({formPerms.length} selected)
                                        </label>
                                        <div className="flex gap-2">
                                            <button onClick={selectAll} className="text-[#00A8E8] text-xs hover:underline">Select All</button>
                                            <span className="text-slate-600 text-xs">|</span>
                                            <button onClick={deselectAll} className="text-slate-400 text-xs hover:underline">Deselect All</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => {
                                            const allSelected = group.permissions.every(p => formPerms.includes(p.key));
                                            const someSelected = group.permissions.some(p => formPerms.includes(p.key));

                                            return (
                                                <div key={groupKey} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                                                    <button
                                                        onClick={() => toggleGroupAll(groupKey)}
                                                        className="flex items-center gap-2 w-full text-left mb-2"
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all ${
                                                            allSelected
                                                                ? 'bg-[#00A8E8] border-[#00A8E8] text-white'
                                                                : someSelected
                                                                    ? 'bg-[#00A8E8]/30 border-[#00A8E8]/50 text-white'
                                                                    : 'border-white/20'
                                                        }`}>
                                                            {allSelected ? '✓' : someSelected ? '−' : ''}
                                                        </div>
                                                        <span className="text-sm font-bold text-white">{group.label}</span>
                                                    </button>

                                                    <div className="space-y-1 ml-1">
                                                        {group.permissions.map(perm => (
                                                            <label key={perm.key}
                                                                className="flex items-center gap-2 cursor-pointer py-0.5 hover:bg-white/[0.02] rounded px-1 -mx-1 transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={formPerms.includes(perm.key)}
                                                                    onChange={() => togglePerm(perm.key)}
                                                                    className="w-3.5 h-3.5 rounded border-white/20 bg-white/[0.04] text-[#00A8E8] focus:ring-[#00A8E8]/30 accent-[#00A8E8]"
                                                                />
                                                                <span className="text-xs text-slate-300">{perm.label}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {editingRole?.isSystem && editingRole?.slug === 'admin' && (
                                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 text-center">
                                    <p className="text-red-400 text-sm">👑 The Admin role has all permissions and cannot be modified.</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={resetForm}
                                    className="flex-1 py-2.5 bg-white/[0.04] border border-white/10 text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving || (editingRole?.isSystem && editingRole?.slug === 'admin')}
                                    className="flex-1 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all disabled:opacity-50">
                                    {saving ? 'Saving...' : editingRole ? '💾 Update Role' : '✅ Create Role'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Roles List */}
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {roles.map(role => (
                    <motion.div key={role._id} variants={item}
                        className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-all group">
                        {/* Role Header */}
                        <div className="flex items-start gap-3 mb-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${getColorClass(role.color)} border`}>
                                {role.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-white font-bold text-sm truncate">{role.name}</h3>
                                    {role.isSystem && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">
                                            SYSTEM
                                        </span>
                                    )}
                                </div>
                                <p className="text-slate-500 text-xs mt-0.5 truncate">{role.description || 'No description'}</p>
                                <p className="text-slate-600 text-[10px] font-mono mt-1">slug: {role.slug}</p>
                            </div>
                        </div>

                        {/* Permissions summary */}
                        <div className="mb-4">
                            {role.slug === 'admin' ? (
                                <span className="text-[10px] px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/15 font-medium">
                                    ✨ All Permissions
                                </span>
                            ) : role.permissions.length === 0 ? (
                                <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] text-slate-500 border border-white/[0.06]">
                                    No permissions
                                </span>
                            ) : (
                                <div className="flex flex-wrap gap-1">
                                    {role.permissions.slice(0, 4).map(p => (
                                        <span key={p} className="text-[9px] px-1.5 py-0.5 rounded bg-[#007EA7]/10 text-[#00A8E8] border border-[#007EA7]/15">
                                            {p.split('.').pop()}
                                        </span>
                                    ))}
                                    {role.permissions.length > 4 && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">
                                            +{role.permissions.length - 4} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {role.slug !== 'admin' && (
                                <button onClick={() => openEdit(role)}
                                    className="flex-1 py-2 text-xs font-medium text-[#00A8E8] bg-[#007EA7]/10 rounded-xl hover:bg-[#007EA7]/20 transition-all">
                                    ✏️ Edit
                                </button>
                            )}
                            {!role.isSystem && (
                                <>
                                    {deleteConfirm === role._id ? (
                                        <div className="flex-1 flex gap-1">
                                            <button onClick={() => handleDelete(role._id)}
                                                className="flex-1 py-2 text-xs font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all">
                                                Confirm
                                            </button>
                                            <button onClick={() => setDeleteConfirm(null)}
                                                className="py-2 px-3 text-xs text-slate-400 bg-white/[0.04] rounded-xl hover:bg-white/[0.06]">
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setDeleteConfirm(role._id)}
                                            className="py-2 px-3 text-xs font-medium text-red-400/60 hover:text-red-400 bg-red-500/5 rounded-xl hover:bg-red-500/10 transition-all">
                                            🗑
                                        </button>
                                    )}
                                </>
                            )}
                            {role.slug === 'admin' && (
                                <div className="flex-1 py-2 text-xs text-center text-slate-500 bg-white/[0.02] rounded-xl">
                                    🔒 Protected
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {roles.length === 0 && (
                <div className="text-center py-16">
                    <span className="text-4xl block mb-3">🛡️</span>
                    <p className="text-slate-400 text-sm">No roles found. Create your first custom role!</p>
                </div>
            )}
        </div>
    );
}
