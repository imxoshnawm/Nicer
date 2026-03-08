"use client";

import secureFetch from '@/lib/secureFetch';
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    ScaleIn,
    TiltCard,
    GlowButton,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    role: string;
    roles?: string[];
    memberId?: string;
    avatar?: string;
    bio?: string;
    department?: string;
    createdAt: string;
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations("ProfilePage");
    const locale = useLocale();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "password">("info");
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Profile form
    const [name, setName] = useState("");
    const [department, setDepartment] = useState("");
    const [bio, setBio] = useState("");

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Messages
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/login");
            return;
        }
        if (status === "authenticated") {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const res = await secureFetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setName(data.name || "");
                setDepartment(data.department || "");
                setBio(data.bio || "");
            }
        } catch {
            setErrorMsg(t("failedToLoad"));
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setErrorMsg(t("imageTooLarge"));
            return;
        }
        setUploadingAvatar(true);
        setErrorMsg("");
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await secureFetch("/api/upload/avatar", { method: "POST", body: formData });
            if (!uploadRes.ok) {
                setErrorMsg(t("failedToUpload"));
                return;
            }
            const { url } = await uploadRes.json();
            // Save avatar URL to profile
            const res = await secureFetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar: url }),
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setSuccessMsg(t("photoUpdated"));
                setTimeout(() => setSuccessMsg(""), 4000);
            } else {
                setErrorMsg(t("failedToSaveAvatar"));
            }
        } catch {
            setErrorMsg(t("unexpectedError"));
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            const res = await secureFetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, department, bio }),
            });

            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                setSuccessMsg(t("profileUpdated"));
                setTimeout(() => setSuccessMsg(""), 4000);
            } else {
                setErrorMsg(data.error || "Failed to update profile");
            }
        } catch {
            setErrorMsg(t("unexpectedError"));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        if (newPassword !== confirmPassword) {
            setErrorMsg(t("passwordsDoNotMatch"));
            setSaving(false);
            return;
        }

        try {
            const res = await secureFetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();
            if (res.ok) {
                setSuccessMsg(t("passwordChanged"));
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setSuccessMsg(""), 4000);
            } else {
                setErrorMsg(data.error || "Failed to change password");
            }
        } catch {
            setErrorMsg(t("unexpectedError"));
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-nicer-dark">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-10 h-10 border-2 border-nicer-blue-light border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!session || !profile) {
        return null;
    }

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="about" />

            {/* Header */}
            <header className="py-20 px-6 text-center relative overflow-hidden">
                <FadeInDown>
                    <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight">
                        {t("title")}
                    </h1>
                </FadeInDown>
                <FadeInUp delay={0.2}>
                    <p className="text-lg text-slate-400 mt-4">
                        {t("subtitle")}
                    </p>
                </FadeInUp>
            </header>

            <main className="max-w-4xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Card */}
                    <FadeInLeft>
                        <TiltCard>
                            <div
                                className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                            >
                                {/* Avatar */}
                                <div className="relative group mx-auto w-24 h-24 mb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", bounce: 0.4 }}
                                        className="w-24 h-24 rounded-full overflow-hidden"
                                        style={{ boxShadow: "0 0 40px rgba(0,168,232,0.3)" }}
                                    >
                                        {profile.avatar ? (
                                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-tr from-nicer-blue-dark to-nicer-blue-light flex items-center justify-center">
                                                <span className="text-4xl font-black text-white">
                                                    {profile.name?.charAt(0).toUpperCase() || "U"}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        disabled={uploadingAvatar}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-nicer-blue rounded-full flex items-center justify-center text-white text-xs shadow-lg hover:bg-nicer-blue-light transition-colors border-2 border-[#0a1628]"
                                    >
                                        {uploadingAvatar ? "⏳" : "📷"}
                                    </button>
                                    <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
                                </div>

                                <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                                <p className="text-slate-400 text-sm mt-1">{profile.email}</p>
                                {profile.memberId && (
                                    <div className="mt-2 bg-nicer-blue/10 border border-nicer-blue/20 px-3 py-1.5 rounded-xl inline-block">
                                        <p className="text-nicer-blue-light text-sm font-mono font-bold">
                                            🆔 {profile.memberId}
                                        </p>
                                    </div>
                                )}

                                {/* All Roles */}
                                <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                                    {(profile.roles || [profile.role]).map(r => (
                                        <span key={r} className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-nicer-blue/20 text-nicer-blue-light border-nicer-blue/30">
                                            {r.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>

                                {/* Bio */}
                                {profile.bio && (
                                    <p className="text-slate-400 text-xs mt-3 italic">&ldquo;{profile.bio}&rdquo;</p>
                                )}

                                {profile.department && (
                                    <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
                                        <span>🏫</span> {profile.department}
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-white/5 text-sm text-slate-500">
                                    {t("memberSince")} {new Date(profile.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-IQ' : locale === 'ku' ? 'ckb-IQ' : 'en-US', { year: "numeric", month: "long" })}
                                </div>
                            </div>
                        </TiltCard>
                    </FadeInLeft>

                    {/* Settings Panel */}
                    <FadeInRight className="lg:col-span-2">
                        <div
                            className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden"
                            style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                        >
                            {/* Tabs */}
                            <div className="flex border-b border-white/5">
                                {[
                                    { id: "info" as const, label: t("profileInfo"), icon: "👤" },
                                    { id: "password" as const, label: t("changePassword"), icon: "🔒" },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setErrorMsg(""); setSuccessMsg(""); }}
                                        className={`flex-1 py-4 px-6 text-sm font-medium transition-all relative ${
                                            activeTab === tab.id
                                                ? "text-nicer-blue-light"
                                                : "text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div
                                                layoutId="profileTab"
                                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-nicer-blue to-nicer-blue-light"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-8">
                                {/* Success/Error Messages */}
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3 text-sm"
                                    >
                                        <span>✅</span> {successMsg}
                                    </motion.div>
                                )}

                                {errorMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm"
                                    >
                                        <span>❌</span> {errorMsg}
                                    </motion.div>
                                )}

                                {/* Profile Info Form */}
                                {activeTab === "info" && (
                                    <motion.form
                                        key="info"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onSubmit={handleUpdateProfile}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("fullName")}</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all placeholder:text-slate-600"
                                                placeholder={t("fullNamePlaceholder")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("email")}</label>
                                            <input
                                                type="email"
                                                disabled
                                                value={profile.email}
                                                title="Email address (cannot be changed)"
                                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-slate-600">{t("emailCannotChange")}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("department")}</label>
                                            <input
                                                type="text"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all placeholder:text-slate-600"
                                                placeholder={t("departmentPlaceholder")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("bio")}</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                rows={3}
                                                maxLength={300}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all placeholder:text-slate-600 resize-none"
                                                placeholder={t("bioPlaceholder")}
                                            />
                                            <p className="text-xs text-slate-600 text-right">{bio.length}/300</p>
                                        </div>

                                        <GlowButton className="w-full sm:w-auto rounded-xl">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {saving ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                ) : (
                                                    t("saveChanges")
                                                )}
                                            </button>
                                        </GlowButton>
                                    </motion.form>
                                )}

                                {/* Password Change Form */}
                                {activeTab === "password" && (
                                    <motion.form
                                        key="password"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onSubmit={handleChangePassword}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("currentPassword")}</label>
                                            <input
                                                type="password"
                                                required
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all placeholder:text-slate-600"
                                                placeholder={t("currentPasswordPlaceholder")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("newPassword")}</label>
                                            <input
                                                type="password"
                                                required
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all placeholder:text-slate-600"
                                                placeholder={t("newPasswordPlaceholder")}
                                            />
                                            <p className="text-xs text-slate-600">{t("passwordHint")}</p>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-400">{t("confirmNewPassword")}</label>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all placeholder:text-slate-600"
                                                placeholder={t("confirmNewPasswordPlaceholder")}
                                            />
                                        </div>

                                        <GlowButton className="w-full sm:w-auto rounded-xl">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {saving ? (
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                ) : (
                                                    t("changePasswordButton")
                                                )}
                                            </button>
                                        </GlowButton>
                                    </motion.form>
                                )}
                            </div>
                        </div>
                    </FadeInRight>
                </div>
            </main>
        </div>
    );
}
