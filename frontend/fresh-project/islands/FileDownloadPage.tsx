import { useState, useEffect } from "preact/hooks";
import { NodeVaultAPI } from "@/utils/api.ts";
import { EncryptionManager } from "@/utils/encryption.ts";
import { I18n } from "@/utils/i18n.ts";

interface FileDownloadPageProps {
  cid: string;
}

export default function FileDownloadPage({ cid }: FileDownloadPageProps) {
  const [fileInfo, setFileInfo] = useState<{ filename: string; size: number; expiresAt: string } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const t = I18n.getTranslations();

  useEffect(() => {
  // Пытаемся получить метаданные из payload при загрузке страницы
  const urlParams = new URLSearchParams(globalThis.location.search);
  const payloadFromUrl = urlParams.get('payload');
  
  if (payloadFromUrl) {
    try {
      const { metadata } = EncryptionManager.parseEncryptionPayload(payloadFromUrl);
      setFileInfo({
        filename: metadata.filename,
        size: metadata.size,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });
    } catch (error) {
      console.error("Ошибка парсинга метаданных:", error);
      // Если не удалось распарсить, используем fallback
      setFileInfo({
        filename: `file-${cid.slice(0, 8)}`,
        size: 0,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });
    }
  } else {
    setFileInfo({
      filename: `file-${cid.slice(0, 8)}`,
      size: 0,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });
  }
}, [cid]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleDownload = async () => {
  setIsDownloading(true);
  setError(null);

  try {
    console.log("Начинаем скачивание для CID:", cid);
    
    // Получаем payload из URL
    const urlParams = new URLSearchParams(globalThis.location.search);
    const payloadFromUrl = urlParams.get('payload');
    
    if (!payloadFromUrl) {
      throw new Error("Отсутствуют данные для дешифрования. Используйте ссылку, предоставленную отправителем.");
    }

    console.log("Payload из URL получен");
    
    // Парсим payload чтобы получить ключ, IV и метаданные
    const { key: decryptionKey, iv, metadata } = EncryptionManager.parseEncryptionPayload(payloadFromUrl);
    console.log("Ключ, IV и метаданные извлечены:", metadata);
    
    // Обновляем информацию о файле
    setFileInfo({
      filename: metadata.filename,
      size: metadata.size,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });
    
    // Скачиваем файл через API
    const blob = await NodeVaultAPI.downloadFile(cid);
    console.log("Файл скачан, размер:", blob.size);
    
    // Расшифровываем файл
    console.log("Расшифровываем файл...");
    const encryptedData = await blob.arrayBuffer();
    
    const fileData = await EncryptionManager.decryptFile(
      encryptedData, 
      decryptionKey, 
      iv
    );
    console.log("Файл успешно расшифрован");

    // Используем оригинальное имя файла и тип из метаданных
    const filename = metadata.filename;
    const fileType = metadata.type || "application/octet-stream";

    // Создаем Blob для скачивания с правильным типом
    const downloadBlob = new Blob([new Uint8Array(fileData)], {
      type: fileType
    });
    
    // Создаем временную ссылку для скачивания
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename; // Используем оригинальное имя файла
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("Скачивание успешно завершено");

  } catch (error: unknown) {
    console.error("Ошибка при скачивании:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Ошибка скачивания";
    
    if (errorMessage.includes("404") || errorMessage.includes("file not found") || errorMessage.includes("no providers found")) {
      setError(t.download.fileNotFound);
    } else if (errorMessage.includes("Отсутствуют данные для дешифрования")) {
      setError("Для скачивания этого файла требуются данные дешифрования. Используйте ссылку, которую вам отправили.");
    } else if (errorMessage.includes("Неверный формат") || errorMessage.includes("неверный ключ")) {
      setError("Неверные данные дешифрования. Убедитесь, что используете правильную ссылку.");
    } else if (errorMessage.includes("Decryption failed") || errorMessage.includes("Ошибка дешифрования")) {
      setError("Ошибка дешифрования файла. Файл может быть поврежден или используются неверные данные.");
    } else {
      setError(errorMessage);
    }
  } finally {
    setIsDownloading(false);
  }
};

  const truncateCid = (cid: string, start: number = 12, end: number = 8) => {
    if (cid.length <= start + end) return cid;
    return `${cid.slice(0, start)}...${cid.slice(-end)}`;
  };

  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    const extensionIndex = filename.lastIndexOf('.');
    if (extensionIndex === -1) {
      return filename.slice(0, maxLength - 3) + '...';
    }
    const name = filename.slice(0, extensionIndex);
    const extension = filename.slice(extensionIndex);
    const maxNameLength = maxLength - extension.length - 3;
    return name.slice(0, Math.max(maxNameLength, 8)) + '...' + extension;
  };

  if (error) {
    return (
      <div class="flex items-center justify-center px-4 py-12">
        <div class="max-w-md w-full ide-window text-center fade-in-fast">
          <div class="ide-header">
            <span class="text-error">downloadError()</span>
          </div>
          <div class="ide-body">
            <div class="w-12 h-12 border border-text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </div>
            <h2 class="text-xl font-bold text-text-error mb-3">{t.download.downloadFailed}</h2>
            <p class="text-text-error mb-4 text-wrap-balance">{error}</p>
            <p class="text-comment text-sm mb-4">
              ID файла: <code class="bg-tertiary px-2 py-1 border border-primary rounded text-xs text-truncate max-w-[200px] inline-block">
                {cid}
              </code>
            </p>
            <div class="space-y-2">
              <a href="/" class="block btn btn-primary">
                {t.download.returnHome}
              </a>
              <a href="/upload" class="block btn">
                {t.download.uploadFiles}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full ide-window slide-in-up">
        <div class="ide-header">
          <span class="text-function">downloadFile()</span>
        </div>
        <div class="ide-body">
          <div class="text-center mb-4">
            <div class="w-12 h-12 border border-accent-primary rounded-full flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
              </svg>
            </div>
            <h1 class="text-xl font-bold text-secondary mb-1">{t.download.fileReady}</h1>
            <p class="text-comment">{t.download.p2pTransfer}</p>
          </div>

          {fileInfo && (
            <div class="file-info-json mb-4 fade-in-medium">
              <div class="json-line">
                <span class="json-bracket">{'{'}</span>
              </div>
              
              <div class="json-line">
                <span class="json-key">  "filename"</span><span class="json-punctuation">: </span>
                <span class="json-string" title={fileInfo.filename}>
                  "{truncateFilename(fileInfo.filename)}"
                </span><span class="json-punctuation">,</span>
              </div>

              <div class="json-line">
                <span class="json-key">  "file_id"</span><span class="json-punctuation">: </span>
                <span class="json-string" title={cid}>
                  "{truncateCid(cid)}"
                </span><span class="json-punctuation">,</span>
              </div>

              {fileInfo.size > 0 && (
                <div class="json-line">
                  <span class="json-key">  "size_bytes"</span><span class="json-punctuation">: </span>
                  <span class="json-number">{fileInfo.size}</span><span class="json-punctuation">,</span>
                </div>
              )}
              
              <div class="json-line">
                <span class="json-key">  "size_mb"</span><span class="json-punctuation">: </span>
                <span class="json-number">{(fileInfo.size / 1024 / 1024).toFixed(2)}</span><span class="json-punctuation">,</span>
              </div>
              
              <div class="json-line">
                <span class="json-key">  "expires_at"</span><span class="json-punctuation">: </span>
                <span class="json-string">"{formatDate(fileInfo.expiresAt)}"</span>
              </div>
              
              <div class="json-line">
                <span class="json-bracket">{'}'}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            class="w-full btn btn-primary py-3 fade-in-slow"
          >
            {isDownloading ? (
              <div class="flex items-center justify-center">
                <div class="spinner mr-2"></div>
                {t.download.processing}
              </div>
            ) : (
              <span class="text-truncate max-w-[250px] block mx-auto">
                {t.download.download} {fileInfo ? truncateFilename(fileInfo.filename, 25) : 'File'}
              </span>
            )}
          </button>

          <div class="mt-6 text-center fade-in-slow">
            <div class="text-comment text-sm space-y-1">
              <div>{t.download.autoDelete}</div>
              <div>{t.download.transferComplete}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 