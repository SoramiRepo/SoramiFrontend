import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import zh_cn from './locales/zh-cn.json';
import zh_tw from './locales/zh-tw.json';
import jp from './locales/jp.json';

const saved = localStorage.getItem('i18nextLng');
let nav = navigator.language.toLowerCase();

// pick one of our supported locales
let navLang = 'en';
if (nav.startsWith('zh-tw') || nav.startsWith('zh-hk')) navLang = 'tw';
else if (nav.startsWith('zh')) navLang = 'cn';
else if (nav.startsWith('jp')) navLang = 'jp';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en:    { translation: en    },
            cn: { translation: zh_cn },
            tw: { translation: zh_tw },
            jp: {translation: jp },
        },
        lng: saved || navLang,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
    });

export default i18n;
