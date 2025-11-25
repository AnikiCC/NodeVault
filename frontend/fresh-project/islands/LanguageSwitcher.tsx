import { useState, useEffect } from "preact/hooks";
import { I18n, Language } from "@/utils/i18n.ts";

// Список поддерживаемых языков с флагами и названиями
const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

export default function LanguageSwitcher() {
  // Состояние открытия/закрытия выпадающего списка
  const [isOpen, setIsOpen] = useState(false);
  // Текущий выбранный язык
  const [currentLang, setCurrentLang] = useState<Language>(I18n.getCurrentLanguage());
  // Информация о текущем языке
  const currentLanguage = languages.find(l => l.code === currentLang);

  // Подписка на изменения языка в приложении
  useEffect(() => {
    const unsubscribe = I18n.onLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return unsubscribe;
  }, []);

  // Обработчик смены языка
  const handleLanguageChange = (lang: Language) => {
    I18n.setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div class="relative">
      {/* Кнопка переключателя языка */}
      <button 
        type="button"
        class="nav-tab"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Флаг текущего языка */}
        <span class="text-sm mr-2">{currentLanguage?.flag}</span>
        {/* Название текущего языка */}
        <span class="min-w-[60px] text-left">{currentLanguage?.name}</span>
        {/* Стрелка для индикации выпадающего списка */}
        <svg 
          class={`w-3 h-3 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      
      {/* Выпадающий список языков */}
      {isOpen && (
        <div class="absolute top-full left-0 mt-1 bg-secondary border border-accent-primary rounded-lg shadow-lg z-50 min-w-full">
          {languages.map((lang) => (
            <button
              type="button"
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              class={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-tertiary transition-colors ${
                currentLang === lang.code ? 'bg-tertiary' : ''
              }`}
            >
              {/* Флаг языка */}
              <span class="text-base flex-shrink-0">{lang.flag}</span>
              {/* Информация о языке */}
              <div class="flex-1 min-w-0">
                <div class="text-sm text-primary font-medium truncate">{lang.name}</div>
                <div class="text-xs text-comment">{lang.code.toUpperCase()}</div>
              </div>
              {/* Иконка выбора для текущего языка */}
              {currentLang === lang.code && (
                <svg class="w-3 h-3 text-accent-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}