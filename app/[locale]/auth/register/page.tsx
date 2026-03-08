"use client";

import secureFetch from '@/lib/secureFetch';
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
    const t = useTranslations("Auth");
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        department: "",
        password: "",
        confirmPassword: "",
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError(t("photoHint"));
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setError(t("photoHint"));
            return;
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError(t("passwordsDoNotMatch"));
            setIsLoading(false);
            return;
        }

        try {
            // Upload avatar first if selected
            let avatarUrl = "";
            if (avatarFile) {
                const avatarFormData = new FormData();
                avatarFormData.append("file", avatarFile);
                const uploadRes = await secureFetch("/api/upload/avatar", { method: "POST", body: avatarFormData });
                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    avatarUrl = uploadData.url;
                }
            }

            const response = await secureFetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    department: formData.department,
                    password: formData.password,
                    avatar: avatarUrl,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to register");
                setIsLoading(false);
                return;
            }

            // Auto sign in after successful registration
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                router.push("/auth/login?registered=true");
            } else {
                router.push("/");
                router.refresh();
            }
        } catch (error) {
            setError("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-nicer-dark flex items-center justify-center p-6 relative overflow-hidden font-[family-name:var(--font-geist-sans)] py-12">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-nicer-blue rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-nicer-blue-dark rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

            <div className="w-full max-w-lg relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight hover:scale-105 transition-transform mb-4">
                        NICER Connect
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">{t("registerTitle")}</h1>
                    <p className="text-slate-400">{t("registerSubtitle")}</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 rounded-full bg-slate-950 border-2 border-dashed border-slate-700 hover:border-nicer-blue flex items-center justify-center cursor-pointer overflow-hidden transition-all group relative"
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center">
                                        <span className="text-2xl block">📷</span>
                                        <span className="text-[10px] text-slate-500 group-hover:text-slate-300 transition-colors">{t("addPhoto")}</span>
                                    </div>
                                )}
                                {avatarPreview && (
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs font-medium">{t("changePhoto")}</span>
                                    </div>
                                )}
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                            <p className="text-xs text-slate-500">{t("photoHint")}</p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="reg-name" className="text-sm font-medium text-slate-300">{t("nameLabel")}</label>
                            <input
                                id="reg-name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label htmlFor="reg-email" className="text-sm font-medium text-slate-300">{t("emailLabel")}</label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                    placeholder="student@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="reg-department" className="text-sm font-medium text-slate-300">{t("departmentLabel")}</label>
                                <input
                                    id="reg-department"
                                    type="text"
                                    required
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                    placeholder="Computer Science"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label htmlFor="reg-password" className="text-sm font-medium text-slate-300">{t("passwordLabel")}</label>
                                <input
                                    id="reg-password"
                                    type="password"
                                    required
                                    minLength={8}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="reg-confirm-password" className="text-sm font-medium text-slate-300">{t("confirmPasswordLabel")}</label>
                                <input
                                    id="reg-confirm-password"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,168,232,0.4)] transition-all disabled:opacity-70 disabled:hover:shadow-none mt-4"
                        >
                            {isLoading ? "..." : t("registerButton")}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 mt-8 text-sm">
                        {t("hasAccount")}{" "}
                        <Link href="/auth/login" className="text-nicer-blue-light hover:text-white transition-colors font-medium">
                            {t("loginLink")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
