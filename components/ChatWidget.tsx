"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";

interface ChatMessage {
    role: "user" | "bot";
    text: string;
}

function MessageContent({ text }: { text: string }) {
    // Convert markdown links [text](url) and raw URLs to clickable elements
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
        }
        const linkText = match[1] || match[3];
        const linkUrl = match[2] || match[3];
        parts.push(
            <a key={key++} href={linkUrl} target="_blank" rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300 transition-colors break-all">
                {linkText}
            </a>
        );
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
        parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }
    return <>{parts}</>;
}

export default function ChatWidget() {
    const t = useTranslations("ChatWidget");
    const locale = useLocale();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "bot", text: t("greeting") },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hide on admin pages
    const isAdminPage = pathname.includes("/admin");

    const quickReplies = [
        t("quickWhatIs"),
        t("quickActivities"),
        t("quickJoin"),
        t("quickContact"),
    ];

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMsg = text.trim();
        setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
        setInput("");
        setIsLoading(true);

        // Build history for API (skip the initial greeting)
        const history = messages.slice(1).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            text: m.text,
        }));

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg, history, locale }),
            });

            if (!res.ok) throw new Error("API error");

            const data = await res.json();
            setMessages((prev) => [
                ...prev,
                { role: "bot", text: data.reply || t("defaultResponse") },
            ]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "bot", text: t("defaultResponse") },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => sendMessage(input);
    const handleQuickReply = (text: string) => sendMessage(text);

    if (isAdminPage) return null;

    return (
        <>
            {/* Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-tr from-nicer-blue to-nicer-blue-light shadow-[0_0_25px_rgba(0,168,232,0.5)] flex items-center justify-center hover:scale-110 transition-all"
            >
                <span className="text-2xl">{isOpen ? "✕" : "🤖"}</span>
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[380px] max-h-[520px] bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-nicer-blue-dark to-nicer-blue p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">{t("botName")}</h3>
                            <p className="text-blue-200 text-xs">{t("botSubtitle")}</p>
                        </div>
                        <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[320px]">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                                        msg.role === "user"
                                            ? "bg-nicer-blue text-white rounded-br-md"
                                            : "bg-slate-800 text-slate-200 rounded-bl-md"
                                    }`}
                                >
                                    <MessageContent text={msg.text} />
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                    <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Replies - only show at start */}
                    {messages.length <= 2 && !isLoading && (
                        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                            {quickReplies.map((qr) => (
                                <button
                                    key={qr}
                                    onClick={() => handleQuickReply(qr)}
                                    className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-300 text-xs hover:bg-nicer-blue/20 hover:text-nicer-blue-light hover:border-nicer-blue/30 transition-all"
                                >
                                    {qr}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t border-slate-700/50 flex gap-2">
                        <label htmlFor="chat-input" className="sr-only">{t("placeholder")}</label>
                        <input
                            id="chat-input"
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                            placeholder={t("placeholder")}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-nicer-blue disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="px-4 py-2 bg-gradient-to-r from-nicer-blue to-nicer-blue-light rounded-xl text-white text-sm font-medium hover:shadow-[0_0_10px_rgba(0,168,232,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("send")}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
