export interface UploadResponse {
  status: string;
  cid: string;
  filename: string;
  expires_at: string;
  size: number;
  ttl: number;
}

// Добавляем интерфейс для метаданных файла
export interface FileMetadata {
  filename: string;
  type: string;
  size: number;
  lastModified: number;
}