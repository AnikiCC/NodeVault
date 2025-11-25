import { useEffect, useState } from "preact/hooks";

export default function ThemeSwitcher() {
  // Состояния для темы и монтирования компонента
  const [isDark, setIsDark] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Получаем текущую тему из DOM при монтировании
    const currentTheme = document.documentElement.classList.contains('dark-theme');
    setIsDark(currentTheme);
    setIsMounted(true);

    // Слушаем изменения темы из других вкладок
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme" && e.newValue) {
        const newTheme = e.newValue === "dark";
        setIsDark(newTheme);
      }
    };

    // Добавляем слушатель событий storage
    globalThis.addEventListener('storage', handleStorageChange);
    
    // Очистка слушателя при размонтировании
    return () => globalThis.removeEventListener('storage', handleStorageChange);
  }, []);

  // Функция переключения темы
  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Применяем новую тему к DOM
    const html = document.documentElement;
    html.classList.remove('dark-theme', 'light-theme');
    html.classList.add(newTheme ? 'dark-theme' : 'light-theme');
    html.setAttribute('data-theme', newTheme ? 'dark' : 'light');
    
    // Сохраняем тему в localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Триггерим событие для синхронизации между вкладками
    globalThis.dispatchEvent(new StorageEvent('storage', {
      key: 'theme',
      newValue: newTheme ? 'dark' : 'light'
    }));
  };

  // Рендер плейсхолдера до монтирования (избегаем гидратации)
  if (!isMounted) {
    return (
      <button 
        type="button" 
        class="theme-switcher-btn opacity-0" 
        aria-hidden="true"
      >
        {/* Иконка солнца (светлая тема) */}
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      </button>
    );
  }

  // Основной рендер после монтирования
  return (
    <button
      type="button"
      onClick={toggleTheme}
      class="theme-switcher-btn"
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        // Иконка солнца для темной темы (предлагает переключить на светлую)
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      ) : (
        // Иконка луны для светлой темы (предлагает переключить на темную)
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
        </svg>
      )}
    </button>
  );
}