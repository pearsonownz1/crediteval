export interface DocumentState {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  path?: string;
  progress?: number;
  error?: string;
}
