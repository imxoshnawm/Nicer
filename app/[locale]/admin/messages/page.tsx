"use client";

import secureFetch from '@/lib/secureFetch';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    read: boolean;
    createdAt: string;
}

export default function AdminMessagesPage() {
    const { data: session } = useSession();
    const role = (session?.user as any)?.role || "";
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Message | null>(null);
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        if (role && role !== "admin") router.push("/admin");
    }, [role, router]);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await secureFetch("/api/contact");
            if (res.ok) setMessages(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredMessages =
        filter === "all" ? messages
        : filter === "unread" ? messages.filter((m) => !m.read)
        : messages.filter((m) => m.read);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl md:text-3xl font-black text-white">Messages</h1>
                <p className="text-slate-400 text-sm mt-1">{messages.filter((m) => !m.read).length} unread of {messages.length} total</p>
            </motion.div>

            {/* Filters */}
            <div className="flex gap-2">
                {[
                    { key: "all", label: `All (${messages.length})` },
                    { key: "unread", label: `Unread (${messages.filter((m) => !m.read).length})` },
                    { key: "read", label: `Read (${messages.filter((m) => m.read).length})` },
                ].map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            filter === f.key
                                ? "bg-[#007EA7]/20 text-[#00A8E8] border border-[#007EA7]/30"
                                : "bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:text-white"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Messages List */}
                <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                    {filteredMessages.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 text-sm">No messages found</div>
                    ) : (
                        filteredMessages.map((msg, i) => (
                            <motion.button
                                key={msg._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => setSelected(msg)}
                                className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    selected?._id === msg._id
                                        ? "bg-[#007EA7]/10 border-[#007EA7]/30"
                                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={`text-sm font-medium truncate ${!msg.read ? "text-white" : "text-slate-400"}`}>{msg.name}</span>
                                    {!msg.read && <span className="w-2 h-2 rounded-full bg-[#00A8E8] shrink-0 ml-2"></span>}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{msg.subject}</p>
                                <p className="text-xs text-slate-600 mt-0.5">{new Date(msg.createdAt).toLocaleDateString()}</p>
                            </motion.button>
                        ))
                    )}
                </div>

                {/* Message Detail */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selected ? (
                            <motion.div
                                key={selected._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 md:p-7"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{selected.subject}</h2>
                                        <p className="text-slate-400 text-sm mt-1">From: {selected.name} ({selected.email})</p>
                                    </div>
                                    <span className="text-slate-500 text-xs shrink-0">{new Date(selected.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="h-px bg-white/[0.06] mb-5"></div>
                                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                                <div className="mt-6">
                                    <a
                                        href={`mailto:${selected.email}?subject=Re: ${selected.subject}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#007EA7] to-[#00A8E8] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-[#00A8E8]/20 transition-all"
                                    >
                                        ✉️ Reply via Email
                                    </a>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-10 text-center"
                            >
                                <span className="text-4xl mb-3 block">✉️</span>
                                <p className="text-slate-500 text-sm">Select a message to read</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
