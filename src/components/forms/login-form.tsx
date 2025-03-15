'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { loginFormSchema, phoneSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
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

// Схема для первого шага (только номер телефона)
const phoneFormSchema = z.object({
  phone: phoneSchema,
});

type PhoneFormValues = z.infer<typeof phoneFormSchema>;
type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Форма для первого шага (только номер телефона)
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: {
      phone: '',
    },
  });

  // Форма для второго шага (пароль)
  const passwordForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  // Обработчик отправки формы с номером телефона
  const onPhoneSubmit = async (data: PhoneFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/check-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // Пользователь не найден
          setShowRegisterPrompt(true);
          phoneForm.setError('phone', {
            message: 'Пользователь с таким номером не найден',
          });
        } else {
          // Другие ошибки
          toast.error(
            result.message || 'Произошла ошибка при проверке номера телефона'
          );
        }
        return;
      }

      // Пользователь найден, переходим к вводу пароля
      setPhoneNumber(data.phone);
      setShowPasswordField(true);
      passwordForm.setValue('phone', data.phone);
    } catch (error) {
      toast.error('Произошла ошибка при проверке номера телефона');
      console.error('Phone check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик отправки формы с паролем
  const onPasswordSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
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

      // Если это не перенаправление, пробуем разобрать JSON
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Неверный пароль
          passwordForm.setError('password', { message: 'Неверный пароль' });
        } else {
          // Другие ошибки
          toast.error(result.message || 'Произошла ошибка при входе');
        }
        return;
      }

      // Успешный вход, перенаправляем на страницу верификации
      router.push('/verify');
      toast.success('Код подтверждения отправлен на ваш телефон и email');
    } catch (error) {
      toast.error('Произошла ошибка при входе');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    const phone = phoneForm.getValues('phone');
    router.push(`/register?phone=${encodeURIComponent(phone)}`);
  };

  const handleBackToPhone = () => {
    setShowPasswordField(false);
    setShowRegisterPrompt(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Вход в систему
        </CardTitle>
        <CardDescription className="text-center">
          {showPasswordField
            ? 'Введите пароль для входа'
            : 'Введите ваш номер телефона для входа'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showPasswordField ? (
          // Форма для ввода номера телефона
          <Form {...phoneForm}>
            <form
              onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}
              className="space-y-4"
            >
              <FormField
                control={phoneForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Номер телефона</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        disabled={isLoading}
                        error={phoneForm.formState.errors.phone?.message}
                      />
                    </FormControl>
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
                  'Продолжить'
                )}
              </Button>
            </form>
          </Form>
        ) : (
          // Форма для ввода пароля
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="mb-4">
                <FormLabel className="block mb-1">Номер телефона</FormLabel>
                <div className="flex items-center">
                  <p className="text-sm">{phoneNumber}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-8 px-2 text-xs"
                    onClick={handleBackToPhone}
                  >
                    Изменить
                  </Button>
                </div>
              </div>

              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <PasswordInput
                        {...field}
                        disabled={isLoading}
                        error={passwordForm.formState.errors.password?.message}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Вход...
                  </>
                ) : (
                  'Войти'
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>

      {showRegisterPrompt && (
        <CardFooter className="flex flex-col space-y-4 border-t pt-4">
          <p className="text-sm text-center">
            Пользователь с таким номером телефона не найден. Хотите создать
            новую учетную запись?
          </p>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowRegisterPrompt(false)}
            >
              Нет
            </Button>
            <Button className="flex-1" onClick={handleCreateAccount}>
              Да, создать
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
