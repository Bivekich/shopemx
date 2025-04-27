/**
 * Модуль для отправки SMS-сообщений
 * В боевом режиме необходимо интегрировать реальный сервис отправки SMS
 */

// Типы для конфигурации SMS-провайдера
type SmsProviderConfig = {
  apiKey: string;
  sender: string;
  baseUrl: string;
};

// Конфигурация SMS-провайдера (в реальном проекте брать из переменных окружения)
const smsConfig: SmsProviderConfig = {
  apiKey: process.env.SMS_API_KEY || 'test-api-key',
  sender: process.env.SMS_SENDER || 'ShopEMX',
  baseUrl: process.env.SMS_BASE_URL || 'https://api.sms-provider.com/v1',
};

/**
 * Нормализует номер телефона в формат E.164 (без плюса)
 * @param phone Номер телефона для нормализации
 * @returns Нормализованный номер или null если формат неверный
 */
function normalizePhoneNumber(phone: string): string | null {
  // Убираем все нецифровые символы
  const digits = phone.replace(/\D/g, '');

  // Проверяем, что номер начинается с 7 или 8 и имеет 11 цифр (для России)
  if (
    (digits.startsWith('7') || digits.startsWith('8')) &&
    digits.length === 11
  ) {
    // Возвращаем в формате 7XXXXXXXXXX
    return '7' + digits.substring(1);
  }

  // Если номер начинается с кода страны (например, +7) и имеет верную длину
  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
}

/**
 * Отправляет SMS на указанный номер телефона
 * @param phone Номер телефона получателя
 * @param message Текст сообщения
 * @returns Promise с результатом отправки
 */
export async function sendSms(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      console.error(`Неверный формат номера телефона: ${phone}`);
      return false;
    }

    // В production режиме отправляем через API
    if (process.env.NODE_ENV === 'production') {
      const response = await fetch(smsConfig.baseUrl + '/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${smsConfig.apiKey}`,
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          message,
          sender: smsConfig.sender,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Ошибка при отправке SMS:', errorData);
        return false;
      }

      return true;
    }

    // В dev-режиме просто логируем сообщение
    console.log(`[ТЕСТОВЫЙ РЕЖИМ] SMS для ${normalizedPhone}: ${message}`);
    return true;
  } catch (error) {
    console.error('Ошибка при отправке SMS:', error);
    return false;
  }
}
