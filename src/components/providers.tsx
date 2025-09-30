'use client';

import { useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/contexts/cart-context';
import { initI18n } from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    // initI18n returns an i18next instance; use a conservative typing
    const [i18nInstance, setI18nInstance] = useState<import('i18next').i18n | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Determine locale from query param (?lang=), then persisted storage
        let locale = 'pt';
        try {
            if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                const qLang = url.searchParams.get('lang');
                if (qLang) {
                    locale = qLang;
                    // persist chosen locale
                    try {
                        localStorage.setItem('NEXT_LOCALE', locale);
                    } catch { }
                    setCookie('NEXT_LOCALE', locale, 365);
                    // remove lang param to keep clean URL
                    url.searchParams.delete('lang');
                    // also add a timestamp to force a reload cache-bypass when needed
                    window.history.replaceState({}, '', url.toString());
                } else {
                    locale = localStorage.getItem('NEXT_LOCALE') || localStorage.getItem('locale') || getCookie('NEXT_LOCALE') || 'pt';
                }
            }
        } catch {
            // ignore and fallback to default
        }

        (async () => {
            const i = await initI18n(locale);
            setI18nInstance(i);
            setLoading(false);
        })();
    }, []);

    function getCookie(name: string) {
        if (typeof document === 'undefined') return undefined;
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : undefined;
    }

    function setCookie(name: string, value: string, days = 365) {
        if (typeof document === 'undefined') return;
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    const content = (
        <SessionProvider>
            <CartProvider>
                {children}
            </CartProvider>
        </SessionProvider>
    );

    if (loading || !i18nInstance) {
        // Don't render children until translations are ready to avoid flashing keys.
        // Render a minimal inline placeholder to keep layout stable.
        return (
            <div aria-busy="true" className="min-h-[64px] bg-transparent" />
        );
    }

    return (
        <I18nextProvider i18n={i18nInstance}>
            {content}
        </I18nextProvider>
    );
}

export default Providers;