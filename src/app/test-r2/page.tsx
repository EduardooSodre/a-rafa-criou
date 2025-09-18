'use client'

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, CheckCircle, XCircle } from "lucide-react";

interface UploadResult {
  success: boolean
  data: {
    key: string
    originalName: string
    size: number
    type: string
    url: string
  }
}

export default function TestR2Page() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      setDownloadUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/r2/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro no upload");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateDownloadUrl = async () => {
    if (!result?.data?.key) return;

    try {
      const response = await fetch("/api/download/signed-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileKey: result.data.key,
          expiresInSeconds: 300, // 5 minutos
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar URL");
      }

      setDownloadUrl(data.signedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Teste Cloudflare R2 - Upload de PDFs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Selecione um arquivo PDF:
              </label>
              <Input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
            </div>

            {file && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm">
                  <strong>Arquivo:</strong> {file.name}
                </p>
                <p className="text-sm">
                  <strong>Tamanho:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full"
            >
              {uploading ? "Enviando..." : "Enviar para R2"}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Result */}
          {result && (
            <Alert>
              <CheckCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>✅ Upload realizado com sucesso!</p>
                  <div className="bg-white p-2 rounded border text-xs font-mono">
                    <p><strong>Chave:</strong> {result.data.key}</p>
                    <p><strong>Nome:</strong> {result.data.originalName}</p>
                    <p><strong>Tamanho:</strong> {(result.data.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Tipo:</strong> {result.data.type}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Download Section */}
          {result && (
            <div className="space-y-4">
              <Button
                onClick={handleGenerateDownloadUrl}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Gerar URL de Download (5 min)
              </Button>

              {downloadUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">URL Assinada Gerada:</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-xs font-mono break-all mb-2">
                      {downloadUrl}
                    </p>
                    <Button
                      onClick={() => window.open(downloadUrl, "_blank")}
                      size="sm"
                      className="w-full"
                    >
                      Testar Download
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    ⚠️ Esta URL expira em 5 minutos
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}