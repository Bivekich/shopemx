'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { verificationFormSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type VerificationFormValues = z.infer<typeof verificationFormSchema>;

export function VerificationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [smsResendCooldown, setSmsResendCooldown] = useState(0);

  const form = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      emailCode: '',
      smsCode: '',
    },
  });

  // Обратный отсчет для кнопок повторной отправки
  useEffect(() => {
    let emailInterval: NodeJS.Timeout;
    let smsInterval: NodeJS.Timeout;

    if (emailResendCooldown > 0) {
      emailInterval = setInterval(() => {
        setEmailResendCooldown((prev) => prev - 1);
      }, 1000);
    }

    if (smsResendCooldown > 0) {
      smsInterval = setInterval(() => {
        setSmsResendCooldown((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      clearInterval(emailInterval);
      clearInterval(smsInterval);
    };
  }, [emailResendCooldown, smsResendCooldown]);

  const onSubmit = async (data: VerificationFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Проверяем, является ли ответ перенаправлением
      if (response.redirected) {
        // Если сервер перенаправляет, следуем по указанному URL
        window.location.href = response.url;
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        if (result.field === 'emailCode') {
          form.setError('emailCode', {
            message: result.message || 'Неверный код из email',
          });
        } else if (result.field === 'smsCode') {
          form.setError('smsCode', {
            message: result.message || 'Неверный код из SMS',
          });
        } else {
          toast.error(result.message || 'Произошла ошибка при верификации');
        }
        return;
      }

      // Успешная верификация, перенаправляем в личный кабинет
      router.push('/dashboard');
      toast.success('Верификация успешна!');
    } catch (error) {
      toast.error('Произошла ошибка при верификации');
      console.error('Verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async (type: 'email' | 'sms') => {
    try {
      const response = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      // Проверяем, является ли ответ перенаправлением
      if (response.redirected) {
        // Если сервер перенаправляет, следуем по указанному URL
        window.location.href = response.url;
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        toast.error(
          result.message ||
            `Не удалось отправить код на ${
              type === 'email' ? 'email' : 'телефон'
            }`
        );
        return;
      }

      // Устанавливаем таймер ожидания для повторной отправки (60 секунд)
      if (type === 'email') {
        setEmailResendCooldown(60);
      } else {
        setSmsResendCooldown(60);
      }

      toast.success(
        `Код отправлен на ваш ${type === 'email' ? 'email' : 'телефон'}`
      );
    } catch (error) {
      toast.error(
        `Не удалось отправить код на ${type === 'email' ? 'email' : 'телефон'}`
      );
      console.error('Resend code error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Подтверждение входа
        </CardTitle>
        <CardDescription className="text-center">
          Введите коды подтверждения, отправленные на ваш телефон и email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="smsCode"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Код из SMS</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendCode('sms')}
                      disabled={smsResendCooldown > 0 || isLoading}
                      className="h-8 px-2 text-xs"
                    >
                      {smsResendCooldown > 0
                        ? `Повторная отправка через ${smsResendCooldown} сек.`
                        : 'Отправить повторно'}
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={6}
                      placeholder="123456"
                      disabled={isLoading}
                      className="text-center text-lg tracking-widest"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailCode"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Код из Email</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendCode('email')}
                      disabled={emailResendCooldown > 0 || isLoading}
                      className="h-8 px-2 text-xs"
                    >
                      {emailResendCooldown > 0
                        ? `Повторная отправка через ${emailResendCooldown} сек.`
                        : 'Отправить повторно'}
                    </Button>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={6}
                      placeholder="123456"
                      disabled={isLoading}
                      className="text-center text-lg tracking-widest"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Подтвердить'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground text-center">
          Коды действительны в течение 15 минут. Если вы не получили код,
          проверьте папку &quot;Спам&quot; или воспользуйтесь кнопкой
          &quot;Отправить повторно&quot;.
        </p>
      </CardFooter>
    </Card>
  );
}
