'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { registerFormSchema } from '@/lib/validations';
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
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      phone: searchParams.get('phone') || '',
      email: '',
      firstName: '',
      lastName: '',
      middleName: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
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
        if (response.status === 409) {
          // Пользователь уже существует
          if (result.field === 'email') {
            form.setError('email', {
              message: 'Пользователь с таким email уже существует',
            });
          } else {
            form.setError('phone', {
              message: 'Пользователь с таким номером телефона уже существует',
            });
          }
        } else {
          // Другие ошибки
          toast.error(result.message || 'Произошла ошибка при регистрации');
        }
        return;
      }

      // Успешная регистрация, перенаправляем на страницу верификации
      router.push('/verify');
      toast.success(
        'Регистрация успешна! Код подтверждения отправлен на ваш телефон и email'
      );
    } catch (error) {
      toast.error('Произошла ошибка при регистрации');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Регистрация
        </CardTitle>
        <CardDescription className="text-center">
          Создайте новую учетную запись в системе ShopEMX
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефона</FormLabel>
                  <FormControl>
                    <PhoneInput
                      {...field}
                      disabled={true} // Номер телефона нельзя редактировать
                      error={form.formState.errors.phone?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="example@mail.ru"
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Иванов"
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Иван"
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Отчество (если есть)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Иванович"
                      disabled={isLoading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isLoading}
                      error={form.formState.errors.password?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтверждение пароля</FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      disabled={isLoading}
                      error={form.formState.errors.confirmPassword?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agreeToTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Нажимая кнопку &quot;Создать учётную запись&quot;, вы
                      соглашаетесь с условиями следующих документов:
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      <Link
                        href="/agree.pdf"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Пользовательское соглашение
                      </Link>
                      {', '}
                      <Link
                        href="/public.pdf"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Условия покупки
                      </Link>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Регистрация...
                </>
              ) : (
                'Создать учётную запись'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" asChild>
          <Link href="/">Вернуться на страницу входа</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
