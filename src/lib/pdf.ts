import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import puppeteer from 'puppeteer';

/**
 * Преобразует текстовый договор в PDF-документ
 * @param contractText Текст договора
 * @returns Буфер с содержимым PDF-документа
 */
export async function createContractPdf(contractText: string): Promise<Buffer> {
  // Создаем временные пути к файлам
  const tempId = uuidv4();
  const tempDir = path.join(process.cwd(), 'public', 'contracts', tempId);
  const htmlPath = path.join(tempDir, 'contract.html');
  const pdfPath = path.join(tempDir, 'contract.pdf');

  try {
    // Создаем HTML из текста договора
    const html = createHtmlFromText(contractText);

    // Создаем директорию, если она не существует
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Записываем HTML во временный файл
    fs.writeFileSync(htmlPath, html, 'utf-8');

    // Запускаем браузер и рендерим PDF
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();

      // Открываем HTML-файл
      await page.goto(`file://${htmlPath}`, {
        waitUntil: 'networkidle0',
      });

      // Генерируем PDF
      const pdfBuffer = await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm',
        },
        printBackground: true,
      });

      // Закрываем браузер
      await browser.close();

      // Возвращаем содержимое PDF
      return pdfBuffer;
    } finally {
      // Закрываем браузер в любом случае
      await browser.close();

      // Удаляем временные файлы
      try {
        if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
      } catch (err) {
        console.error('Ошибка при удалении временных файлов:', err);
      }
    }
  } catch (error) {
    console.error('Ошибка при создании PDF:', error);

    // Удаляем временные файлы при ошибке
    try {
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      if (fs.existsSync(tempDir)) fs.rmdirSync(tempDir);
    } catch (err) {
      console.error('Ошибка при удалении временных файлов:', err);
    }

    if (error instanceof Error) {
      throw new Error('Не удалось создать PDF-документ: ' + error.message);
    } else {
      throw new Error('Не удалось создать PDF-документ: неизвестная ошибка');
    }
  }
}

/**
 * Создает HTML из текста договора
 * @param text Текст договора
 * @returns HTML строка
 */
function createHtmlFromText(text: string): string {
  const lines = text.split('\n');
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Договор</title>
      <style>
        @font-face {
          font-family: 'Open Sans';
          src: url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap');
        }
        body {
          font-family: 'Open Sans', Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #000;
        }
        .title {
          font-weight: bold;
          font-size: 14pt;
          text-align: center;
          margin: 20px 0;
        }
        .header {
          font-weight: bold;
          font-size: 12pt;
          margin: 15px 0 10px 0;
        }
        .content {
          margin-bottom: 10px;
        }
        .signature {
          margin-top: 30px;
        }
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
  `;

  let inHeader = false;

  for (const line of lines) {
    if (line.trim() === '') {
      html += '<div style="height: 10px;"></div>';
      continue;
    }

    const isTitle = line.includes('=====');
    const isHeader = /^\d+\./.test(line) && !line.includes(':');

    if (isTitle) {
      html += `<div class="title">${line.replace(/=/g, '')}</div>`;
      inHeader = true;
    } else if (isHeader) {
      html += `<div class="header">${line}</div>`;
      inHeader = true;
    } else {
      if (inHeader) {
        html += `<div class="content">${line}</div>`;
        inHeader = false;
      } else {
        html += `<div>${line}</div>`;
      }
    }
  }

  html += `
    </body>
    </html>
  `;

  return html;
}
