"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Ensure the react-i18next plugin is attached synchronously so that
// components calling useTranslation don't throw the "need to pass an i18next instance" warning.
// 'initReactI18next' has a complex type; silence strict type check for this plugin attach.
i18n.use(initReactI18next);

// Provide a synchronous minimal init so that `useTranslation` can be used
// before async resource fetching completes. We set a very small in-memory
// resource for the default namespace to avoid warnings; real resources are
// added/updated by `initI18n`.
try {
  // If not already initialized, initialize synchronously with empty resources.
  if (!i18n.isInitialized) {
    i18n.init({
      lng: 'pt',
      fallbackLng: 'pt',
      resources: { pt: { common: {} } },
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false },
    });
  }
} catch {
  // ignore init errors here; the async loader will retry
}

export async function initI18n(locale = 'pt') {
  try {
    const res = await fetch(`/locales/${locale}/common.json`);
    const common = await res.json();

    // replace or add the common namespace for the locale
    try {
      if (i18n.hasResourceBundle(locale, 'common')) {
        i18n.removeResourceBundle(locale, 'common');
      }
    } catch {
      // ignore
    }
    i18n.addResourceBundle(locale, 'common', common, true, true);
  await i18n.changeLanguage(locale);
  } catch {
    console.error('i18n init error')
  }

  return i18n;
}
