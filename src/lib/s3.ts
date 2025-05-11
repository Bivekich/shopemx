import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Получаем конфигурацию из переменных окружения
const s3Config = {
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'ru-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
  forcePathStyle: true,
};

// Инициализируем S3 клиент
const s3Client = new S3Client(s3Config);
const bucketName = process.env.S3_BUCKET || '';
const publicUrl = process.env.S3_PUBLIC_URL || '';

/**
 * Загрузка файла в S3 хранилище
 * @param key Путь к файлу в S3 хранилище
 * @param body Содержимое файла
 * @param contentType MIME-тип содержимого
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  try {
    // Добавляем параметр ContentEncoding для текстовых файлов с кириллицей
    const params: PutObjectCommandInput = {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    };

    // Для текстовых файлов явно указываем кодировку UTF-8
    if (contentType.startsWith('text/')) {
      params.ContentEncoding = 'utf-8';
    }

    const command = new PutObjectCommand(params);

    await s3Client.send(command);
    return `${publicUrl}/${key}`;
  } catch (error) {
    console.error('Ошибка при загрузке файла в S3:', error);
    throw new Error('Не удалось загрузить файл');
  }
}

/**
 * Получение файла из S3 хранилища
 * @param key Путь к файлу в S3 хранилище
 */
export async function getFile(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);

    // Преобразуем поток в буфер
    if (!response.Body) {
      throw new Error('Файл не найден');
    }

    const stream = response.Body as Readable;
    const chunks: Uint8Array[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  } catch (error) {
    console.error('Ошибка при получении файла из S3:', error);
    throw new Error('Не удалось получить файл');
  }
}

/**
 * Удаление файла из S3 хранилища
 * @param key Путь к файлу в S3 хранилище
 */
export async function deleteFile(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Ошибка при удалении файла из S3:', error);
    throw new Error('Не удалось удалить файл');
  }
}

/**
 * Получение публичного URL для файла
 * @param key Путь к файлу в S3 хранилище
 */
export function getPublicUrl(key: string): string {
  return `${publicUrl}/${key}`;
}

/**
 * Получение ключа из публичного URL
 * @param url Публичный URL файла
 */
export function getKeyFromUrl(url: string): string | null {
  if (!url || !url.includes(publicUrl)) {
    return null;
  }

  return url.replace(`${publicUrl}/`, '');
}

/**
 * Проверка, является ли URL файла S3 URL
 * @param url URL файла
 */
export function isS3Url(url: string): boolean {
  return url.startsWith(publicUrl);
}
