"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LoginPage() {
    const t = useTranslations("Auth");
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
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
        <div className="min-h-screen bg-nicer-dark flex items-center justify-center p-6 relative overflow-hidden font-[family-name:var(--font-geist-sans)]">
            {/* Background elements */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-nicer-blue rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-nicer-blue-dark rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-block text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight hover:scale-105 transition-transform mb-4">
                        NICER Connect
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">{t("loginTitle")}</h1>
                    <p className="text-slate-400">{t("loginSubtitle")}</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="text-sm font-medium text-slate-300">{t("emailLabel")}</label>
                            <input
                                id="login-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                placeholder="student@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="login-password" className="text-sm font-medium text-slate-300">{t("passwordLabel")}</label>
                            <input
                                id="login-password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,168,232,0.4)] transition-all disabled:opacity-70 disabled:hover:shadow-none mt-2"
                        >
                            {isLoading ? "..." : t("signInButton")}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 mt-8 text-sm">
                        {t("noAccount")}{" "}
                        <Link href="/auth/register" className="text-nicer-blue-light hover:text-white transition-colors font-medium">
                            {t("registerLink")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
