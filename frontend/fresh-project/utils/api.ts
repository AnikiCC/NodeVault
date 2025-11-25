import { UploadResponse } from "@/types/types.ts";

const API_BASE = "http://localhost:8080";

export class NodeVaultAPI {
  static async uploadFile(
    file: File,
    ttl: number = 3600
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ttl", ttl.toString());

    const response = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  static async downloadFile(cid: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/download/${cid}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Download failed: ${response.status} - ${errorText}`);
    }

    return response.blob();
  }

  static async getHealth(): Promise<any> {
    const response = await fetch(`${API_BASE}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return response.json();
  }
}