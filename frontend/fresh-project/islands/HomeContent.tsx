import { useState, useEffect } from "preact/hooks";
import { I18n } from "@/utils/i18n.ts";
import {
  subscribeToNews,
  NewsItem,
  postNews,
  signInAdmin,
  onAuthChanged,
  ADMIN_EMAIL,
  FirebaseUser,
} from "@/utils/firebase.ts";

export default function HomeContent() {
  const t = I18n.getTranslations();

  // Состояния для новостей
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Состояния для админ-панели
  const [adminMode, setAdminMode] = useState(false);
  const [adminLogged, setAdminLogged] = useState(false);

  // Состояния для формы логина
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Состояния для отправки новостей
  const [adminMessage, setAdminMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [adminResult, setAdminResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Подписка на новости из Firebase
  useEffect(() => {
    const unsub = subscribeToNews(
      (items) => {
        setNews(items);
        setNewsLoading(false);
      },
      (_err) => {
        // Игнорируем ошибку, но устанавливаем состояние ошибки
        setNewsError(t.news.error);
        setNewsLoading(false);
      }
    );
    return unsub;
  }, []);

  // Проверка параметра админ-режима в URL
  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    if (params.get("admin") === "true") setAdminMode(true);
  }, []);

  // Слушатель изменения статуса аутентификации
  useEffect(() => {
    const unsub = onAuthChanged((user: FirebaseUser | null) => {
      setAdminLogged(!!user && user.email === ADMIN_EMAIL);
    });
    return unsub;
  }, []);

  // Обработчик входа в админ-панель
  const handleLogin = async (e: Event) => {
    e.preventDefault();
    try {
      await signInAdmin(loginEmail, loginPassword);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid credentials";
      alert("Login failed: " + errorMessage);
    }
  };

  // Обработчик отправки новости
  const handleAdminSubmit = async (e: Event) => {
    e.preventDefault();
    if (!adminMessage.trim()) return;

    setSending(true);
    setAdminResult(null);

    try {
      await postNews(adminMessage);
      setAdminResult({ type: "success", message: t.news.admin.success });
      setAdminMessage("");
      setTimeout(() => setAdminResult(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t.news.admin.fail;
      setAdminResult({
        type: "error",
        message: errorMessage
      });
    } finally {
      setSending(false);
    }
  };

  // Форматирование даты для отображения
  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(I18n.getCurrentLanguage(), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  return (
    <div class="max-w-3xl mx-auto">
      {/* Главный заголовок и описание */}
      <div class="text-center py-12 px-4">
        <h1 class="text-3xl md:text-4xl font-bold text-secondary mb-4 typewriter inline-block">
          {t.home.title}
          <span class="typewriter-after">|</span>
        </h1>
        <p class="text-primary max-w-xl mx-auto mb-8 leading-relaxed fade-in-slow">
          <span class="text-comment">{t.home.subtitle}</span>
        </p>
        {/* Кнопка загрузки файла */}
        <div class="flex justify-center space-x-3 fade-in-slow" style="animation-delay: 0.3s">
          <a href="/upload" class="btn btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
            </svg>
            {t.home.uploadButton}
          </a>
        </div>
      </div>

      {/* Секция новостей */}
      <div class="py-6 px-4 fade-in-slow">
        <div class="ide-window">
          <div class="ide-header">
            <span class="text-function">{t.news.title}</span>
          </div>
          <div class="ide-body p-4">
            {newsLoading ? (
              // Состояние загрузки
              <div class="text-center py-4 text-comment">
                {t.news.loading} <span class="spinner ml-2"></span>
              </div>
            ) : newsError ? (
              // Состояние ошибки
              <div class="text-center py-4 text-error">{newsError}</div>
            ) : news.length === 0 ? (
              // Состояние отсутствия новостей
              <div class="text-center py-4 text-comment">{t.news.none}</div>
            ) : (
              // Список новостей
              <div class="space-y-4">
                {news.map((item) => (
                  <div key={item.id} class="border-l-2 border-accent-primary pl-3 py-1">
                    <div class="text-sm text-comment">{formatDate(item.timestamp)}</div>
                    <div class="text-secondary">{item.message}</div>
                    {item.author && item.author !== "system" && (
                      <div class="text-xs text-comment mt-1">— {item.author}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Админ-панель (только при ?admin=true) */}
      {adminMode && (
        <div class="py-6 px-4 fade-in-slow">
          <div class="ide-window">
            <div class="ide-header">
              <span class="text-warning">{t.news.admin.title}</span>
            </div>
            <div class="ide-body p-4">
              {!adminLogged ? (
                // Форма входа для админа
                <form onSubmit={handleLogin} class="space-y-3">
                  <div>
                    <label class="block text-sm text-secondary mb-1">Email</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onInput={(e) => setLoginEmail((e.target as HTMLInputElement).value)}
                      class="form-input w-full text-sm"
                      required
                      placeholder="anikicg11@gmail.com"
                    />
                  </div>
                  <div>
                    <label class="block text-sm text-secondary mb-1">Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onInput={(e) => setLoginPassword((e.target as HTMLInputElement).value)}
                      class="form-input w-full text-sm"
                      required
                    />
                  </div>
                  <button type="submit" class="btn btn-warning w-full">
                    Login
                  </button>
                </form>
              ) : (
                // Форма отправки новости после входа
                <form onSubmit={handleAdminSubmit} class="space-y-3">
                  <div>
                    <label class="block text-sm text-secondary mb-1">{t.news.admin.messageLabel}</label>
                    <textarea
                      value={adminMessage}
                      onInput={(e) => setAdminMessage((e.target as HTMLTextAreaElement).value)}
                      class="form-input w-full text-sm"
                      rows={3}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending}
                    class="btn btn-warning w-full"
                  >
                    {sending ? t.common.processing : t.news.admin.send}
                  </button>
                  {adminResult && (
                    <div
                      class={`mt-2 text-sm text-center ${
                        adminResult.type === "success" ? "text-success" : "text-error"
                      }`}
                    >
                      {adminResult.message}
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Секция возможностей в виде карточек */}
      <div class="grid md:grid-cols-3 gap-4 py-8 px-4">
        {/* Шифрование */}
        <div class="ide-window fade-in-slow">
          <div class="ide-header py-2">
            <span class="text-keyword">{t.home.featureTitles.encrypt}</span>
          </div>
          <div class="ide-body p-4">
            <div class="code-block text-sm">
              <div class="code-line">
                <span class="text-function">aes256</span>
                <span class="text-primary">(</span>
                <span class="text-string">'local'</span>
                <span class="text-primary">)</span>
              </div>
              <div class="code-line text-comment text-xs">
                {t.home.stepDescriptions.upload}
              </div>
            </div>
          </div>
        </div>
        {/* Распределение */}
        <div class="ide-window fade-in-slow">
          <div class="ide-header py-2">
            <span class="text-keyword">{t.home.featureTitles.distribute}</span>
          </div>
          <div class="ide-body p-4">
            <div class="code-block text-sm">
              <div class="code-line">
                <span class="text-function">p2p</span>
                <span class="text-primary">(</span>
                <span class="text-string">'network'</span>
                <span class="text-primary">)</span>
              </div>
              <div class="code-line text-comment text-xs">
                {t.home.stepDescriptions.share}
              </div>
            </div>
          </div>
        </div>
        {/* Автоудаление */}
        <div class="ide-window fade-in-slow">
          <div class="ide-header py-2">
            <span class="text-keyword">{t.home.featureTitles.expire}</span>
          </div>
          <div class="ide-body p-4">
            <div class="code-block text-sm">
              <div class="code-line">
                <span class="text-function">setTTL</span>
                <span class="text-primary">(</span>
                <span class="text-number">3600</span>
                <span class="text-primary">)</span>
              </div>
              <div class="code-line text-comment text-xs">
                {t.home.stepDescriptions.download}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Как это работает - пошаговое руководство */}
      <div class="py-8 px-4">
        <div class="ide-window">
          <div class="ide-header">
            <span class="text-function">{t.home.howItWorks}</span>
          </div>
          <div class="ide-body p-4">
            <div class="space-y-3">
              {/* Шаг 1 - Загрузка */}
              <div class="how-it-works-step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <div class="step-title">{t.home.steps.upload}</div>
                  <div class="step-description">
                    <span class="text-comment">{t.home.stepDescriptions.upload}</span>
                  </div>
                </div>
              </div>
              {/* Шаг 2 - Поделиться */}
              <div class="how-it-works-step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <div class="step-title">{t.home.steps.share}</div>
                  <div class="step-description">
                    <span class="text-comment">{t.home.stepDescriptions.share}</span>
                  </div>
                </div>
              </div>
              {/* Шаг 3 - Скачать */}
              <div class="how-it-works-step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <div class="step-title">{t.home.steps.download}</div>
                  <div class="step-description">
                    <span class="text-comment">{t.home.stepDescriptions.download}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Статистика и цифры */}
      <div class="py-8 px-4 fade-in-slow">
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="ide-window py-4">
            <div class="text-2xl font-bold text-number mb-1">256</div>
            <div class="text-xs text-comment">{t.home.stats.encryption}</div>
          </div>
          <div class="ide-window py-4">
            <div class="text-2xl font-bold text-number mb-1">P2P</div>
            <div class="text-xs text-comment">{t.home.stats.network}</div>
          </div>
        </div>
      </div>

      {/* Информация о безопасности и возможностях */}
      <div class="py-6 px-4 fade-in-slow">
        <div class="ide-window">
          <div class="ide-header">
            <span class="text-function">systemInfo()</span>
          </div>
          <div class="ide-body">
            <div class="grid md:grid-cols-2 gap-6 text-sm">
              {/* Безопасность */}
              <div>
                <div class="text-secondary font-semibold mb-2">{t.home.security.title}</div>
                <div class="space-y-1 text-comment">
                  {t.home.security.items.map((item, index) => (
                    <div key={index}>• {item}</div>
                  ))}
                </div>
              </div>
              {/* Возможности */}
              <div>
                <div class="text-secondary font-semibold mb-2">{t.home.featuresList.title}</div>
                <div class="space-y-1 text-comment">
                  {t.home.featuresList.items.map((item, index) => (
                    <div key={index}>• {item}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}