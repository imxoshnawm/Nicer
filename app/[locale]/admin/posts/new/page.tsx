"use client";

import secureFetch from '@/lib/secureFetch';
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Image from "next/image";

export default function NewPostPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const roles: string[] = (session?.user as any)?.roles || [(session?.user as any)?.role || 'member'];
    const isAdmin = roles.includes('admin');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [publishNow, setPublishNow] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [form, setForm] = useState({
        title: "", titleKu: "", titleAr: "",
        content: "", contentKu: "", contentAr: "",
        category: "tech", imageUrl: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate client-side
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File too large. Maximum size: 5MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await secureFetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setForm(prev => ({ ...prev, imageUrl: data.url }));
            } else {
                const data = await res.json().catch(() => ({}));
                setError(data.error || 'Failed to upload image');
                setImagePreview(null);
            }
        } catch {
            setError('Failed to upload image');
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setForm(prev => ({ ...prev, imageUrl: "" }));
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await secureFetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, publishNow: isAdmin && publishNow }),
            });
            if (res.ok) {
                router.push("/admin/posts");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to create post");
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:border-transparent transition-all text-sm";

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-black text-white">New Post</h1>
                <button onClick={() => router.push("/admin/posts")} className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">
                    ← Back
                </button>
            </motion.div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            <motion.form
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSubmit}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 md:p-7 space-y-6"
            >
                {/* English */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-white border-b border-white/[0.06] pb-2">🇬🇧 English</h2>
                    <input name="title" value={form.title} onChange={handleChange} placeholder="Post title" className={inputClass} required />
                    <textarea name="content" value={form.content} onChange={handleChange} placeholder="Write your content..." rows={4} className={inputClass} required />
                </div>

                {/* Kurdish */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-white border-b border-white/[0.06] pb-2">🇮🇶 کوردی</h2>
                    <input name="titleKu" value={form.titleKu} onChange={handleChange} placeholder="ناونیشان بە کوردی" className={inputClass} dir="rtl" />
                    <textarea name="contentKu" value={form.contentKu} onChange={handleChange} placeholder="ناوەڕۆکی پۆستەکە بە کوردی" rows={3} className={inputClass} dir="rtl" />
                </div>

                {/* Arabic */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-white border-b border-white/[0.06] pb-2">🇸🇦 العربية</h2>
                    <input name="titleAr" value={form.titleAr} onChange={handleChange} placeholder="العنوان بالعربية" className={inputClass} dir="rtl" />
                    <textarea name="contentAr" value={form.contentAr} onChange={handleChange} placeholder="المحتوى بالعربية" rows={3} className={inputClass} dir="rtl" />
                </div>

                {/* Settings */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                        <select name="category" value={form.category} onChange={handleChange} className={inputClass} title="Category">
                            <option value="tech">Technology</option>
                            <option value="science">Science</option>
                            <option value="sports">Sports</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Post Image</label>
                        
                        {/* Preview */}
                        {(imagePreview || form.imageUrl) && (
                            <div className="relative mb-3 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]">
                                <div className="relative w-full h-48">
                                    <Image
                                        src={imagePreview || form.imageUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 w-8 h-8 bg-red-500/80 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors text-sm font-bold"
                                >
                                    ✕
                                </button>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00A8E8]"></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upload Button */}
                        {!form.imageUrl && !imagePreview && (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-white/[0.1] rounded-xl p-8 text-center cursor-pointer hover:border-[#007EA7]/50 hover:bg-[#007EA7]/5 transition-all group"
                            >
                                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📷</div>
                                <p className="text-slate-400 text-sm font-medium">Click to upload image</p>
                                <p className="text-slate-600 text-xs mt-1">JPG, PNG, WebP, GIF, SVG — Max 5MB</p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Admin: Publish Immediately */}
                {isAdmin && (
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={publishNow}
                                onChange={(e) => setPublishNow(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-10 h-6 bg-white/[0.08] rounded-full peer-checked:bg-[#007EA7] transition-colors border border-white/10" />
                            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md peer-checked:translate-x-4 transition-transform" />
                        </div>
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            ⚡ Publish immediately (skip approval)
                        </span>
                    </label>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A8E8]/20 hover:scale-[1.01] transition-all disabled:opacity-50 text-sm"
                >
                    {saving ? "Creating..." : publishNow && isAdmin ? "Create & Publish" : "Create Post (Draft)"}
                </button>
            </motion.form>
        </div>
    );
}
