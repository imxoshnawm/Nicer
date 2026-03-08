"use client";

import secureFetch from '@/lib/secureFetch';
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

export default function NewActivityPage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [langTab, setLangTab] = useState<'en' | 'ku' | 'ar'>('en');
    const [form, setForm] = useState({
        title: "", titleKu: "", titleAr: "",
        description: "", descriptionKu: "", descriptionAr: "",
        date: "", location: "", status: "upcoming", imageUrl: "",
    });
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const uploadImage = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) { setError("Image must be less than 5MB"); return; }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
            setError("Only JPG, PNG, WebP, GIF images allowed"); return;
        }
        setUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            console.log('📤 [NEW] Starting upload for:', file.name, file.size);
            const res = await secureFetch("/api/upload", { method: "POST", body: formData });
            console.log('📤 [NEW] Upload response:', res.status, res.ok);
            if (res.ok) {
                const data = await res.json();
                console.log('📤 [NEW] Upload response data:', JSON.stringify(data));
                console.log('📤 [NEW] Setting imageUrl to:', data.url);
                setForm(prev => {
                    const newForm = { ...prev, imageUrl: data.url };
                    console.log('📤 [NEW] Form after setState:', JSON.stringify(newForm));
                    return newForm;
                });
            } else {
                const errBody = await res.text().catch(() => 'unknown');
                console.error('📤 [NEW] Upload FAILED:', res.status, errBody);
                setError("Failed to upload image: " + res.status);
            }
        } catch (err) {
            console.error('📤 [NEW] Upload ERROR:', err);
            setError("Upload error");
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        console.log('🔍 Submitting activity with data:', form);
        console.log('🖼️ ImageURL in form:', form.imageUrl);
        try {
            const res = await secureFetch("/api/activities", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                router.push("/admin/activities");
            } else {
                const data = await res.json();
                setError(data.error || "Failed to create activity");
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
                <h1 className="text-2xl md:text-3xl font-black text-white">🎯 New Activity</h1>
                <button onClick={() => router.push("/admin/activities")} className="px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-slate-300 rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">
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
                {/* Language Tabs */}
                <div className="flex gap-2 border-b border-white/[0.06] pb-4">
                    {(['en', 'ku', 'ar'] as const).map(l => (
                        <button key={l} type="button" onClick={() => setLangTab(l)}
                            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${langTab === l ? 'bg-[#007EA7]/20 text-[#00A8E8] border border-[#007EA7]/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white'}`}>
                            {l === 'en' ? '🇬🇧 English' : l === 'ku' ? '🇮🇶 کوردی' : '🇸🇦 العربية'}
                        </button>
                    ))}
                </div>

                {/* Title & Description based on tab */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Title ({langTab === 'en' ? 'English' : langTab === 'ku' ? 'Kurdish' : 'Arabic'})
                            {langTab === 'en' && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                            name={langTab === 'en' ? 'title' : langTab === 'ku' ? 'titleKu' : 'titleAr'}
                            value={langTab === 'en' ? form.title : langTab === 'ku' ? form.titleKu : form.titleAr}
                            onChange={handleChange}
                            placeholder={langTab === 'en' ? 'Activity title' : langTab === 'ku' ? 'ناونیشانی چالاکییەکە' : 'عنوان النشاط'}
                            className={inputClass}
                            dir={langTab !== 'en' ? 'rtl' : 'ltr'}
                            required={langTab === 'en'}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Description ({langTab === 'en' ? 'English' : langTab === 'ku' ? 'Kurdish' : 'Arabic'})
                            {langTab === 'en' && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <textarea
                            name={langTab === 'en' ? 'description' : langTab === 'ku' ? 'descriptionKu' : 'descriptionAr'}
                            value={langTab === 'en' ? form.description : langTab === 'ku' ? form.descriptionKu : form.descriptionAr}
                            onChange={handleChange}
                            placeholder={langTab === 'en' ? 'Describe the activity...' : langTab === 'ku' ? 'وەسفکردنی چالاکییەکە...' : 'وصف النشاط...'}
                            rows={4}
                            className={inputClass + " resize-none"}
                            dir={langTab !== 'en' ? 'rtl' : 'ltr'}
                            required={langTab === 'en'}
                        />
                    </div>
                </div>

                {/* Image Upload - Drag & Drop */}
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Activity Image (optional)</label>
                    {form.imageUrl ? (
                        <div className="relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/[0.08]">
                            <img src={form.imageUrl} alt="" className="w-full h-48 object-cover" />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button type="button" onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white rounded-lg text-xs hover:bg-black/80 transition-all">
                                    📷 Change
                                </button>
                                <button type="button" onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
                                    className="px-3 py-1.5 bg-red-500/60 backdrop-blur-sm text-white rounded-lg text-xs hover:bg-red-500/80 transition-all">
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
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                                dragOver ? 'border-[#00A8E8] bg-[#007EA7]/10' : 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                            }`}
                        >
                            {uploading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00A8E8]"></div>
                                    <p className="text-slate-400 text-sm">Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <span className="text-3xl block mb-2">🖼️</span>
                                    <p className="text-slate-400 text-sm">Drag & drop an image here, or click to browse</p>
                                    <p className="text-slate-600 text-xs mt-1">JPG, PNG, WebP, GIF · Max 5MB</p>
                                </>
                            )}
                        </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileSelect} />
                </div>

                {/* Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Date <span className="text-red-400">*</span></label>
                        <input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} required title="Activity date" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Location</label>
                        <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. University Hall" className={inputClass} />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                        <select name="status" value={form.status} onChange={handleChange} className={inputClass} title="Activity status">
                            <option value="upcoming">🔵 Upcoming</option>
                            <option value="ongoing">🟢 Ongoing</option>
                            <option value="completed">⚪ Completed</option>
                        </select>
                    </div>
                </div>

                {/* Translation progress */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
                    <p className="text-xs font-medium text-slate-400 mb-2">📝 Translation Progress</p>
                    <div className="flex gap-4 text-[11px]">
                        <span className={form.title ? 'text-green-400' : 'text-slate-600'}>🇬🇧 {form.title ? '✓' : '○'} English</span>
                        <span className={form.titleKu ? 'text-green-400' : 'text-slate-600'}>🇮🇶 {form.titleKu ? '✓' : '○'} Kurdish</span>
                        <span className={form.titleAr ? 'text-green-400' : 'text-slate-600'}>🇸🇦 {form.titleAr ? '✓' : '○'} Arabic</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving || uploading}
                    className="w-full py-3 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A8E8]/20 hover:scale-[1.01] transition-all disabled:opacity-50 text-sm"
                >
                    {saving ? "Creating..." : "🎯 Create Activity"}
                </button>
            </motion.form>
        </div>
    );
}
