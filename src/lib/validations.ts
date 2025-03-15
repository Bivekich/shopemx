import { z } from 'zod';

// Регулярное выражение для проверки российского номера телефона
const phoneRegex =
  /^(\+7|7|8)?[\s\-]?\(?[9][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;

// Схема для валидации номера телефона
export const phoneSchema = z
  .string()
  .min(1, { message: 'Номер телефона обязателен' })
  .regex(phoneRegex, {
    message: 'Введите корректный российский номер телефона',
  });

// Схема для валидации пароля
export const passwordSchema = z
  .string()
  .min(8, { message: 'Пароль должен содержать минимум 8 символов' })
  .regex(/[A-Z]/, {
    message: 'Пароль должен содержать хотя бы одну заглавную букву',
  })
  .regex(/[a-z]/, {
    message: 'Пароль должен содержать хотя бы одну строчную букву',
  })
  .regex(/[0-9]/, { message: 'Пароль должен содержать хотя бы одну цифру' })
  .regex(/[^A-Za-z0-9]/, {
    message: 'Пароль должен содержать хотя бы один специальный символ',
  });

// Схема для валидации кода подтверждения
export const verificationCodeSchema = z
  .string()
  .length(6, { message: 'Код подтверждения должен содержать 6 цифр' })
  .regex(/^\d+$/, {
    message: 'Код подтверждения должен содержать только цифры',
  });

// Схема для валидации формы входа
export const loginFormSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, { message: 'Пароль обязателен' }),
});

// Схема для валидации формы регистрации
export const registerFormSchema = z
  .object({
    phone: phoneSchema,
    email: z
      .string()
      .min(1, { message: 'Email обязателен' })
      .email({ message: 'Введите корректный email' }),
    firstName: z
      .string()
      .min(1, { message: 'Имя обязательно' })
      .regex(/^[А-Яа-яЁё]+$/, {
        message: 'Имя должно содержать только русские буквы',
      }),
    lastName: z
      .string()
      .min(1, { message: 'Фамилия обязательна' })
      .regex(/^[А-Яа-яЁё]+$/, {
        message: 'Фамилия должна содержать только русские буквы',
      }),
    middleName: z
      .string()
      .optional()
      .refine((val) => !val || /^[А-Яа-яЁё]+$/.test(val), {
        message: 'Отчество должно содержать только русские буквы',
      }),
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { message: 'Подтверждение пароля обязательно' }),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'Вы должны согласиться с условиями',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

// Схема для валидации формы подтверждения
export const verificationFormSchema = z.object({
  emailCode: verificationCodeSchema,
  smsCode: verificationCodeSchema,
});

// Функция для форматирования российского номера телефона
export function formatRussianPhoneNumber(phone: string): string {
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');

  // Если номер начинается с 8 или 7, считаем его российским
  if (digits.length === 11 && (digits[0] === '8' || digits[0] === '7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(
      7,
      9
    )}-${digits.slice(9, 11)}`;
  }

  // Если номер начинается с 9 и имеет 10 цифр, добавляем +7
  if (digits.length === 10 && digits[0] === '9') {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(
      6,
      8
    )}-${digits.slice(8, 10)}`;
  }

  // Возвращаем исходный номер, если он не соответствует формату
  return phone;
}

// Функция для нормализации номера телефона (приведение к формату +7XXXXXXXXXX)
export function normalizePhoneNumber(phone: string): string {
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '');

  // Если номер начинается с 8 или 7, считаем его российским
  if (digits.length === 11 && (digits[0] === '8' || digits[0] === '7')) {
    return `+7${digits.slice(1)}`;
  }

  // Если номер начинается с 9 и имеет 10 цифр, добавляем +7
  if (digits.length === 10 && digits[0] === '9') {
    return `+7${digits}`;
  }

  // Возвращаем исходный номер, если он не соответствует формату
  return phone;
}
