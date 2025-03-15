import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирует дату в локализованный формат
 * @param date Дата для форматирования (строка или объект Date)
 * @param locale Локаль для форматирования (по умолчанию ru-RU)
 * @returns Отформатированная строка даты
 */
export function formatDate(
  date: string | Date | null | undefined,
  locale: string = 'ru-RU'
): string {
  if (!date) return '—';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return '—';
  }
}
