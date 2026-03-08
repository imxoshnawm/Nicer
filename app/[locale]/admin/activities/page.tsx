"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Activity {
    _id: string;
    title: string;
    titleKu: string;
    titleAr: string;
    description: string;
    descriptionKu: string;
    descriptionAr: string;
    date: string;
    location: string;
    imageUrl: string;
    status: string;
}

const STATUS_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    upcoming: { label: 'Upcoming', icon: '🔵', color: 'text-blue-400', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    ongoing: { label: 'Ongoing', icon: '🟢', color: 'text-green-400', bg: 'bg-green-500/15 text-green-400 border-green-500/30' },
    completed: { label: 'Completed', icon: '⚪', color: 'text-slate-400', bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

export default function AdminActivitiesPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || "";
    const router = useRouter();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [editActivity, setEditActivity] = useState<Activity | null>(null);
    const [editForm, setEditForm] = useState<Partial<Activity>>({});
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [langTab, setLangTab] = useState<'en' | 'ku' | 'ar'>('en');
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (role && role !== "admin") router.push("/admin");
    }, [role, router]);

    useEffect(() => { fetchActivities(); }, []);

    const fetchActivities = async () => {
        try {
            const res = await secureFetch("/api/activities");
            if (res.ok) setActivities(await res.json());
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const showMsg = (type: 'success' | 'error', text: string) => {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 4000);
    };

    const changeStatus = async (id: string, newStatus: string) => {
        try {
            const res = await secureFetch(`/api/activities/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) { showMsg('success', 'Status updated'); fetchActivities(); }
            else showMsg('error', 'Failed to update status');
        } catch { showMsg('error', 'Network error'); }
    };

    const deleteActivity = async (id: string) => {
        if (!confirm("Delete this activity? This cannot be undone.")) return;
        try {
            const res = await secureFetch(`/api/activities/${id}`, { method: "DELETE" });
            if (res.ok) { showMsg('success', 'Activity deleted'); fetchActivities(); }
            else showMsg('error', 'Failed to delete');
        } catch { showMsg('error', 'Network error'); }
    };

    const openEdit = (act: Activity) => {
        setEditActivity(act);
        setEditForm({ ...act });
        setLangTab('en');
    };

    const saveEdit = async () => {
        if (!editActivity) return;
        setSaving(true);
        const payload = {
            title: editForm.title, titleKu: editForm.titleKu, titleAr: editForm.titleAr,
            description: editForm.description, descriptionKu: editForm.descriptionKu, descriptionAr: editForm.descriptionAr,
            date: editForm.date, location: editForm.location, status: editForm.status,
            imageUrl: editForm.imageUrl,
        };
        console.log('💾 [SAVE] Saving activity:', editActivity._id);
        console.log('💾 [SAVE] editForm.imageUrl:', editForm.imageUrl);
        console.log('💾 [SAVE] Full payload:', JSON.stringify(payload));
        try {
            const res = await secureFetch(`/api/activities/${editActivity._id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            console.log('💾 [SAVE] Response status:', res.status, res.ok);
            if (res.ok) {
                const result = await res.json();
                console.log('💾 [SAVE] Response data imageUrl:', result.imageUrl);
                showMsg('success', 'Activity updated');
                setEditActivity(null);
                fetchActivities();
            }
            else {
                const d = await res.json().catch(() => ({}));
                console.error('💾 [SAVE] Save FAILED:', res.status, d);
                showMsg('error', d.error || 'Failed to update');
            }
        } catch (err) {
            console.error('💾 [SAVE] Network ERROR:', err);
            showMsg('error', 'Network error');
        }
        finally { setSaving(false); }
    };

    const uploadImage = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) { showMsg('error', 'Image must be less than 5MB'); return; }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            showMsg('error', 'Only JPG, PNG, WebP, GIF allowed'); return;
        }
        setUploading(true);
        console.log('📤 [EDIT] Starting image upload for file:', file.name, file.size, file.type);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await secureFetch("/api/upload", { method: "POST", body: formData });
            console.log('📤 [EDIT] Upload response status:', res.status, res.ok);
            if (res.ok) {
                const data = await res.json();
                console.log('📤 [EDIT] Upload response data:', data);
                setEditForm(prev => ({ ...prev, imageUrl: data.url }));
                console.log('📤 [EDIT] imageUrl set to:', data.url);
            } else {
                const errText = await res.text().catch(() => 'unknown');
                console.error('📤 [EDIT] Upload FAILED:', res.status, errText);
                showMsg('error', 'Upload failed: ' + res.status);
            }
        } catch (err) {
            console.error('📤 [EDIT] Upload ERROR:', err);
            showMsg('error', 'Upload error');
        }
        finally { setUploading(false); }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) uploadImage(file);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadImage(file);
    };

    const filtered = activities.filter(a => {
        const matchStatus = statusFilter === "all" || a.status === statusFilter;
        const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.location?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
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
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">📅 Activities</h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        {activities.length} total · {activities.filter(a => a.status === 'upcoming').length} upcoming · {activities.filter(a => a.status === 'ongoing').length} ongoing
                    </p>
                </div>
                <Link href="/admin/activities/new"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#00A8E8]/20 hover:scale-[1.03] transition-all">
                    ➕ New Activity
                </Link>
            </motion.div>

            {/* Messages */}
            <AnimatePresence>
                {msg && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        {msg.type === 'success' ? '✅' : '❌'} {msg.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] text-sm" />
                </div>
                <div className="flex gap-2">
                    {['all', 'upcoming', 'ongoing', 'completed'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? 'bg-[#007EA7]/20 text-[#00A8E8] border border-[#007EA7]/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white'}`}>
                            {s === 'all' ? `All (${activities.length})` : `${STATUS_CONFIG[s]?.icon} ${STATUS_CONFIG[s]?.label}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activities List */}
            {filtered.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-10 text-center">
                    <span className="text-4xl block mb-3">📅</span>
                    <p className="text-slate-500">{search ? `No activities matching "${search}"` : "No activities yet"}</p>
                    {!search && <Link href="/admin/activities/new" className="inline-block mt-3 text-[#00A8E8] text-sm hover:text-white transition-colors">Create your first activity →</Link>}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filtered.map((act, i) => {
                        const sc = STATUS_CONFIG[act.status] || STATUS_CONFIG['upcoming'];
                        const isPast = new Date(act.date) < new Date();
                        return (
                            <motion.div key={act._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl overflow-hidden hover:bg-white/[0.05] transition-all">
                                {/* Image thumbnail */}
                                {act.imageUrl && (
                                    <div className="h-32 bg-white/[0.02] border-b border-white/[0.04] overflow-hidden">
                                        <img src={act.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-4">
                                {/* Title & Status */}
                                <div className="flex items-start gap-3 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-semibold text-sm">{act.title}</h3>
                                        {act.titleKu && <p className="text-slate-500 text-xs mt-0.5" dir="rtl">{act.titleKu}</p>}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border shrink-0 ${sc.bg}`}>
                                        {sc.icon} {sc.label}
                                    </span>
                                </div>

                                {/* Description preview */}
                                {act.description && (
                                    <p className="text-slate-400 text-xs line-clamp-2 mb-3">{act.description}</p>
                                )}

                                {/* Meta */}
                                <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mb-3">
                                    <span className="flex items-center gap-1">📅 {new Date(act.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                        {isPast && act.status !== 'completed' && <span className="text-amber-400 ml-1">(past)</span>}
                                    </span>
                                    {act.location && <span className="flex items-center gap-1">📍 {act.location}</span>}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.04]">
                                    <button onClick={() => openEdit(act)}
                                        className="flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#007EA7]/10 text-[#00A8E8] hover:bg-[#007EA7]/20 transition-all">
                                        ✏️ Edit
                                    </button>
                                    <select value={act.status} onChange={e => changeStatus(act._id, e.target.value)} title="Change status"
                                        className="px-2 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.04] text-slate-400 border-0 cursor-pointer focus:outline-none">
                                        <option value="upcoming">🔵 Upcoming</option>
                                        <option value="ongoing">🟢 Ongoing</option>
                                        <option value="completed">⚪ Completed</option>
                                    </select>
                                    <button onClick={() => deleteActivity(act._id)}
                                        className="px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                        🗑️ Delete
                                    </button>
                                </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editActivity && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditActivity(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#001a24] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                                <h2 className="text-white font-bold text-lg">✏️ Edit Activity</h2>
                                <button onClick={() => setEditActivity(null)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">✕</button>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Language tabs */}
                                <div className="flex gap-2">
                                    {(['en', 'ku', 'ar'] as const).map(l => (
                                        <button key={l} onClick={() => setLangTab(l)}
                                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${langTab === l ? 'bg-[#007EA7]/20 text-[#00A8E8] border border-[#007EA7]/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'}`}>
                                            {l === 'en' ? '🇬🇧 English' : l === 'ku' ? '🇮🇶 Kurdish' : '🇸🇦 Arabic'}
                                        </button>
                                    ))}
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        Title ({langTab === 'en' ? 'English' : langTab === 'ku' ? 'Kurdish' : 'Arabic'})
                                    </label>
                                    <input
                                        value={langTab === 'en' ? editForm.title || '' : langTab === 'ku' ? editForm.titleKu || '' : editForm.titleAr || ''}
                                        onChange={e => setEditForm(prev => ({
                                            ...prev,
                                            ...(langTab === 'en' ? { title: e.target.value } : langTab === 'ku' ? { titleKu: e.target.value } : { titleAr: e.target.value })
                                        }))}
                                        dir={langTab === 'ar' || langTab === 'ku' ? 'rtl' : 'ltr'}
                                        placeholder="Activity title" className={inputClass} />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                        Description ({langTab === 'en' ? 'English' : langTab === 'ku' ? 'Kurdish' : 'Arabic'})
                                    </label>
                                    <textarea rows={4}
                                        value={langTab === 'en' ? editForm.description || '' : langTab === 'ku' ? editForm.descriptionKu || '' : editForm.descriptionAr || ''}
                                        onChange={e => setEditForm(prev => ({
                                            ...prev,
                                            ...(langTab === 'en' ? { description: e.target.value } : langTab === 'ku' ? { descriptionKu: e.target.value } : { descriptionAr: e.target.value })
                                        }))}
                                        dir={langTab === 'ar' || langTab === 'ku' ? 'rtl' : 'ltr'}
                                        placeholder="Activity description" className={inputClass + " resize-none"} />
                                </div>

                                {/* Date & Location */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
                                        <input type="date" value={editForm.date ? new Date(editForm.date).toISOString().split('T')[0] : ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, date: e.target.value }))} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
                                        <input value={editForm.location || ''} onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                            placeholder="e.g. Main Hall" className={inputClass} />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                                    <div className="flex gap-2">
                                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                            <button key={key} onClick={() => setEditForm(prev => ({ ...prev, status: key }))}
                                                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${editForm.status === key ? val.bg + ' border-current' : 'bg-white/[0.02] text-slate-500 border-white/[0.06]'}`}>
                                                {val.icon} {val.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Upload */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Activity Image</label>
                                    {editForm.imageUrl ? (
                                        <div className="relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.08]">
                                            <img src={editForm.imageUrl} alt="" className="w-full h-36 object-cover" />
                                            <div className="absolute top-2 right-2 flex gap-2">
                                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                                    className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white rounded-lg text-[10px] hover:bg-black/80 transition-all">
                                                    📷 Change
                                                </button>
                                                <button type="button" onClick={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))}
                                                    className="px-2 py-1 bg-red-500/60 backdrop-blur-sm text-white rounded-lg text-[10px] hover:bg-red-500/80 transition-all">
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                                dragOver ? 'border-[#00A8E8] bg-[#007EA7]/10' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                                            }`}
                                        >
                                            {uploading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#00A8E8]"></div>
                                                    <p className="text-slate-400 text-xs">Uploading...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="text-2xl block mb-1">🖼️</span>
                                                    <p className="text-slate-400 text-xs">Drag & drop or click to upload</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
                                </div>

                                <button onClick={saveEdit} disabled={saving}
                                    className="w-full py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white font-semibold rounded-xl text-sm hover:shadow-lg transition-all disabled:opacity-50">
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
