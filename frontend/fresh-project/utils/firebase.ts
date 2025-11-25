import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  push,
  set,
  DataSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Конфигурация администратора из переменных окружения ---
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
export const ADMIN_UID = import.meta.env.VITE_ADMIN_UID || "";

// --- Конфигурация Firebase (из .env) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Валидация (опционально, для dev)
if (!firebaseConfig.apiKey) {
  console.warn("⚠️ Firebase config missing — check .env files");
}

// --- Инициализация Firebase ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ... остальной код остаётся без изменений
// --- Типы данных ---
export interface NewsItem {
  id: string;
  timestamp: number;
  message: string;
  author?: string;
}

// Интерфейс для пользователя Firebase
export interface FirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
}

// Интерфейс для данных новости из Firebase
interface FirebaseNewsItem {
  timestamp?: number;
  message?: string;
  author?: string;
}

// --- Ссылки на данные ---
export const getNewsRef = () => ref(db, "news");

// --- Подписка на новости ---
export const subscribeToNews = (
  callback: (news: NewsItem[]) => void,
  onError?: (error: Error) => void,
) => {
  const newsRef = getNewsRef();
  return onValue(
    newsRef,
    (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        callback([]);
        return;
      }
      
      // Преобразуем данные Firebase в массив новостей
      const newsArray = Object.entries(data)
        .map(([id, item]) => {
          // Приводим тип item к FirebaseNewsItem
          const newsItem = item as FirebaseNewsItem;
          return {
            id,
            timestamp: newsItem.timestamp || Date.now(),
            message: newsItem.message || "",
            author: newsItem.author || "system",
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
      
      callback(newsArray);
    },
    (error: Error) => {
      console.error("Ошибка подписки на новости Firebase:", error);
      onError?.(error);
    },
  );
};

//  Вход admina
export async function signInAdmin(
  email: string,
  password: string,
): Promise<FirebaseUser> {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  const user = userCred.user;

  // Проверяем, что пользователь - администратор
  if (!user.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Доступ запрещен: не администратор");
  }

  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
  };
}

// --- Слушатель изменения состояния аутентификации ---
export const onAuthChanged = (cb: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, (user: unknown) => {
    if (!user) {
      cb(null);
      return;
    }
    
    // Приводим тип пользователя к ожидаемой структуре
    const authUser = user as {
      uid: string;
      email: string | null;
      emailVerified: boolean;
      displayName: string | null;
    };
    
    // Преобразуем пользователя Firebase в наш интерфейс
    cb({
      uid: authUser.uid,
      email: authUser.email,
      emailVerified: authUser.emailVerified,
      displayName: authUser.displayName,
    });
  });
};

// --- Публикация новости ---
export const postNews = async (
  message: string,
  author = "admin",
): Promise<boolean> => {
  const user = auth.currentUser;

  // Проверяем авторизацию администратора
  if (!user?.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    throw new Error("Не авторизован");
  }

  try {
    const newsRef = getNewsRef();
    const newNewsRef = push(newsRef);
    
    // Создаем новую запись новости
    await set(newNewsRef, {
      timestamp: Date.now(),
      message: message.trim(),
      author,
    });
    
    return true;
  } catch (error: unknown) {
    console.error("Ошибка публикации новости:", error);
    throw error;
  }
};