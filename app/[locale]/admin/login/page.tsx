"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError(result.error.includes("locked") ? result.error : "Invalid email or password");
            setLoading(false);
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#007EA7] focus:border-transparent transition-all text-sm";

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#00171F] p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#003459] to-[#00A8E8] shadow-lg shadow-[#00A8E8]/20 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-black text-white">NC</span>
                    </div>
                    <h1 className="text-2xl font-black text-white">Admin Login</h1>
                    <p className="text-slate-500 text-sm mt-1">NICER Club Dashboard</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nicer.club@gmail.com"
                            className={inputClass}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={inputClass}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00A8E8]/20 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
