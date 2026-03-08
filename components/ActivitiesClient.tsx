"use client";

import dynamic from "next/dynamic";
import {
    FadeInUp,
    FadeInDown,
    FadeInLeft,
    ScaleIn,
    StaggerContainer,
    StaggerItem,
    TiltCard,
    motion,
} from "@/components/MotionElements";

const Background3D = dynamic(() => import("@/components/Background3D"), {
    ssr: false,
    loading: () => <div className="fixed inset-0 -z-10 bg-nicer-dark" />,
});

interface ActivitiesClientProps {
    activities: any[];
    locale: string;
    translations: {
        title: string;
        subtitle: string;
        noActivities: string;
        upcoming: string;
        ongoing: string;
        completed: string;
    };
}

export default function ActivitiesClient({ activities, locale, translations: t }: ActivitiesClientProps) {
    return (
        <div className="font-[family-name:var(--font-geist-sans)] text-white min-h-screen pb-20 relative overflow-hidden">
            <Background3D variant="activities" />

            {/* Header */}
            <header className="py-16 sm:py-24 px-4 sm:px-6 text-center relative overflow-hidden">
                <FadeInDown>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-nicer-blue-light tracking-tight relative z-10">
                        {t.title}
                    </h1>
                </FadeInDown>
                <FadeInUp delay={0.2}>
                    <p className="text-xl text-slate-400 mt-4 max-w-2xl mx-auto relative z-10">
                        {t.subtitle}
                    </p>
                </FadeInUp>
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="h-px w-full max-w-sm mx-auto bg-gradient-to-r from-transparent via-nicer-blue to-transparent mt-8 opacity-50"
                />
            </header>

            <main className="max-w-5xl mx-auto px-6 mt-12 relative z-10">
                {activities.length === 0 ? (
                    <ScaleIn>
                        <div className="text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-3xl border border-white/10"
                            style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                        >
                            <motion.span
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl mb-4 block"
                            >📅</motion.span>
                            <h3 className="text-2xl font-bold text-white mb-2">{t.noActivities}</h3>
                        </div>
                    </ScaleIn>
                ) : (
                    <div className="space-y-16">
                        {/* Timeline */}
                        <div className="relative ml-4 md:ml-8 pl-8 md:pl-12 space-y-12">
                            {/* Animated timeline line */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "100%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="absolute left-0 top-0 w-0.5 bg-gradient-to-b from-nicer-blue via-nicer-blue-light to-transparent"
                            />

                            {activities.map((activity: any, index: number) => {
                                const title = locale === 'ku' ? (activity.titleKu || activity.title) : locale === 'ar' ? (activity.titleAr || activity.title) : activity.title;
                                const description = locale === 'ku' ? (activity.descriptionKu || activity.description || '') : locale === 'ar' ? (activity.descriptionAr || activity.description || '') : (activity.description || '');

                                let statusColor = "text-nicer-blue";
                                let statusBg = "bg-nicer-blue/20";
                                let statusBorder = "border-nicer-blue";
                                let icon = "📅";
                                let statusLabel = t.upcoming;

                                if (activity.status === "ongoing") {
                                    statusColor = "text-amber-400";
                                    statusBg = "bg-amber-400/20";
                                    statusBorder = "border-amber-400";
                                    icon = "🔥";
                                    statusLabel = t.ongoing;
                                } else if (activity.status === "completed") {
                                    statusColor = "text-emerald-400";
                                    statusBg = "bg-emerald-400/20";
                                    statusBorder = "border-emerald-400";
                                    icon = "✅";
                                    statusLabel = t.completed;
                                }

                                return (
                                    <FadeInLeft key={activity._id} delay={index * 0.15}>
                                        <div className="relative group">
                                            {/* Timeline Dot */}
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: index * 0.1, type: "spring" }}
                                                className={`absolute -left-[3.25rem] md:-left-[4.25rem] w-12 h-12 rounded-full border-4 border-nicer-dark ${statusBg} ${statusColor} flex items-center justify-center text-lg z-10`}
                                            >
                                                {icon}
                                            </motion.div>

                                            {/* Activity Card */}
                                            <TiltCard>
                                                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 hover:border-nicer-blue/30 transition-all duration-300"
                                                    style={{ boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.05)" }}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${statusBg} ${statusColor} ${statusBorder} border`}>
                                                                {statusLabel}
                                                            </span>
                                                            <span className="text-slate-400 font-medium">
                                                                {new Date(activity.date).toLocaleDateString(locale === "ku" || locale === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5 shrink-0">
                                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-xs">👤</div>
                                                            <span className="text-xs text-slate-400 font-medium truncate max-w-[100px]">{activity.organizer?.name || "NICER"}</span>
                                                        </div>
                                                    </div>

                                                    <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 group-hover:text-nicer-blue-light transition-colors">
                                                        {title}
                                                    </h2>

                                                    {activity.imageUrl && (
                                                        <div className="mb-6 rounded-2xl overflow-hidden border border-white/10">
                                                            <img src={activity.imageUrl} alt={title} className="w-full h-64 object-cover" />
                                                        </div>
                                                    )}

                                                    <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                                        {description}
                                                    </p>

                                                    <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5 text-sm">
                                                        {activity.location && (
                                                            <div className="flex items-center gap-2 text-slate-300">
                                                                <span className="text-lg">📍</span> {activity.location}
                                                            </div>
                                                        )}
                                                        {activity.maxParticipants > 0 && (
                                                            <div className="flex items-center gap-2 text-slate-300">
                                                                <span className="text-lg">👥</span> Max {activity.maxParticipants} participants
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TiltCard>
                                        </div>
                                    </FadeInLeft>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
