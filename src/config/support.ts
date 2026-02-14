import i18n from '../i18n';
import { openWhatsApp } from '../utils/whatsapp';

export const SUPPORT_WHATSAPP = '9647768416326';

function getLanguage(language?: 'ar' | 'en'): 'ar' | 'en' {
  if (language === 'ar' || language === 'en') return language;
  const l = i18n.language;
  return l?.startsWith('ar') ? 'ar' : 'en';
}

export function openSupportWhatsApp(language?: 'ar' | 'en'): void {
  const lang = getLanguage(language);
  const fallback =
    lang === 'ar'
      ? 'مرحباً، أحتاج مساعدة بخصوص تطبيق سوق العراق.'
      : 'Hello, I need help with the Souq Iraq app.';
  const message = i18n.t('support.message', { defaultValue: fallback });
  openWhatsApp(SUPPORT_WHATSAPP, message);
}

