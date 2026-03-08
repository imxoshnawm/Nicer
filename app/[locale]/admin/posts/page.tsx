"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Post {
    _id: string;
    title: string;
    titleKu: string;
    titleAr: string;
    content: string;
    contentKu: string;
    contentAr: string;
    category: string;
    imageUrl: string;
    published: boolean;
    approvalStatus: string;
    author: string;
    createdAt: string;
}

const CATEGORIES = [
    { value: 'tech', label: 'Tech', icon: '💻', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    { value: 'science', label: 'Science', icon: '🔬', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
    { value: 'sports', label: 'Sports', icon: '⚽', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    { value: 'entertainment', label: 'Entertainment', icon: '🎭', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    { value: 'other', label: 'Other', icon: '📌', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
];

export default function AdminPostsPage() {
    const { data: session } = useSession();
    const roles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];
    const isAdmin = roles.includes('admin');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [editPost, setEditPost] = useState<Post | null>(null);
    const [editForm, setEditForm] = useState<Partial<Post>>({});
    const [langTab, setLangTab] = useState<'en' | 'ku' | 'ar'>('en');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const deletePost = async (id: string) => {
        if (!confirm("Delete this post? This cannot be undone.")) return;
        try {
            const res = await secureFetch(`/api/posts/${id}`, { method: "DELETE" });
            if (res.ok) { showMsg('success', 'Post deleted'); fetchPosts(); }
            else showMsg('error', 'Failed to delete');
        } catch { showMsg('error', 'Network error'); }
    };

    const togglePublish = async (id: string, published: boolean) => {
        try {
            const res = await secureFetch(`/api/posts/${id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ published: !published }),
            });
            if (res.ok) { showMsg('success', !published ? 'Published' : 'Unpublished'); fetchPosts(); }
            else showMsg('error', 'Failed to update');
        } catch { showMsg('error', 'Network error'); }
    };

    const openEdit = (post: Post) => {
        setEditPost(post);
        setEditForm({ ...post });
        setLangTab('en');
    };

    const saveEdit = async () => {
        if (!editPost) return;
        setSaving(true);
        try {
            const res = await secureFetch(`/api/posts/${editPost._id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editForm.title, titleKu: editForm.titleKu, titleAr: editForm.titleAr,
                    content: editForm.content, contentKu: editForm.contentKu, contentAr: editForm.contentAr,
                    category: editForm.category, imageUrl: editForm.imageUrl,
                }),
            });
            if (res.ok) { showMsg('success', 'Post updated'); setEditPost(null); fetchPosts(); }
            else { const d = await res.json().catch(() => ({})); showMsg('error', d.error || 'Failed'); }
        } catch { showMsg('error', 'Network error'); }
        finally { setSaving(false); }
    };

    const getCategoryConfig = (cat: string) => CATEGORIES.find(c => c.value === cat) || CATEGORIES[4];

    const uploadImage = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) { showMsg('error', 'Image must be less than 5MB'); return; }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            showMsg('error', 'Only JPG, PNG, WebP, GIF allowed'); return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await secureFetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const { url } = await res.json();
                setEditForm(prev => ({ ...prev, imageUrl: url }));
            } else { showMsg('error', 'Upload failed'); }
        } catch { showMsg('error', 'Upload error'); }
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

    const getStatusInfo = (post: Post) => {
        if (post.published) return { label: 'Published', color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: '🟢' };
        if (post.approvalStatus === 'pending') return { label: 'Pending', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: '🟡' };
        if (post.approvalStatus === 'rejected') return { label: 'Rejected', color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: '🔴' };
        if (post.approvalStatus === 'approved') return { label: 'Approved', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: '🔵' };
        return { label: 'Draft', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', icon: '⚪' };
    };

    const filteredPosts = posts.filter(p => {
        const matchFilter = filter === "all" || filter === "published" && p.published || filter === "draft" && !p.published && p.approvalStatus !== "pending" || filter === "pending" && p.approvalStatus === "pending" || p.category === filter;
        const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.author?.toLowerCase().includes(search.toLowerCase());
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
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white">📝 Posts</h1>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                        {posts.length} total · {posts.filter(p => p.published).length} published · {posts.filter(p => p.approvalStatus === 'pending').length} pending
                    </p>
                </div>
                <Link href="/admin/posts/new"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#00A8E8]/20 hover:scale-[1.03] transition-all">
                    ✏️ New Post
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
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] text-sm" />
                </div>
                <select value={filter} onChange={e => setFilter(e.target.value)} title="Filter posts"
                    className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#007EA7] min-w-[140px]">
                    <option value="all">All Posts ({posts.length})</option>
                    <option value="published">🟢 Published ({posts.filter(p => p.published).length})</option>
                    <option value="draft">⚪ Drafts</option>
                    <option value="pending">🟡 Pending ({posts.filter(p => p.approvalStatus === 'pending').length})</option>
                    {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                    ))}
                </select>
            </div>

            {/* Posts Grid */}
            {filteredPosts.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-10 text-center">
                    <span className="text-4xl block mb-3">📝</span>
                    <p className="text-slate-500">{search ? `No posts matching "${search}"` : "No posts found"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredPosts.map((post, i) => {
                        const catConfig = getCategoryConfig(post.category);
                        const statusInfo = getStatusInfo(post);
                        return (
                            <motion.div key={post._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-xl overflow-hidden hover:bg-white/[0.05] transition-all">
                                {/* Image thumbnail */}
                                {post.imageUrl && (
                                    <div className="h-32 bg-white/[0.02] border-b border-white/[0.04] overflow-hidden">
                                        <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-4">
                                    {/* Title + badges */}
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold text-sm truncate">{post.title}</h3>
                                            {post.titleKu && <p className="text-slate-500 text-xs truncate mt-0.5" dir="rtl">{post.titleKu}</p>}
                                        </div>
                                    </div>

                                    {/* Meta badges */}
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${catConfig.color}`}>
                                            {catConfig.icon} {catConfig.label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${statusInfo.color}`}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </div>

                                    {/* Author & Date */}
                                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3">
                                        <span>👤 {post.author}</span>
                                        <span>·</span>
                                        <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/[0.04]">
                                        <button onClick={() => openEdit(post)}
                                            className="flex-1 min-w-[50px] px-2 py-1.5 rounded-lg text-[11px] font-medium bg-[#007EA7]/10 text-[#00A8E8] hover:bg-[#007EA7]/20 transition-all">
                                            ✏️ Edit
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => togglePublish(post._id, post.published)}
                                                className={`flex-1 min-w-[50px] px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${post.published ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}>
                                                {post.published ? '📤 Unpublish' : '📥 Publish'}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button onClick={() => deletePost(post._id)}
                                                className="px-2 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {editPost && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setEditPost(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#001a24] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                                <h2 className="text-white font-bold text-lg">✏️ Edit Post</h2>
                                <button onClick={() => setEditPost(null)} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all">✕</button>
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
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                                    <input
                                        value={langTab === 'en' ? editForm.title || '' : langTab === 'ku' ? editForm.titleKu || '' : editForm.titleAr || ''}
                                        onChange={e => setEditForm(prev => ({
                                            ...prev,
                                            ...(langTab === 'en' ? { title: e.target.value } : langTab === 'ku' ? { titleKu: e.target.value } : { titleAr: e.target.value })
                                        }))}
                                        dir={langTab === 'ar' || langTab === 'ku' ? 'rtl' : 'ltr'}
                                        placeholder="Post title" className={inputClass} />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Content</label>
                                    <textarea rows={6}
                                        value={langTab === 'en' ? editForm.content || '' : langTab === 'ku' ? editForm.contentKu || '' : editForm.contentAr || ''}
                                        onChange={e => setEditForm(prev => ({
                                            ...prev,
                                            ...(langTab === 'en' ? { content: e.target.value } : langTab === 'ku' ? { contentKu: e.target.value } : { contentAr: e.target.value })
                                        }))}
                                        dir={langTab === 'ar' || langTab === 'ku' ? 'rtl' : 'ltr'}
                                        placeholder="Post content..." className={inputClass + " resize-none"} />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORIES.map(c => (
                                            <button key={c.value} onClick={() => setEditForm(prev => ({ ...prev, category: c.value }))}
                                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${editForm.category === c.value ? c.color + ' border-current' : 'bg-white/[0.02] text-slate-500 border-white/[0.06]'}`}>
                                                {c.icon} {c.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Upload - Drag & Drop */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Post Image</label>
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
                                                    ✕ Remove
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
                                                    <p className="text-slate-400 text-xs">Drag & drop an image, or click to browse</p>
                                                    <p className="text-slate-600 text-[10px] mt-1">JPG, PNG, WebP, GIF · Max 5MB</p>
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
