'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Loader2, Check, X } from 'lucide-react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function UploadDocumentButton() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Проверяем, есть ли уже загруженный документ
  useEffect(() => {
    const checkUploadedDocument = async () => {
      try {
        const response = await fetch('/api/get-document');
        if (response.ok) {
          const data = await response.json();
          if (data.filePath) {
            setUploadedDocument(data.filePath);
          }
        }
      } catch (error) {
        console.error('Ошибка при получении информации о документе:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUploadedDocument();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    if (file) {
      // Проверка типа файла (только изображения)
      if (!file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите изображение');
        return;
      }

      // Проверка размера файла (максимум 5 МБ)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5 МБ');
        return;
      }

      setSelectedFile(file);

      // Создаем URL для предпросмотра
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);

      setIsDialogOpen(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при загрузке документа');
      }

      const data = await response.json();
      setUploadedDocument(data.filePath);
      toast.success('Документ успешно загружен');
      setIsDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error('Ошибка при загрузке документа:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при загрузке документа'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteDocument = async () => {
    if (!uploadedDocument) return;

    try {
      const response = await fetch('/api/delete-document', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при удалении документа');
      }

      setUploadedDocument(null);
      toast.success('Документ успешно удален');
    } catch (error) {
      console.error('Ошибка при удалении документа:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при удалении документа'
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Загрузка...</span>
      </div>
    );
  }

  if (uploadedDocument) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-green-600">
            <Check className="mr-2 h-5 w-5" />
            <span>Документ загружен</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500"
            onClick={handleDeleteDocument}
          >
            <X className="mr-2 h-4 w-4" />
            Удалить
          </Button>
        </div>
        <div className="border rounded-md p-2">
          <Image
            src={uploadedDocument}
            alt="Загруженный документ"
            className="max-h-[200px] object-contain mx-auto"
            width={400}
            height={200}
            style={{ objectFit: 'contain', maxHeight: '200px' }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <Button
        variant="outline"
        onClick={handleButtonClick}
        className="flex items-center"
      >
        <Upload className="mr-2 h-4 w-4" />
        Загрузить фото
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Загрузка документа</DialogTitle>
            <DialogDescription>
              Проверьте документ перед загрузкой
            </DialogDescription>
          </DialogHeader>

          {previewUrl && (
            <div className="flex justify-center p-2 border rounded-md">
              <Image
                src={previewUrl}
                alt="Предпросмотр документа"
                className="max-h-[300px] object-contain"
                width={600}
                height={300}
                style={{ objectFit: 'contain', maxHeight: '300px' }}
              />
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              disabled={isUploading}
            >
              Отмена
            </Button>

            <Button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                'Загрузить'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
