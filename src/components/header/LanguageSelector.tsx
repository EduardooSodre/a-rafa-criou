"use client"

import { useCallback, useEffect } from 'react'
import { initI18n } from '@/lib/i18n'
import i18n from 'i18next'
import { useTranslation } from 'react-i18next'

interface LanguageSelectorProps {
    selectedLanguage: string
    setSelectedLanguage: (language: string) => void
    isScrolled: boolean
}

// Map button labels to locale codes used in our locale files
const LOCALE_MAP: Record<string, string> = {
    Portuguese: 'pt',
    English: 'en',
    Spanish: 'es',
}

export function LanguageSelector({ selectedLanguage, setSelectedLanguage, isScrolled }: LanguageSelectorProps) {
    const { t } = useTranslation('common')

    useEffect(() => {
        // On mount, try to restore user locale from localStorage (support both keys)
        const stored = typeof window !== 'undefined' ? (localStorage.getItem('NEXT_LOCALE') || localStorage.getItem('locale')) : null
        if (stored) {
            initI18n(stored).then(() => {
                i18n.changeLanguage(stored).catch(() => { })
            })
            const label = Object.keys(LOCALE_MAP).find((k) => LOCALE_MAP[k] === stored)
            if (label) setSelectedLanguage(label)
        }
    }, [setSelectedLanguage])

    const changeLocale = useCallback(async (label: string) => {
        const locale = LOCALE_MAP[label] || 'pt'
        setSelectedLanguage(label)
        try {
            localStorage.setItem('locale', locale)
            localStorage.setItem('NEXT_LOCALE', locale)
        } catch { }

        try {
            document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`
        } catch { }

        // Try to apply client-side quickly
        try {
            initI18n(locale).catch(() => { })
            i18n.changeLanguage(locale).catch(() => { })
        } catch { }

        if (typeof window !== 'undefined') {
            try {
                // Ask server to set cookie so SSR sees it on next request
                await fetch('/api/set-locale', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ locale, redirectTo: window.location.pathname })
                })
            } catch {
                // If the POST fails or the cookie wasn't set, set cookie client-side as a fallback
                try {
                    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`
                } catch { }
            }

            // Include ?lang so Providers can pick it up immediately on client load
            const nextUrl = `${window.location.pathname}?lang=${locale}&_ts=${Date.now()}`
            // use replace to avoid cluttering history
            window.location.replace(nextUrl)
        }
    }, [setSelectedLanguage])

    return (
        <div className={`bg-[#FED466] transition-all duration-500 ease-in-out overflow-hidden ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
            <div className="container mx-auto px-2 sm:px-4 flex justify-center items-center py-2 sm:py-3">
                <span className="text-black font-medium mr-3 sm:mr-4 text-xs sm:text-sm">{t('selectLanguage', 'Selecione seu idioma')}</span>
                <div className="flex bg-white/30 rounded-full p-1 backdrop-blur-sm border border-white/20 shadow-sm">
                    <button
                        onClick={() => changeLocale('Portuguese')}
                        className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 min-w-[56px] sm:min-w-[64px] cursor-pointer ${selectedLanguage === 'Portuguese'
                            ? 'bg-white text-[#FD9555] shadow-sm'
                            : 'text-black hover:bg-white/40'
                            }`}
                    >
                        Portuguese
                    </button>
                    <button
                        onClick={() => changeLocale('Spanish')}
                        className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 min-w-[56px] sm:min-w-[64px] cursor-pointer ${selectedLanguage === 'Spanish'
                            ? 'bg-white text-[#FD9555] shadow-sm'
                            : 'text-black hover:bg-white/40'
                            }`}
                    >
                        Spanish
                    </button>
                    <button
                        onClick={() => changeLocale('English')}
                        className={`px-3 py-1 text-xs sm:text-sm font-medium rounded-full transition-all duration-200 min-w-[56px] sm:min-w-[64px] cursor-pointer ${selectedLanguage === 'English'
                            ? 'bg-white text-[#FD9555] shadow-sm'
                            : 'text-black hover:bg-white/40'
                            }`}
                    >
                        English
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LanguageSelector