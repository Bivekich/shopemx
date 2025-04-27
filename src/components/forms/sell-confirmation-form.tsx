'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FileText, Eye } from 'lucide-react';

// Схема валидации для формы подтверждения
const confirmationSchema = z.object({
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Необходимо принять условия',
  }),
});

// Тип для данных формы
type ConfirmationFormValues = z.infer<typeof confirmationSchema>;

// Интерфейс для произведения
interface Artwork {
  id: string;
  title: string;
  description: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
}

// Интерфейс для предложения продажи
interface SellOffer {
  id: string;
  price: number | null;
  isFree: boolean;
  contractType: 'EXCLUSIVE_RIGHTS' | 'LICENSE';
  licenseType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | null;
  isExclusive: boolean | null;
  isPerpetual: boolean | null;
  licenseDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  artworkId: string;
  sellerId: string;
  buyerId: string | null;
  artwork: Artwork;
}

// Тип для пользователя
interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phone: string;
  role?: string;
  passportSeries?: string;
  passportNumber?: string;
  passportCode?: string;
  passportIssueDate?: string | Date;
  passportIssuedBy?: string;
  bankName?: string;
  bankBik?: string;
  bankAccount?: string;
  bankCorAccount?: string;
}

// Свойства компонента формы подтверждения
interface SellConfirmationFormProps {
  user: UserData;
  sellOffer: SellOffer;
}

export function SellConfirmationForm({
  user,
  sellOffer,
}: SellConfirmationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSmsVerification, setShowSmsVerification] = useState(false);
  const [showPasswordVerification, setShowPasswordVerification] =
    useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [password, setPassword] = useState('');

  // Инициализация формы с react-hook-form
  const form = useForm<ConfirmationFormValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  // Обработка отправки формы
  const onSubmit = async () => {
    setShowPasswordVerification(true);
  };

  // Обработка подтверждения пароля
  const handlePasswordConfirm = async () => {
    try {
      setIsLoading(true);

      // Проверка пароля
      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Неверный пароль');
      }

      // После подтверждения пароля, отправляем СМС код
      await sendSmsCode();

      setShowPasswordVerification(false);
      setShowSmsVerification(true);
    } catch (error) {
      console.error('Ошибка при проверке пароля:', error);
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  // Отправка SMS-кода
  const sendSmsCode = async () => {
    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'SMS' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Не удалось отправить SMS-код');
      }

      toast.success('SMS-код отправлен на ваш телефон');
    } catch (error) {
      console.error('Ошибка при отправке SMS-кода:', error);
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
    }
  };

  // Проверка SMS-кода и финальное подтверждение
  const handleSmsConfirm = async () => {
    try {
      setIsLoading(true);

      // Проверка SMS-кода
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: smsCode, type: 'SMS' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Неверный код подтверждения');
      }

      // Подтверждение предложения
      const confirmResponse = await fetch(
        `/api/sell/confirm-offer/${sellOffer.id}`,
        {
          method: 'POST',
        }
      );

      if (!confirmResponse.ok) {
        const data = await confirmResponse.json();
        throw new Error(data.message || 'Не удалось подтвердить предложение');
      }

      toast.success('Предложение успешно подтверждено');

      // Перенаправляем пользователя на страницу со списком предложений
      setTimeout(() => {
        window.location.href = '/dashboard?notification=offer_confirmed';
      }, 3000);
    } catch (error) {
      console.error('Ошибка при подтверждении предложения:', error);
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
      setShowSmsVerification(false);
    }
  };

  // Генерация превью договора
  const generateContractPreview = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/sell/preview-contract/${sellOffer.id}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Не удалось сгенерировать договор');
      }

      const data = await response.json();

      // Открываем превью договора в новом окне
      if (data.previewUrl) {
        window.open(data.previewUrl, '_blank');
      }
    } catch (error) {
      console.error('Ошибка при генерации превью договора:', error);
      toast.error(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  // Просмотр PDF-шаблона контракта
  const handleViewPdfTemplate = () => {
    window.open('/public.pdf', '_blank');
  };

  // Форматирование цены
  const formatPrice = (price: number | null, isFree: boolean) => {
    if (isFree) return 'Безвозмездная сделка';
    if (price === null) return '0,00 руб.';

    // Форматирование цены с разделителем тысяч и копейками
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Получение типа договора в текстовом виде
  const getContractTypeText = (
    contractType: 'EXCLUSIVE_RIGHTS' | 'LICENSE',
    licenseType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | null
  ) => {
    if (contractType === 'EXCLUSIVE_RIGHTS') {
      return 'Отчуждение исключительных прав';
    } else {
      return licenseType === 'EXCLUSIVE'
        ? 'Передача лицензионных прав (исключительная лицензия)'
        : 'Передача лицензионных прав (неисключительная лицензия)';
    }
  };

  // Получение срока лицензии в текстовом виде
  const getLicenseDurationText = (
    isPerpetual: boolean | null,
    duration: number | null
  ) => {
    if (isPerpetual) return 'Бессрочная лицензия';
    return duration
      ? `${duration} ${getDurationYearText(duration)}`
      : 'Не указано';
  };

  // Склонение слова "год" в зависимости от числа
  const getDurationYearText = (years: number) => {
    if (years % 10 === 1 && years % 100 !== 11) {
      return 'год';
    } else if (
      [2, 3, 4].includes(years % 10) &&
      ![12, 13, 14].includes(years % 100)
    ) {
      return 'года';
    } else {
      return 'лет';
    }
  };

  // Форматирование даты
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Информация о продавце</CardTitle>
                <CardDescription>
                  Личные данные продавца, указанные в договоре
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      ФИО
                    </p>
                    <p>
                      {user.lastName} {user.firstName} {user.middleName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Телефон
                    </p>
                    <p>{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Паспортные данные
                    </p>
                    <p>
                      {user.passportSeries} {user.passportNumber}, выдан{' '}
                      {user.passportCode},{' '}
                      {user.passportIssueDate
                        ? new Date(user.passportIssueDate).toLocaleDateString(
                            'ru-RU'
                          )
                        : ''}
                      , {user.passportIssuedBy}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Информация о произведении</CardTitle>
                <CardDescription>
                  Данные о произведении, которое вы хотите продать
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Название произведения
                    </p>
                    <p>{sellOffer.artwork.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Дата создания предложения
                    </p>
                    <p>{formatDate(sellOffer.createdAt)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Описание произведения
                    </p>
                    <p className="whitespace-pre-wrap">
                      {sellOffer.artwork.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-medium">Файл произведения</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={sellOffer.artwork.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Просмотреть произведение</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Условия договора</CardTitle>
                <CardDescription>
                  Условия передачи прав на произведение
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Тип договора
                    </p>
                    <p>
                      {getContractTypeText(
                        sellOffer.contractType,
                        sellOffer.licenseType
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Цена произведения
                    </p>
                    <p>{formatPrice(sellOffer.price, sellOffer.isFree)}</p>
                  </div>
                  {sellOffer.contractType === 'LICENSE' && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                          Срок действия лицензии
                        </p>
                        <p>
                          {getLicenseDurationText(
                            sellOffer.isPerpetual,
                            sellOffer.licenseDuration
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateContractPreview}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Предварительный просмотр договора
                  </Button>
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="acceptTerms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded-md">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-normal">
                      Я подтверждаю, что все указанные данные верны, и я
                      согласен с условиями договора
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Вернуться в личный кабинет
              </Button>
            </Link>

            <Button
              type="button"
              variant="secondary"
              onClick={handleViewPdfTemplate}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Просмотреть шаблон PDF
            </Button>

            <Button type="submit" className="flex-1">
              Подтвердить и подписать
            </Button>
          </div>
        </form>
      </Form>

      {/* Диалог подтверждения паролем */}
      <AlertDialog
        open={showPasswordVerification}
        onOpenChange={setShowPasswordVerification}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение пароля</AlertDialogTitle>
            <AlertDialogDescription>
              Для продолжения необходимо подтвердить ваш пароль.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordConfirm}
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Подождите...
                </>
              ) : (
                'Подтвердить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения SMS-кодом */}
      <AlertDialog
        open={showSmsVerification}
        onOpenChange={setShowSmsVerification}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение по SMS</AlertDialogTitle>
            <AlertDialogDescription>
              На ваш телефон отправлен SMS-код. Введите его для подтверждения.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Введите SMS-код"
              value={smsCode}
              onChange={(e) => setSmsCode(e.target.value)}
              className="mb-2"
            />
            <Button
              variant="link"
              className="px-0 text-xs"
              onClick={sendSmsCode}
              disabled={isLoading}
            >
              Отправить код повторно
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSmsConfirm}
              disabled={isLoading || !smsCode}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Подождите...
                </>
              ) : (
                'Подтвердить'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
