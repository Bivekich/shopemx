import { prisma } from './prisma';
import { VerificationStatus, VerificationType } from './types';
import nodemailer from 'nodemailer';
import axios from 'axios';

// Функция для генерации случайного кода
export function generateVerificationCode(length = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
}

// Функция для создания верификационного кода в базе данных
export async function createVerificationCode(
  userId: string,
  type: VerificationType,
  expiresInMinutes = 15
) {
  const code = generateVerificationCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

  const verificationCode = await prisma.verificationCode.create({
    data: {
      code,
      type,
      expiresAt,
      userId,
    },
  });

  return verificationCode;
}

// Функция для проверки верификационного кода
export async function verifyCode(
  userId: string,
  code: string,
  type: VerificationType
) {
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      userId,
      code,
      type,
      status: VerificationStatus.PENDING,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!verificationCode) {
    return false;
  }

  await prisma.verificationCode.update({
    where: {
      id: verificationCode.id,
    },
    data: {
      status: VerificationStatus.VERIFIED,
    },
  });

  return true;
}

// Функция для отправки кода по электронной почте
export async function sendEmailVerificationCode(
  email: string,
  code: string,
  verificationCodeId: string
) {
  try {
    // Настройка транспорта для отправки email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Добавляем дополнительные настройки для предотвращения использования IP вместо домена
      tls: {
        // Отключаем проверку сертификата, если возникают проблемы с SSL
        rejectUnauthorized: false,
      },
      // Принудительно используем доменное имя вместо IP
      name: process.env.SMTP_HOST,
    });

    // Отправка email
    await transporter.sendMail({
      from: `"ShopEMX" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Код подтверждения для ShopEMX',
      text: `Ваш код подтверждения: ${code}. Он действителен в течение 15 минут.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Код подтверждения для ShopEMX</h2>
          <p>Ваш код подтверждения:</p>
          <div style="background-color: #f5f5f5; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 20px 0;">
            ${code}
          </div>
          <p>Код действителен в течение 15 минут.</p>
          <p>Если вы не запрашивали этот код, пожалуйста, проигнорируйте это сообщение.</p>
        </div>
      `,
    });

    // Обновляем информацию о последней отправке
    await prisma.verificationCode.update({
      where: {
        id: verificationCodeId,
      },
      data: {
        lastSentAt: new Date(),
        sendAttempts: {
          increment: 1,
        },
      },
    });

    return true;
  } catch (error) {
    console.error('Ошибка при отправке email:', error);
    return false;
  }
}

// Функция для отправки SMS через SMS Aero
export async function sendSmsVerificationCode(
  phone: string,
  code: string,
  verificationCodeId: string
) {
  try {
    const smsAeroEmail = process.env.SMS_AERO_EMAIL;
    const smsAeroApiKey = process.env.SMS_AERO_API_KEY;
    const smsAeroFrom = process.env.SMS_AERO_FROM || 'ShopEMX';

    if (!smsAeroEmail || !smsAeroApiKey) {
      throw new Error('SMS Aero credentials not configured');
    }

    // Базовая аутентификация для SMS Aero
    const auth = Buffer.from(`${smsAeroEmail}:${smsAeroApiKey}`).toString(
      'base64'
    );

    // Отправка SMS через API SMS Aero
    const response = await axios.get('https://gate.smsaero.ru/v2/sms/send', {
      params: {
        number: phone.replace(/\D/g, ''), // Удаляем все нецифровые символы
        text: `Код подтверждения: ${code}. Действителен 15 минут.`,
        sign: smsAeroFrom,
      },
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (response.data.success) {
      // Обновляем информацию о последней отправке
      await prisma.verificationCode.update({
        where: {
          id: verificationCodeId,
        },
        data: {
          lastSentAt: new Date(),
          sendAttempts: {
            increment: 1,
          },
        },
      });
      return true;
    } else {
      console.error('Ошибка при отправке SMS:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Ошибка при отправке SMS:', error);
    return false;
  }
}

// Функция для проверки возможности повторной отправки кода
export async function canResendCode(
  verificationCodeId: string,
  cooldownMinutes = 5
) {
  const verificationCode = await prisma.verificationCode.findUnique({
    where: {
      id: verificationCodeId,
    },
  });

  if (!verificationCode) {
    return false;
  }

  // Проверяем, прошло ли достаточно времени с момента последней отправки
  const cooldownTime = new Date(verificationCode.lastSentAt);
  cooldownTime.setMinutes(cooldownTime.getMinutes() + cooldownMinutes);

  // Проверяем, не превышено ли максимальное количество попыток
  const maxAttempts = 5;
  if (verificationCode.sendAttempts >= maxAttempts) {
    return false;
  }

  return new Date() > cooldownTime;
}

// Функция для отправки уведомления о входе в аккаунт
export async function sendLoginNotification(
  email: string,
  userInfo: {
    firstName: string;
    lastName: string;
    ip?: string;
    userAgent?: string;
    time: string;
  }
) {
  try {
    // Настройка транспорта для отправки email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Добавляем дополнительные настройки для предотвращения использования IP вместо домена
      tls: {
        // Отключаем проверку сертификата, если возникают проблемы с SSL
        rejectUnauthorized: false,
      },
      // Принудительно используем доменное имя вместо IP
      name: process.env.SMTP_HOST,
    });

    // Отправка email
    await transporter.sendMail({
      from: `"ShopEMX" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Вход в аккаунт ShopEMX',
      text: `Уважаемый ${userInfo.firstName} ${
        userInfo.lastName
      }, был выполнен вход в ваш аккаунт ShopEMX.

Время входа: ${userInfo.time}
IP-адрес: ${userInfo.ip || 'Не определен'}
Устройство: ${userInfo.userAgent || 'Не определено'}

Если это были не вы, немедленно смените пароль и свяжитесь с поддержкой.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333;">Вход в аккаунт ShopEMX</h2>
          <p>Уважаемый ${userInfo.firstName} ${userInfo.lastName},</p>
          <p>Был выполнен вход в ваш аккаунт ShopEMX.</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Время входа:</strong> ${
              userInfo.time
            }</p>
            <p style="margin: 5px 0;"><strong>IP-адрес:</strong> ${
              userInfo.ip || 'Не определен'
            }</p>
            <p style="margin: 5px 0;"><strong>Устройство:</strong> ${
              userInfo.userAgent || 'Не определено'
            }</p>
          </div>

          <p style="color: #d32f2f; font-weight: bold;">Если это были не вы, немедленно смените пароль и свяжитесь с поддержкой.</p>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">Это автоматическое уведомление, пожалуйста, не отвечайте на него.</p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления о входе:', error);
    return false;
  }
}
