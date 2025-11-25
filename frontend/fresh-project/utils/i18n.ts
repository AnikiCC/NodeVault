export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de' | 'zh';

export interface Translations {
  common: {
    home: string;
    upload: string;
    download: string;
    ready: string;
    secure: string;
    encrypted: string;
    decentralized: string;
    hour: string;
    hours: string;
    days: string;
    processing: string; 
  };
  home: {
    title: string;
    subtitle: string;
    uploadButton: string;
    featureTitles: {
      encrypt: string;
      distribute: string;
      expire: string;
    };
    howItWorks: string;
    steps: {
      upload: string;
      share: string;
      download: string;
    };
    stepDescriptions: {
      upload: string;
      share: string;
      download: string;
    };
    stats: {
      encryption: string;
      network: string;
    };
    security: {
      title: string;
      items: string[];
    };
    featuresList: {
      title: string;
      items: string[];
    };
  };
  upload: {
    title: string;
    subtitle: string;
    dragDrop: string;
    clickToBrowse: string;
    maxSize: string;
    expiration: string;
    processing: string;
    complete: string;
    uploadSuccessful: string;
    fileDistributed: string;
    shareLink: string;
    copy: string;
    copyToShare: string;
    readyForNext: string;
    fileLimits: {
      title: string;
      items: string[];
    };
    security: {
      title: string;
      items: string[];
    };
  };
  download: {
    title: string;
    fileReady: string;
    p2pTransfer: string;
    download: string;
    processing: string;
    downloadFailed: string;
    fileExpired: string;
    fileNotFound: string;
    returnHome: string;
    uploadFiles: string;
    autoDelete: string;
    transferComplete: string;
  };
  news: {
    title: string;
    loading: string;
    error: string;
    none: string;
    admin: {
      title: string;
      tokenLabel: string;
      messageLabel: string;
      send: string;
      success: string;
      fail: string;
    };
  };
}

const translations: Record<Language, Translations> = {
  en: {
    common: {
      home: 'Home',
      upload: 'Upload',
      download: 'Download',
      ready: 'Ready',
      secure: 'Secure',
      encrypted: 'Encrypted',
      decentralized: 'Decentralized',
      hour: 'hour',
      hours: 'hours',
      days: 'days',
      processing: 'Processing...'
    },
    home: {
      title: 'secure_file_transfer()',
      subtitle: ' End-to-end encrypted P2P file sharing',
      uploadButton: 'uploadFile()',
      featureTitles: {
        encrypt: 'encrypt',
        distribute: 'distribute',
        expire: 'expire'
      },
      howItWorks: 'howItWorks()',
      steps: {
        upload: 'Upload & Encrypt',
        share: 'Get Share Link',
        download: 'Download & Decrypt'
      },
      stepDescriptions: {
        upload: ' Files encrypted locally with AES-256',
        share: ' Unique link for secure sharing',
        download: ' Automatic decryption in browser'
      },
      stats: {
        encryption: 'AES Encryption',
        network: 'Distributed Network'
      },
      security: {
        title: 'Security',
        items: [
          'End-to-end encryption',
          'Local file processing',
          'Zero knowledge design'
        ]
      },
      featuresList: {
        title: 'Features',
        items: [
          'Auto-expiring files',
          'No file size limits',
          'Instant sharing'
        ]
      }
    },
    upload: {
      title: 'uploadFile()',
      subtitle: ' Select file to start secure transfer',
      dragDrop: 'Drag & Drop File',
      clickToBrowse: ' Click to browse files',
      maxSize: 'Encrypted • Max 500MB',
      expiration: 'Expiration',
      processing: 'Processing...',
      complete: 'complete',
      uploadSuccessful: 'Upload Successful',
      fileDistributed: 'File distributed across P2P network',
      shareLink: 'Share Link',
      copy: 'Copy',
      copyToShare: 'Copy to share',
      readyForNext: 'Upload Another File',
      fileLimits: {
        title: 'File Limits',
        items: [
          ' Maximum size: 500MB',
          ' All file types supported',
          ' No daily limits'
        ]
      },
      security: {
        title: 'Security',
        items: [
          ' Encrypted before upload',
          ' Distributed storage',
          ' Auto-deletion'
        ]
      }
    },
    download: {
      title: 'Download File - NodeVault',
      fileReady: 'File Ready',
      p2pTransfer: 'P2P encrypted transfer',
      download: 'Download',
      processing: 'Processing...',
      downloadFailed: 'Download Failed',
      fileExpired: 'File has expired',
      fileNotFound: 'File not found or expired',
      returnHome: 'Return Home',
      uploadFiles: 'Upload Files',
      autoDelete: 'File will auto-delete after expiration',
      transferComplete: 'Transfer complete • Secure connection'
    },
    news: {
      title: 'Network News',
      loading: 'Loading news...',
      error: 'Failed to load news',
      none: 'No news yet',
      admin: {
        title: 'Post News (Admin)',
        tokenLabel: 'Admin Token',
        messageLabel: 'Message',
        send: 'Send',
        success: 'News posted!',
        fail: 'Invalid token or network error'
      }
    }
  },
  ru: {
    common: {
      home: 'Главная',
      upload: 'Загрузить',
      download: 'Скачать',
      ready: 'Готово',
      secure: 'Безопасно',
      encrypted: 'Зашифровано',
      decentralized: 'Децентрализовано',
      hour: 'час',
      hours: 'часа',
      days: 'дней',
      processing: 'Обработка...' 
    },
    home: {
      title: 'secure_file_transfer()',
      subtitle: ' End-to-end зашифрованный P2P обмен файлами',
      uploadButton: 'uploadFile()',
      featureTitles: {
        encrypt: 'шифрование',
        distribute: 'распределение',
        expire: 'удаление'
      },
      howItWorks: 'howItWorks()',
      steps: {
        upload: 'Загрузить & Зашифровать',
        share: 'Получить ссылку',
        download: 'Скачать & Расшифровать'
      },
      stepDescriptions: {
        upload: 'Файлы шифруются локально с AES-256',
        share: 'Уникальная ссылка для безопасного обмена',
        download: 'Автоматическая расшифровка в браузере'
      },
      stats: {
        encryption: 'AES Шифрование',
        network: 'Распределенная сеть'
      },
      security: {
        title: 'Безопасность',
        items: [
          'End-to-end шифрование',
          'Локальная обработка файлов',
          'Zero knowledge архитектура'
        ]
      },
      featuresList: {
        title: 'Возможности',
        items: [
          'Автоудаление файлов',
          'Без ограничений размера',
          'Мгновенный обмен'
        ]
      }
    },
    upload: {
      title: 'uploadFile()',
      subtitle: ' Выберите файл для безопасной передачи',
      dragDrop: 'Перетащите файл',
      clickToBrowse: ' Нажмите для выбора файлов',
      maxSize: 'Зашифровано • Макс. 500МБ',
      expiration: 'Время жизни',
      processing: 'Обработка...',
      complete: 'завершено',
      uploadSuccessful: 'Файл загружен',
      fileDistributed: 'Файл распределен в P2P сети',
      shareLink: 'Поделиться ссылкой',
      copy: 'Копировать',
      copyToShare: 'Скопировать для отправки',
      readyForNext: 'Загрузить другой файл',
      fileLimits: {
        title: 'Ограничения файлов',
        items: [
          ' Максимальный размер: 500МБ',
          ' Все типы файлов поддерживаются',
          ' Нет дневных лимитов'
        ]
      },
      security: {
        title: 'Безопасность',
        items: [
          ' Шифруется перед загрузкой',
          ' Распределенное хранение',
          ' Автоудаление'
        ]
      }
    },
    download: {
      title: 'Скачать файл - NodeVault',
      fileReady: 'Файл готов',
      p2pTransfer: 'P2P зашифрованная передача',
      download: 'Скачать',
      processing: 'Обработка...',
      downloadFailed: 'Ошибка скачивания',
      fileExpired: 'Файл истек',
      fileNotFound: 'Файл не найден или истек',
      returnHome: 'На главную',
      uploadFiles: 'Загрузить файлы',
      autoDelete: 'Файл будет автоматически удален после истечения срока',
      transferComplete: 'Передача завершена • Безопасное соединение'
    },
    news: {
      title: 'Сетевые новости',
      loading: 'Загрузка новостей...',
      error: 'Не удалось загрузить новости',
      none: 'Новостей пока нет',
      admin: {
        title: 'Опубликовать новость (Админ)',
        tokenLabel: 'Админ-токен',
        messageLabel: 'Сообщение',
        send: 'Отправить',
        success: 'Новость опубликована!',
        fail: 'Неверный токен или ошибка сети'
      }
    }
  },
  es: {
    common: {
      home: 'Inicio',
      upload: 'Subir',
      download: 'Descargar',
      ready: 'Listo',
      secure: 'Seguro',
      encrypted: 'Cifrado',
      decentralized: 'Descentralizado',
      hour: 'hora',
      hours: 'horas',
      days: 'días',
      processing: 'Procesando...' 
    },
    home: {
      title: 'secure_file_transfer()',
      subtitle: ' Compartir de archivos P2P cifrado de extremo a extremo',
      uploadButton: 'uploadFile()',
      featureTitles: {
        encrypt: 'cifrar',
        distribute: 'distribuir',
        expire: 'eliminar'
      },
      howItWorks: 'howItWorks()',
      steps: {
        upload: 'Subir & Cifrar',
        share: 'Obtener enlace',
        download: 'Descargar & Descifrar'
      },
      stepDescriptions: {
        upload: ' Archivos cifrados localmente con AES-256',
        share: ' Enlace único para compartir seguro',
        download: ' Descifrado automático en el navegador'
      },
      stats: {
        encryption: 'Cifrado AES',
        network: 'Red Distribuida'
      },
      security: {
        title: 'Seguridad',
        items: [
          'Cifrado de extremo a extremo',
          'Procesamiento local de archivos',
          'Diseño zero knowledge'
        ]
      },
      featuresList: {
        title: 'Características',
        items: [
          'Archivos que expiran automáticamente',
          'Sin límites de tamaño de archivo',
          'Compartición instantánea'
        ]
      }
    },
    upload: {
      title: 'uploadFile()',
      subtitle: ' Selecciona archivo para transferencia segura',
      dragDrop: 'Arrastrar y Soltar Archivo',
      clickToBrowse: ' Haz clic para buscar archivos',
      maxSize: 'Cifrado • Máx 500MB',
      expiration: 'Expiración',
      processing: 'Procesando...',
      complete: 'completo',
      uploadSuccessful: 'Subida Exitosa',
      fileDistributed: 'Archivo distribuido en red P2P',
      shareLink: 'Enlace Compartir',
      copy: 'Copiar',
      copyToShare: 'Copiar para compartir',
      readyForNext: 'Subir Otro Archivo',
      fileLimits: {
        title: 'Límites de Archivos',
        items: [
          ' Tamaño máximo: 500MB',
          ' Todos los tipos de archivo soportados',
          ' Sin límites diarios'
        ]
      },
      security: {
        title: 'Seguridad',
        items: [
          ' Cifrado antes de subir',
          ' Almacenamiento distribuido',
          ' Auto-eliminación'
        ]
      }
    },
    download: {
      title: 'Descargar Archivo - NodeVault',
      fileReady: 'Archivo Listo',
      p2pTransfer: 'Transferencia P2P cifrada',
      download: 'Descargar',
      processing: 'Procesando...',
      downloadFailed: 'Error al Descargar',
      fileExpired: 'Archivo expirado',
      fileNotFound: 'Archivo no encontrado o expirado',
      returnHome: 'Volver al Inicio',
      uploadFiles: 'Subir Archivos',
      autoDelete: 'El archivo se eliminará automáticamente después de la expiración',
      transferComplete: 'Transferencia completa • Conexión segura'
    },
    news: {
      title: 'Noticias de la Red',
      loading: 'Cargando noticias...',
      error: 'Error al cargar noticias',
      none: 'Aún no hay noticias',
      admin: {
        title: 'Publicar Noticia (Admin)',
        tokenLabel: 'Token de Admin',
        messageLabel: 'Mensaje',
        send: 'Enviar',
        success: '¡Noticia publicada!',
        fail: 'Token inválido o error de red'
      }
    }
  },
  fr: {
    common: {
      home: 'Accueil',
      upload: 'Télécharger',
      download: 'Télécharger',
      ready: 'Prêt',
      secure: 'Sécurisé',
      encrypted: 'Chiffré',
      decentralized: 'Décentralisé',
      hour: 'heure',
      hours: 'heures',
      days: 'jours',
      processing: 'Traitement...' 
    },
    home: {
      title: 'secure_file_transfer()',
      subtitle: ' Partage de fichiers P2P chiffré de bout en bout',
      uploadButton: 'uploadFile()',
      featureTitles: {
        encrypt: 'chiffrer',
        distribute: 'distribuer',
        expire: 'supprimer'
      },
      howItWorks: 'howItWorks()',
      steps: {
        upload: 'Télécharger & Chiffrer',
        share: 'Obtenir le lien',
        download: 'Télécharger & Déchiffrer'
      },
      stepDescriptions: {
        upload: ' Fichiers chiffrés localement avec AES-256',
        share: ' Lien unique pour partage sécurisé',
        download: ' Déchiffrement automatique dans le navigateur'
      },
      stats: {
        encryption: 'Chiffrement AES',
        network: 'Réseau Distribué'
      },
      security: {
        title: 'Sécurité',
        items: [
          'Chiffrement de bout en bout',
          'Traitement local des fichiers',
          'Conception zero knowledge'
        ]
      },
      featuresList: {
        title: 'Fonctionnalités',
        items: [
          'Fichiers à expiration automatique',
          'Aucune limite de taille de fichier',
          'Partage instantané'
        ]
      }
    },
    upload: {
      title: 'uploadFile()',
      subtitle: ' Sélectionnez le fichier pour transfert sécurisé',
      dragDrop: 'Glisser-Déposer Fichier',
      clickToBrowse: ' Cliquer pour parcourir les fichiers',
      maxSize: 'Chiffré • Max 500MB',
      expiration: 'Expiration',
      processing: 'Traitement...',
      complete: 'terminé',
      uploadSuccessful: 'Téléchargement Réussi',
      fileDistributed: 'Fichier distribué sur réseau P2P',
      shareLink: 'Lien de Partage',
      copy: 'Copier',
      copyToShare: 'Copier pour partager',
      readyForNext: 'Télécharger un Autre Fichier',
      fileLimits: {
        title: 'Limites Fichiers',
        items: [
          ' Taille maximum : 500MB',
          ' Tous types de fichiers supportés',
          ' Pas de limites quotidiennes'
        ]
      },
      security: {
        title: 'Sécurité',
        items: [
          ' Chiffré avant téléchargement',
          ' Stockage distribué',
          ' Auto-suppression'
        ]
      }
    },
    download: {
      title: 'Télécharger Fichier - NodeVault',
      fileReady: 'Fichier Prêt',
      p2pTransfer: 'Transfert P2P chiffré',
      download: 'Télécharger',
      processing: 'Traitement...',
      downloadFailed: 'Échec Téléchargement',
      fileExpired: 'Fichier expiré',
      fileNotFound: 'Fichier non trouvé ou expiré',
      returnHome: 'Retour Accueil',
      uploadFiles: 'Télécharger Fichiers',
      autoDelete: 'Le fichier sera automatiquement supprimé après expiration',
      transferComplete: 'Transfert complet • Connexion sécurisée'
    },
    news: {
      title: 'Actualités du Réseau',
      loading: 'Chargement des actualités...',
      error: 'Échec du chargement des actualités',
      none: 'Aucune actualité pour le moment',
      admin: {
        title: 'Publier une Actualité (Admin)',
        tokenLabel: 'Jeton Admin',
        messageLabel: 'Message',
        send: 'Envoyer',
        success: 'Actualité publiée !',
        fail: 'Jeton invalide ou erreur réseau'
      }
    }
  },
  de: {
    common: {
      home: 'Startseite',
      upload: 'Hochladen',
      download: 'Herunterladen',
      ready: 'Bereit',
      secure: 'Sicher',
      encrypted: 'Verschlüsselt',
      decentralized: 'Dezentralisiert',
      hour: 'Stunde',
      hours: 'Stunden',
      days: 'Tage',
      processing: 'Verarbeitung...' 
    },
    home: {
      title: 'secure_file_transfer()',
      subtitle: ' Ende-zu-Ende verschlüsselter P2P Dateiaustausch',
      uploadButton: 'uploadFile()',
      featureTitles: {
        encrypt: 'verschlüsseln',
        distribute: 'verteilen',
        expire: 'löschen'
      },
      howItWorks: 'howItWorks()',
      steps: {
        upload: 'Hochladen & Verschlüsseln',
        share: 'Link erhalten',
        download: 'Herunterladen & Entschlüsseln'
      },
      stepDescriptions: {
        upload: ' Dateien lokal mit AES-256 verschlüsselt',
        share: ' Einzigartiger Link für sicheres Teilen',
        download: ' Automatische Entschlüsselung im Browser'
      },
      stats: {
        encryption: 'AES Verschlüsselung',
        network: 'Verteiltes Netzwerk'
      },
      security: {
        title: 'Sicherheit',
        items: [
          'Ende-zu-Ende Verschlüsselung',
          'Lokale Dateiverarbeitung',
          'Zero Knowledge Design'
        ]
      },
      featuresList: {
        title: 'Funktionen',
        items: [
          'Automatisch ablaufende Dateien',
          'Keine Dateigrößenbeschränkungen',
          'Sofortiges Teilen'
        ]
      }
    },
    upload: {
      title: 'uploadFile()',
      subtitle: ' Datei für sicheren Transfer auswählen',
      dragDrop: 'Datei Drag & Drop',
      clickToBrowse: ' Klicken zum Durchsuchen',
      maxSize: 'Verschlüsselt • Max 500MB',
      expiration: 'Ablauf',
      processing: 'Verarbeitung...',
      complete: 'abgeschlossen',
      uploadSuccessful: 'Hochladen Erfolgreich',
      fileDistributed: 'Datei in P2P-Netzwerk verteilt',
      shareLink: 'Share Link',
      copy: 'Kopieren',
      copyToShare: 'Kopieren zum Teilen',
      readyForNext: 'Weitere Datei Hochladen',
      fileLimits: {
        title: 'Datei Limits',
        items: [
          ' Maximale Größe: 500MB',
          ' Alle Dateitypen unterstützt',
          ' Keine täglichen Limits'
        ]
      },
      security: {
        title: 'Sicherheit',
        items: [
          ' Vor Upload verschlüsselt',
          ' Verteilter Speicher',
          ' Auto-Löschung'
        ]
      }
    },
    download: {
      title: 'Datei Herunterladen - NodeVault',
      fileReady: 'Datei Bereit',
      p2pTransfer: 'P2P verschlüsselter Transfer',
      download: 'Herunterladen',
      processing: 'Verarbeitung...',
      downloadFailed: 'Download Fehlgeschlagen',
      fileExpired: 'Datei abgelaufen',
      fileNotFound: 'Datei nicht gefunden oder abgelaufen',
      returnHome: 'Zurück zur Startseite',
      uploadFiles: 'Dateien Hochladen',
      autoDelete: 'Datei wird nach Ablauf automatisch gelöscht',
      transferComplete: 'Transfer abgeschlossen • Sichere Verbindung'
    },
    news: {
      title: 'Netzwerk-News',
      loading: 'Lade News...',
      error: 'Fehler beim Laden der News',
      none: 'Noch keine News vorhanden',
      admin: {
        title: 'News veröffentlichen (Admin)',
        tokenLabel: 'Admin-Token',
        messageLabel: 'Nachricht',
        send: 'Senden',
        success: 'News veröffentlicht!',
        fail: 'Ungültiger Token oder Netzwerkfehler'
      }
    }
  },
  zh: {
    common: {
      home: '首页',
      upload: '上传',
      download: '下载',
      ready: '就绪',
      secure: '安全',
      encrypted: '已加密',
      decentralized: '去中心化',
      hour: '小时',
      hours: '小时',
      days: '天',
      processing: '处理中...' 
    },
    home: {
      title: 'secure_file_transfer()',
      subtitle: ' 端到端加密的P2P文件共享',
      uploadButton: 'uploadFile()',
      featureTitles: {
        encrypt: '加密',
        distribute: '分发',
        expire: '删除'
      },
      howItWorks: 'howItWorks()',
      steps: {
        upload: '上传 & 加密',
        share: '获取分享链接',
        download: '下载 & 解密'
      },
      stepDescriptions: {
        upload: ' 文件使用AES-256本地加密',
        share: ' 用于安全分享的唯一链接',
        download: ' 在浏览器中自动解密'
      },
      stats: {
        encryption: 'AES加密',
        network: '分布式网络'
      },
      security: {
        title: '安全',
        items: [
          '端到端加密',
          '本地文件处理',
          '零知识设计'
        ]
      },
      featuresList: {
        title: '功能',
        items: [
          '自动过期文件',
          '无文件大小限制',
          '即时分享'
        ]
      }
    },
    upload: {
      title: 'uploadFile()',
      subtitle: ' 选择文件开始安全传输',
      dragDrop: '拖放文件',
      clickToBrowse: ' 点击浏览文件',
      maxSize: '已加密 • 最大500MB',
      expiration: '过期时间',
      processing: '处理中...',
      complete: '完成',
      uploadSuccessful: '上传成功',
      fileDistributed: '文件在P2P网络中分发',
      shareLink: '分享链接',
      copy: '复制',
      copyToShare: '复制分享',
      readyForNext: '上传另一个文件',
      fileLimits: {
        title: '文件限制',
        items: [
          ' 最大大小：500MB',
          ' 支持所有文件类型',
          ' 无每日限制'
        ]
      },
      security: {
        title: '安全',
        items: [
          ' 上传前加密',
          ' 分布式存储',
          ' 自动删除'
        ]
      }
    },
    download: {
      title: '下载文件 - NodeVault',
      fileReady: '文件就绪',
      p2pTransfer: 'P2P加密传输',
      download: '下载',
      processing: '处理中...',
      downloadFailed: '下载失败',
      fileExpired: '文件已过期',
      fileNotFound: '文件未找到或已过期',
      returnHome: '返回首页',
      uploadFiles: '上传文件',
      autoDelete: '文件将在过期后自动删除',
      transferComplete: '传输完成 • 安全连接'
    },
    news: {
      title: '网络动态',
      loading: '正在加载动态...',
      error: '加载动态失败',
      none: '暂无动态',
      admin: {
        title: '发布动态（管理员）',
        tokenLabel: '管理员令牌',
        messageLabel: '内容',
        send: '发送',
        success: '动态已发布！',
        fail: '令牌无效或网络错误'
      }
    }
  }
};

export class I18n {
  private static readonly STORAGE_KEY = 'nodevault_language';
  private static currentLanguage: Language = 'en';
  private static initialized = false;
  private static listeners: ((lang: Language) => void)[] = [];

  static init(): void {
    if (this.initialized || typeof globalThis.window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved && this.isLanguage(saved)) {
        this.currentLanguage = saved as Language;
      } else {
        const browserLang = globalThis.navigator.language.split('-')[0];
        if (this.isLanguage(browserLang)) {
          this.currentLanguage = browserLang as Language;
        }
      }
      this.initialized = true;

      globalThis.window.addEventListener('storage', this.handleStorageChange.bind(this));
    } catch (error) {
      console.error('Error initializing i18n:', error);
    }
  }

  static setLanguage(lang: Language): void {
    if (this.currentLanguage === lang) return;
    
    this.currentLanguage = lang;
    try {
      if (typeof globalThis.window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, lang);
        
        globalThis.window.dispatchEvent(new StorageEvent('storage', {
          key: this.STORAGE_KEY,
          newValue: lang,
          oldValue: this.currentLanguage
        }));
      }
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }

    this.notifyListeners();
  }

  static getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  static getTranslations(): Translations {
    return translations[this.currentLanguage];
  }

  static onLanguageChange(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static handleStorageChange(event: StorageEvent): void {
    if (event.key === this.STORAGE_KEY && event.newValue && this.isLanguage(event.newValue)) {
      this.currentLanguage = event.newValue as Language;
      this.notifyListeners();
    }
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentLanguage);
      } catch (error) {
        console.error('Error in language change listener:', error);
      }
    });
  }

  private static isLanguage(lang: string): lang is Language {
    return ['en', 'ru', 'es', 'fr', 'de', 'zh'].includes(lang);
  }
}

if (typeof globalThis.window !== 'undefined') {
  I18n.init();
}