export class EncryptionManager {
  // Шифрование файла с возвратом ключа, IV и метаданных
  static async encryptFile(file: File): Promise<{
    data: ArrayBuffer;
    iv: Uint8Array;
    keyData: Uint8Array;
    metadata: {
      filename: string;
      type: string;
      size: number;
      lastModified: number;
    };
  }> {
    try {
      console.log("Шифруем файл...");
      
      // Генерируем ключ для этого файла
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );

      const exported = await crypto.subtle.exportKey("raw", key);
      const keyData = new Uint8Array(exported);
      
      // Генерируем случайный IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const fileBuffer = await file.arrayBuffer();
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        fileBuffer
      );

      console.log("Файл зашифрован");

      return {
        data: encryptedData,
        iv,
        keyData,
        metadata: {
          filename: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified
        }
      };
    } catch (error) {
      console.error("Ошибка шифрования:", error);
      throw new Error(`Ошибка шифрования файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }

  // Дешифрование с переданным ключом и IV
  static async decryptFile(
    encryptedData: ArrayBuffer, 
    keyData: Uint8Array, 
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    try {
      console.log("Дешифруем файл...");
      
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM", length: 256 },
        true,
        ["decrypt"]
      );

      const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encryptedData
      );

      console.log("Файл дешифрован");
      return decryptedData;
    } catch (error) {
      console.error("Ошибка дешифрования:", error);
      throw new Error("Ошибка дешифрования: неверный ключ или файл поврежден");
    }
  }

  // Конвертация в base64 для передачи
  static uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  // Конвертация base64 обратно в Uint8Array
  static base64ToUint8Array(base64: string): Uint8Array {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      throw new Error("Неверный формат данных");
    }
  }

  // Создание объекта с ключом, IV и метаданными для передачи
  static createEncryptionPayload(
    keyData: Uint8Array, 
    iv: Uint8Array,
    metadata: { filename: string; type: string; size: number; lastModified: number }
  ): string {
    const payload = {
      key: this.uint8ArrayToBase64(keyData),
      iv: this.uint8ArrayToBase64(iv),
      metadata: metadata
    };
    return btoa(JSON.stringify(payload));
  }

  // Парсинг объекта с ключом, IV и метаданными
  static parseEncryptionPayload(payload: string): { 
    key: Uint8Array; 
    iv: Uint8Array;
    metadata: { filename: string; type: string; size: number; lastModified: number };
  } {
    try {
      const decoded = atob(payload);
      const { key, iv, metadata } = JSON.parse(decoded);
      return {
        key: this.base64ToUint8Array(key),
        iv: this.base64ToUint8Array(iv),
        metadata: metadata
      };
    } catch (error) {
      throw new Error("Неверный формат payload");
    }
  }
}