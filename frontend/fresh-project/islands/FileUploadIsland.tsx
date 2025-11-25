import { useState } from "preact/hooks";
import { NodeVaultAPI } from "@/utils/api.ts";
import { EncryptionManager } from "@/utils/encryption.ts";
import { UploadResponse } from "@/types/types.ts";
import { I18n } from "@/utils/i18n.ts";

export default function FileUploadIsland() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ttl, setTtl] = useState(3600);
  const [uploadResult, setUploadResult] = useState<UploadResponse & { shareableLink: string } | null>(null);
  
  const t = I18n.getTranslations();

  // Основная функция загрузки файла
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      alert("File size exceeds 500MB limit");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setUploadResult(null);

    try {
      console.log("Начинаем загрузку файла:", file.name);
      
      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 90 ? 90 : prev + 10);
      }, 200);

      // Шифрование файла перед загрузкой
      console.log("Шифруем файл...");
      const encryptedResult = await EncryptionManager.encryptFile(file);
      const fileToUpload = new File([encryptedResult.data], file.name, {
        type: "application/octet-stream"
      });
      
      // Создаем payload с ключом и IV
const encryptionPayload = EncryptionManager.createEncryptionPayload(
  encryptedResult.keyData, 
  encryptedResult.iv,
  encryptedResult.metadata
);
      
      // Загружаем файл на сервер
      const result = await NodeVaultAPI.uploadFile(fileToUpload, ttl);
      clearInterval(progressInterval);
      setProgress(100);

      console.log("Загрузка успешна:", result);

      // Генерируем ссылку с payload для E2E
      const shareableLink = `${globalThis.location.origin}/download/${result.cid}?payload=${encodeURIComponent(encryptionPayload)}`;

      setUploadResult({
  ...result,
  shareableLink
});
      
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }, 1000);

    } catch (error: unknown) {
      console.error("Ошибка загрузки:", error);
      setIsUploading(false);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      alert(`Upload failed: ${errorMessage}`);
    }
  };

  const handleFileInput = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    await handleFileUpload(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error: unknown) {
      console.error("Ошибка копирования в буфер обмена:", error);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const truncateFilename = (filename: string, maxLength: number = 25) => {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(I18n.getCurrentLanguage(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleUploadAnother = () => {
    setUploadResult(null);
  };

  return (
    <div class="space-y-6">
      {!uploadResult ? (
        <div class="ide-window">
          <div class="ide-header">
            <span class="text-function">uploadInterface()</span>
          </div>
          <div class="ide-body">
            <div class="space-y-4">
              <div
                class={`upload-area ${isDragOver ? 'dragover' : ''} ${isUploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && document.getElementById('file-input')?.click()}
              >
                {isUploading ? (
                  <div class="space-y-4">
                    <div class="w-12 h-12 border border-accent-primary rounded-full flex items-center justify-center mx-auto">
                      <div class="spinner"></div>
                    </div>
                    <div>
                      <p class="text-secondary font-semibold mb-2">{t.upload.processing}</p>
                      <div class="progress-container">
                        <div 
                          class="progress-bar" 
                          style={`width: ${progress}%`}
                        />
                      </div>
                      <p class="text-comment text-sm mt-1">{progress}% {t.upload.complete}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div class="w-12 h-12 border-2 border-dashed border-accent-primary rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg class="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                      </svg>
                    </div>
                    <p class="text-secondary font-semibold mb-1">{t.upload.dragDrop}</p>
                    <p class="text-comment text-sm">{t.upload.clickToBrowse}</p>
                    <div class="mt-3 status status-online">
                      <div class="w-2 h-2 bg-text-success rounded-full"></div>
                      {t.upload.maxSize}
                    </div>
                  </>
                )}
              </div>

              <input 
                type="file" 
                id="file-input" 
                onChange={handleFileInput} 
                disabled={isUploading} 
                class="hidden"
                accept="*/*"
              />

              <div class="grid md:grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm text-secondary mb-2">{t.upload.expiration}</label>
                  <select 
                    value={ttl} 
                    onChange={(e) => setTtl(Number((e.target as HTMLSelectElement).value))} 
                    disabled={isUploading} 
                    class="form-select text-sm"
                  >
                    <option value={3600}>1 {t.common.hour}</option>
                    <option value={86400}>24 {t.common.hours}</option>
                    <option value={604800}>7 {t.common.days}</option>
                    <option value={2592000}>30 {t.common.days}</option>
                  </select>
                </div>
              </div>

              <div class="file-info-json">
                <div class="json-line">
                  <span class="json-bracket">{'{'}</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "protocol"</span><span class="json-punctuation">: </span>
                  <span class="json-string">"p2p_encrypted"</span><span class="json-punctuation">,</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "encryption"</span><span class="json-punctuation">: </span>
                  <span class="json-string">"aes-256-gcm"</span><span class="json-punctuation">,</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "storage"</span><span class="json-punctuation">: </span>
                  <span class="json-string">"distributed"</span><span class="json-punctuation">,</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "auto_delete"</span><span class="json-punctuation">: </span>
                  <span class="json-boolean">true</span>
                </div>
                <div class="json-line">
                  <span class="json-bracket">{'}'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div class="ide-window">
          <div class="ide-header">
            <span class="text-success">uploadComplete()</span>
          </div>
          <div class="ide-body">
            <div class="text-center mb-4">
              <div class="w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 class="text-xl font-bold text-success mb-1">{t.upload.uploadSuccessful}</h2>
              <p class="text-comment text-sm">{t.upload.fileDistributed}</p>
            </div>

            <div class="grid md:grid-cols-2 gap-4 mb-4">
              <div class="file-info-json">
                <div class="json-line">
                  <span class="json-bracket">{'{'}</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "filename"</span><span class="json-punctuation">: </span>
                  <span class="json-string">"{truncateFilename(uploadResult.filename)}"</span><span class="json-punctuation">,</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "size_bytes"</span><span class="json-punctuation">: </span>
                  <span class="json-number">{uploadResult.size}</span><span class="json-punctuation">,</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "size_mb"</span><span class="json-punctuation">: </span>
                  <span class="json-number">{(uploadResult.size / 1024 / 1024).toFixed(2)}</span><span class="json-punctuation">,</span>
                </div>
                <div class="json-line">
                  <span class="json-key">  "expires_at"</span><span class="json-punctuation">: </span>
                  <span class="json-string">"{formatDate(uploadResult.expires_at)}"</span>
                </div>
                <div class="json-line">
                  <span class="json-bracket">{'}'}</span>
                </div>
              </div>

              <div class="code-block">
                <div class="text-secondary font-semibold mb-2">{t.upload.shareLink}</div>
                <p class="text-comment text-sm mb-2">{t.upload.copyToShare}:</p>
                <div class="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={uploadResult.shareableLink}
                    class="flex-1 form-input text-sm"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(uploadResult.shareableLink)}
                    class="btn btn-success text-sm whitespace-nowrap flex-shrink-0"
                  >
                    {t.upload.copy}
                  </button>
                </div>
              </div>
            </div>

            <div class="text-center">
              <button
                type="button"
                onClick={handleUploadAnother}
                class="btn btn-primary"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                </svg>
                {t.upload.readyForNext}
              </button>
            </div>
          </div>
        </div>
      )}

      <div class="ide-window">
        <div class="ide-header">
          <span class="text-function">uploadInfo()</span>
        </div>
        <div class="ide-body">
          <div class="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <div class="text-secondary font-semibold mb-2">{t.upload.fileLimits.title}</div>
              <div class="space-y-1 text-comment">
                {t.upload.fileLimits.items.map((item: string, index: number) => (
                  <div key={index}>{item}</div>
                ))}
              </div>
            </div>
            <div>
              <div class="text-secondary font-semibold mb-2">{t.upload.security.title}</div>
              <div class="space-y-1 text-comment">
                {t.upload.security.items.map((item: string, index: number) => (
                  <div key={index}>{item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}