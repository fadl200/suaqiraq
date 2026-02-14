// ScreenshotWarning Component - Transparent warning message above buy buttons

import { useTranslation } from 'react-i18next';

export function ScreenshotWarning() {
    const { t } = useTranslation();

    return (
        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
                <span className="text-lg">📸</span>
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    {t('common.screenshotWarning')}
                </p>
            </div>
        </div>
    );
}
