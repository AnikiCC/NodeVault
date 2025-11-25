
export class UploadHistory {
  static addItem(
    cid: string,
    filename: string, 
    size: number, 
    expiresAt: string, 
    encrypted: boolean = false,
    encryptionInfo: any = undefined
  ): void {
    console.log("Файл загружен (E2E):", { cid, filename, size });
  }

  static getHistory(): any[] {
    return [];
  }

  static getEncryptionInfo(cid: string): any {
    return null;
  }
}

export class JsonStorage {
  static exportData(): Blob {
    const data = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      message: "E2E шифрование - данные не сохраняются локально"
    };
    return new Blob([JSON.stringify(data, null, 2)], { 
      type: "application/json" 
    });
  }

  static importData(file: File): Promise<void> {
    return Promise.reject(new Error("Импорт не поддерживается в E2E режиме"));
  }
}