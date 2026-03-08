"use client";

import secureFetch from '@/lib/secureFetch';
import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    FadeInRight,
    ScaleIn,
    StaggerContainer,
    StaggerItem,
    TiltCard,
    GlowButton,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

export default function ContactPage() {
    const t = useTranslations("ContactPage");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");

        try {
            const response = await secureFetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setFormData({ name: "", email: "", subject: "", message: "" });
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
                setErrorMessage(data.error || "Failed to send message");
            }
        } catch (error) {
            setStatus("error");
            setErrorMessage("An unexpected error occurred");
        }
    };

    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="contact" />

            {/* Header */}
            <header className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
                <FadeInDown>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight">
                        {t("title")}
                    </h1>
                </FadeInDown>
                <FadeInUp delay={0.2}>
                    <p className="text-xl text-slate-400 mt-4 max-w-2xl mx-auto">
                        {t("subtitle")}
                    </p>
                </FadeInUp>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-px w-full max-w-sm mx-auto bg-gradient-to-r from-transparent via-nicer-blue to-transparent mt-8 opacity-50"
                />
            </header>

            <main className="max-w-6xl mx-auto px-6 mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Contact Info Sidebar */}
                    <StaggerContainer className="space-y-6">
                        {[
                            { icon: "📞", label: t("phone"), value: "+964 750 71 86 190", isLink: false },
                            { icon: "✉️", label: t("email"), value: "nicer.club@gmail.com", isLink: true, href: "mailto:nicer.club@gmail.com" },
                            { icon: "📍", label: t("address"), value: t("addressValue"), isLink: false },
                        ].map((item, i) => (
                            <StaggerItem key={i}>
                                <TiltCard>
                                    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-start gap-4 hover:border-nicer-blue/30 transition-colors"
                                        style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.2, rotate: 10 }}
                                            className="w-12 h-12 bg-nicer-blue/20 text-nicer-blue-light rounded-xl flex items-center justify-center text-2xl shrink-0"
                                        >
                                            {item.icon}
                                        </motion.div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{item.label}</h3>
                                            {item.isLink ? (
                                                <a href={item.href} className="text-lg font-medium text-white hover:text-nicer-blue-light transition-colors">
                                                    {item.value}
                                                </a>
                                            ) : (
                                                <p className="text-lg font-medium text-white leading-relaxed">{item.value}</p>
                                            )}
                                        </div>
                                    </div>
                                </TiltCard>
                            </StaggerItem>
                        ))}

                        {/* Social Links */}
                        <FadeInUp delay={0.5}>
                            <div className="pt-6 border-t border-white/10">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">{t("followUs")}</h3>
                                <div className="flex gap-4">
                                    {[
                                        { name: "Facebook", icon: "f", url: "#" },
                                        { name: "Instagram", icon: "ig", url: "#" },
                                        { name: "YouTube", icon: "yt", url: "#" },
                                        { name: "TikTok", icon: "tt", url: "#" },
                                    ].map((social, i) => (
                                        <motion.a
                                            key={social.name}
                                            href={social.url}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 + i * 0.1 }}
                                            whileHover={{ scale: 1.15, y: -4 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="w-12 h-12 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-nicer-blue hover:border-nicer-blue text-white transition-colors"
                                        >
                                            <span className="font-bold text-sm">{social.icon}</span>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        </FadeInUp>
                    </StaggerContainer>

                    {/* Contact Form */}
                    <FadeInRight className="lg:col-span-2">
                        <TiltCard>
                            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 relative overflow-hidden"
                                style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-nicer-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                <h2 className="text-3xl font-black mb-8">{t("sendMessage")}</h2>

                                {status === "success" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3 backdrop-blur-sm"
                                    >
                                        <span>✅</span> {t("successMessage")}
                                    </motion.div>
                                )}

                                {status === "error" && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 backdrop-blur-sm"
                                    >
                                        <span>❌</span> {errorMessage}
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="contact-name" className="text-sm font-medium text-slate-400">{t("namePlaceholder").replace("...", "")}</label>
                                            <input
                                                id="contact-name"
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all backdrop-blur-sm placeholder:text-slate-600"
                                                placeholder={t("namePlaceholder")}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="contact-email" className="text-sm font-medium text-slate-400">{t("emailPlaceholder").replace("...", "")}</label>
                                            <input
                                                id="contact-email"
                                                required
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all backdrop-blur-sm placeholder:text-slate-600"
                                                placeholder={t("emailPlaceholder")}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="contact-subject" className="text-sm font-medium text-slate-400">{t("subjectPlaceholder")}</label>
                                        <input
                                            id="contact-subject"
                                            required
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all backdrop-blur-sm placeholder:text-slate-600"
                                            placeholder={t("subjectPlaceholder")}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="contact-message" className="text-sm font-medium text-slate-400">{t("messagePlaceholder").replace("...", "")}</label>
                                        <textarea
                                            id="contact-message"
                                            required
                                            rows={5}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-nicer-blue focus:ring-1 focus:ring-nicer-blue transition-all resize-none backdrop-blur-sm placeholder:text-slate-600"
                                            placeholder={t("messagePlaceholder")}
                                        ></textarea>
                                    </div>

                                    <GlowButton className="w-full sm:w-auto">
                                        <button
                                            type="submit"
                                            disabled={status === "loading"}
                                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-nicer-blue to-nicer-blue-light text-white font-bold rounded-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                                        >
                                            {status === "loading" && (
                                                <motion.span
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="inline-block"
                                                >⏳</motion.span>
                                            )}
                                            {status === "loading" ? t("sending") : t("sendButton")}
                                        </button>
                                    </GlowButton>
                                </form>
                            </div>
                        </TiltCard>
                    </FadeInRight>
                </div>
            </main>
        </div>
    );
}
