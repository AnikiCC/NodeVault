import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import LanguageSwitcher from "@/islands/LanguageSwitcher.tsx";
import { I18n } from "@/utils/i18n.ts";
import ThemeSwitcher from "@/islands/ThemeSwitcher.tsx";

interface LayoutProps {
  children: ComponentChildren;
  currentPath?: string;
}

export default function Layout({ children, currentPath = "/" }: LayoutProps) {
  const [_, setCurrentLang] = useState(I18n.getCurrentLanguage());
  const t = I18n.getTranslations();

  useEffect(() => {
    const unsubscribe = I18n.onLanguageChange((lang) => {
      setCurrentLang(lang);
    });

    return unsubscribe;
  }, []);

  return (
    <div class="min-h-screen bg-primary flex flex-col">

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                // инициализация темы
                const savedTheme = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = savedTheme ? savedTheme : (systemPrefersDark ? 'dark' : 'light');
                
                const html = document.documentElement;
                html.style.transition = 'none';
                html.classList.add(theme + '-theme');
                html.setAttribute('data-theme', theme);
                
                setTimeout(() => {
                  html.style.transition = '';
                }, 10);

                // Инициализация языка
                const savedLang = localStorage.getItem('nodevault_language');
                const browserLang = navigator.language.split('-')[0];
                const supportedLangs = ['en', 'ru', 'es', 'fr', 'de', 'zh'];
                const lang = supportedLangs.includes(savedLang) ? savedLang : 
                            supportedLangs.includes(browserLang) ? browserLang : 'en';
                
                document.documentElement.setAttribute('lang', lang);
                
                // Слушаем изменения
                window.addEventListener('storage', function(e) {
                  if (e.key === 'theme' && e.newValue) {
                    const html = document.documentElement;
                    html.classList.remove('dark-theme', 'light-theme');
                    html.classList.add(e.newValue + '-theme');
                    html.setAttribute('data-theme', e.newValue);
                  }
                  if (e.key === 'nodevault_language' && e.newValue) {
                    document.documentElement.setAttribute('lang', e.newValue);
                    window.location.reload();
                  }
                });
              } catch (e) {
                console.log('Theme/Lang init error:', e);
              }
            })();
          `
        }}
      />
      
      {/* Navigation */}
      <nav class="navbar">
        <div class="max-w-7xl mx-auto w-full">
          <div class="flex items-center justify-between h-16">
            {/* Brand */}
            <div class="flex items-center">
              <div class="flex flex-col">
                <span class="text-xl font-bold text-secondary">NodeVault</span>
                <span class="text-xs text-comment">v1.0.0</span>
              </div>
            </div>
            <div class="flex items-center space-x-2 ml-auto">
              {/* Navigation tabs */}
              <div class="flex items-center space-x-2">
                <a 
                  href="/" 
                  class={`nav-tab ${currentPath === "/" ? "nav-tab-active" : ""}`}
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                  </svg>
                  {t.common.home}
                </a>
                <a 
                  href="/upload" 
                  class={`nav-tab ${currentPath === "/upload" ? "nav-tab-active" : ""}`}
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                  </svg>
                  {t.common.upload}
                </a>
              </div>
              <div class="flex items-center space-x-4">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main class="flex-1 max-w-4xl mx-auto px-6 py-6 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer class="footer">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-6">
              <span class="text-sm text-comment">© 2025 NodeVault</span>
              <div class="flex items-center space-x-4">
                <span class="text-xs text-comment">{t.common.encrypted}</span>
                <span class="text-xs text-comment">•</span>
                <span class="text-xs text-comment">{t.common.decentralized}</span>
                <span class="text-xs text-comment">•</span>
                <span class="text-xs text-comment">{t.common.secure}</span>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <a 
                href="/?admin=true" 
                class="text-xs text-comment hover:text-warning transition-colors duration-200 flex items-center space-x-2 group"
                title="Admin Panel"
              >
                <span>Admin Panel</span>
                <svg 
                  class="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
              <div class="w-2 h-2 bg-text-success rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}