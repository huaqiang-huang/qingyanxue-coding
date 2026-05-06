import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';

const PROJECT_URL = 'https://github.com/huaqiang-huang/qingyanxue-coding';
const RELEASES_URL = `${PROJECT_URL}/releases`;
const ISSUES_URL = `${PROJECT_URL}/issues`;

export function SettingsGeneral() {
  const { i18n, t } = useTranslation();
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const currentLang = i18n.language.startsWith('zh') ? 'zh' : 'en';
  const [appVer, setAppVer] = useState('');
  useEffect(() => {
    try {
      const v = window.electronAPI?.getVersion?.();
      if (v instanceof Promise) v.then(setAppVer);
      else if (v) setAppVer(v);
    } catch {
      /* ignore */
    }
  }, []);

  const languages = [
    { code: 'en', nativeName: 'English' },
    { code: 'zh', nativeName: '中文' },
  ];

  const themeOptions = [
    { value: 'light' as const, label: t('general.themeLight') },
    { value: 'dark' as const, label: t('general.themeDark') },
    { value: 'system' as const, label: t('general.themeSystem', 'System') },
  ];

  const openExternal = (url: string) => {
    try {
      if (window.electronAPI?.openExternal) {
        void window.electronAPI.openExternal(url);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">{t('general.appearance')}</h4>
        <div className="flex gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSettings({ theme: opt.value })}
              className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                settings.theme === opt.value
                  ? 'border-accent bg-accent/5 text-text-primary'
                  : 'border-border bg-surface hover:border-accent/50 text-text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-text-primary">{t('general.language')}</h4>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                currentLang === lang.code
                  ? 'border-accent bg-accent/5 text-text-primary'
                  : 'border-border bg-surface hover:border-accent/50 text-text-secondary'
              }`}
            >
              {lang.nativeName}
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      {appVer && (
        <div className="pt-4 border-t border-border space-y-3">
          <p className="text-xs text-text-muted">清砚雪Coding v{appVer}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => openExternal(PROJECT_URL)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-accent/50 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              GitHub
            </button>
            <button
              onClick={() => openExternal(RELEASES_URL)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-accent/50 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Releases
            </button>
            <button
              onClick={() => openExternal(ISSUES_URL)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface hover:border-accent/50 text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              Issues
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
