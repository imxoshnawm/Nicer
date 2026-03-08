import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import ChatWidget from "@/components/ChatWidget";
import "../globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export const metadata = {
    title: "NICER Club",
    description: "Make Your Dreams Come True",
};

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages();
    const dir = locale === 'ar' || locale === 'ku' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir} className="dark">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-nicer-dark text-white`}>
                <AuthProvider>
                    <NextIntlClientProvider messages={messages}>
                        <Navbar />
                        <main className="min-h-screen relative">
                            {children}
                        </main>
                        <ChatWidget />
                    </NextIntlClientProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
