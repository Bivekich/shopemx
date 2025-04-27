'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
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
import { Textarea } from '@/components/ui/textarea';
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
import { Upload, Loader2 } from 'lucide-react';

// Схема валидации для формы продажи
const sellFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Обязательное поле')
    .max(300, 'Максимум 300 символов'),
  description: z
    .string()
    .min(1, 'Обязательное поле')
    .max(5000, 'Максимум 5000 символов'),
  price: z.string().refine(
    (val) => {
      if (!val || val === '') return true;
      return /^(?:\d{1,8}(?:,\d{0,2})?)?$/.test(val);
    },
    {
      message: 'Введите корректную цену (до 99999999,99)',
    }
  ),
  isFree: z.boolean().default(false),
  contractType: z.enum(['EXCLUSIVE_RIGHTS', 'LICENSE']),
  isExclusiveLicense: z.boolean().default(false),
  isPerpetualLicense: z.boolean().default(false),
  licenseDuration: z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        const num = parseInt(val, 10);
        return !isNaN(num) && num > 0 && num <= 99;
      },
      {
        message: 'Введите число от 1 до 99',
      }
    )
    .optional(),
  authorIsOwner: z.boolean().default(true),
  authorName: z.string().min(1, 'Введите ФИО автора').optional(),
});

// Тип для данных формы
type SellFormValues = z.infer<typeof sellFormSchema>;

// Тип для пользователя
interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  email: string;
  phone: string;
  role?: string;
}

// Свойства компонента формы продажи
interface SellFormProps {
  user: UserData;
}

export function SellForm({ user }: SellFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formValues, setFormValues] = useState<SellFormValues | null>(null);

  // Инициализация формы с react-hook-form
  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: '',
      isFree: false,
      contractType: 'EXCLUSIVE_RIGHTS',
      isExclusiveLicense: false,
      isPerpetualLicense: false,
      licenseDuration: '',
      authorIsOwner: true,
      authorName: `${user.lastName} ${user.firstName}${
        user.middleName ? ' ' + user.middleName : ''
      }`,
    },
  });

  // Отслеживание изменений в форме для условной логики
  const contractType = form.watch('contractType');
  const isFree = form.watch('isFree');
  const isPerpetualLicense = form.watch('isPerpetualLicense');
  const authorIsOwner = form.watch('authorIsOwner');

  // Обработка выбора файла
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFileError(null);

    if (!file) {
      setFileError('Выберите файл с произведением');
      return;
    }

    // Проверка размера файла (максимум 10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('Размер файла не должен превышать 10 МБ');
      event.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // Обработка отправки формы
  const onSubmit = (values: SellFormValues) => {
    if (!selectedFile) {
      setFileError('Выберите файл с произведением');
      return;
    }

    setFormValues(values);
    setShowConfirmDialog(true);
  };

  // Форматирование цены с учетом копеек
  const formatPrice = (priceStr: string): string => {
    if (!priceStr || priceStr === '') return '';

    // Заменяем точку на запятую для единообразия
    priceStr = priceStr.replace('.', ',');

    // Если нет запятой, добавляем ",00"
    if (!priceStr.includes(',')) {
      return `${priceStr},00`;
    }

    // Разделяем на целую и дробную части
    const [whole, fraction] = priceStr.split(',');

    // Если дробная часть имеет длину 1, добавляем 0
    if (fraction && fraction.length === 1) {
      return `${whole},${fraction}0`;
    }

    return priceStr;
  };

  // Обработка отправки подтвержденной формы
  const handleConfirmedSubmit = async () => {
    if (!formValues || !selectedFile) return;

    setIsLoading(true);

    try {
      // Создаем объект FormData для отправки файла и данных формы
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Форматируем цену перед отправкой, если она есть и сделка не безвозмездная
      const formattedPrice =
        !formValues.isFree && formValues.price
          ? formatPrice(formValues.price)
          : null;

      // Добавляем данные формы
      formData.append('title', formValues.title);
      formData.append('description', formValues.description);
      formData.append('isFree', String(formValues.isFree));

      if (!formValues.isFree && formattedPrice) {
        formData.append('price', formattedPrice);
      }

      formData.append('contractType', formValues.contractType);

      if (formValues.contractType === 'LICENSE') {
        formData.append(
          'isExclusiveLicense',
          String(formValues.isExclusiveLicense)
        );
        formData.append(
          'isPerpetualLicense',
          String(formValues.isPerpetualLicense)
        );

        if (!formValues.isPerpetualLicense && formValues.licenseDuration) {
          formData.append('licenseDuration', formValues.licenseDuration);
        }
      }

      formData.append('authorIsOwner', String(formValues.authorIsOwner));

      if (!formValues.authorIsOwner && formValues.authorName) {
        formData.append('authorName', formValues.authorName);
      }

      // Отправка данных на сервер
      const response = await fetch('/api/sell/create-offer', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Произошла ошибка при создании предложения'
        );
      }

      const data = await response.json();

      // Перенаправляем на страницу подтверждения
      window.location.href = `/sell/confirm/${data.offerId}`;
    } catch (error) {
      console.error('Ошибка при создании предложения:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при создании предложения'
      );
      setShowConfirmDialog(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Описание произведения</CardTitle>
                <CardDescription>
                  Укажите основную информацию о произведении, которое вы хотите
                  продать
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название произведения</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={300} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание произведения</FormLabel>
                      <FormControl>
                        <Textarea {...field} maxLength={5000} rows={5} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Цена произведения</CardTitle>
                <CardDescription>
                  Укажите цену произведения или выберите безвозмездную сделку
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Безвозмездная сделка
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена произведения (руб.)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isFree}
                          pattern="^[0-9]{1,8}(,[0-9]{0,2})?$"
                          placeholder={isFree ? 'Безвозмездная сделка' : '0,00'}
                          inputMode="decimal"
                          onChange={(e) => {
                            // Разрешаем только цифры и запятую
                            const value = e.target.value.replace(
                              /[^0-9,]/g,
                              ''
                            );
                            // Проверяем, соответствует ли формату цены
                            if (
                              value === '' ||
                              /^(?:\d{1,8}(?:,\d{0,2})?)?$/.test(value)
                            ) {
                              field.onChange(value);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Тип предложения</CardTitle>
                <CardDescription>
                  Выберите тип договора для передачи прав на произведение
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contractType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Выберите тип договора</FormLabel>
                      <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="EXCLUSIVE_RIGHTS"
                            checked={field.value === 'EXCLUSIVE_RIGHTS'}
                            onChange={() => field.onChange('EXCLUSIVE_RIGHTS')}
                            className="form-radio"
                          />
                          <span>Отчуждение исключительных прав</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            value="LICENSE"
                            checked={field.value === 'LICENSE'}
                            onChange={() => field.onChange('LICENSE')}
                            className="form-radio"
                          />
                          <span>Передача лицензионных прав</span>
                        </label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {contractType === 'LICENSE' && (
                  <div className="border p-4 rounded-md space-y-4">
                    <FormField
                      control={form.control}
                      name="isExclusiveLicense"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Исключительная лицензия
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isPerpetualLicense"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Бессрочная лицензия
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="licenseDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Срок действия лицензии (лет)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPerpetualLicense}
                              pattern="^[1-9][0-9]?$"
                              inputMode="numeric"
                              onChange={(e) => {
                                // Разрешаем только цифры
                                const value = e.target.value.replace(
                                  /[^0-9]/g,
                                  ''
                                );
                                // Проверяем, соответствует ли формату длительности
                                if (
                                  value === '' ||
                                  /^[0-9]{1,2}$/.test(value)
                                ) {
                                  field.onChange(value);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Электронный документ с произведением</CardTitle>
                <CardDescription>
                  Загрузите файл с произведением, который будет передан
                  покупателю
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-dashed border-2 rounded-md p-6 text-center">
                  <input
                    type="file"
                    id="artwork-file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor="artwork-file"
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      {selectedFile
                        ? selectedFile.name
                        : 'Нажмите для загрузки файла'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Разрешены форматы: PDF, DOC, DOCX, TXT, JPG, PNG (до 10
                      МБ)
                    </p>
                  </label>
                  {fileError && (
                    <p className="text-red-500 text-sm mt-2">{fileError}</p>
                  )}
                  {selectedFile && (
                    <p className="text-green-600 text-sm mt-2">
                      Файл выбран: {selectedFile.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Автор произведения</CardTitle>
                <CardDescription>
                  Укажите информацию об авторе произведения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="authorIsOwner"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Я являюсь автором произведения
                      </FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО автора произведения</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={authorIsOwner}
                          placeholder={
                            authorIsOwner
                              ? `${user.lastName} ${user.firstName}${
                                  user.middleName ? ' ' + user.middleName : ''
                                }`
                              : ''
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between pt-4">
            <Link href="/dashboard">
              <Button type="button" variant="outline">
                Вернуться в личный кабинет
              </Button>
            </Link>
            <Button type="submit">Сформировать предложение</Button>
          </div>
        </form>
      </Form>

      {/* Диалог подтверждения */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите сформировать предложение о продаже? После
              формирования предложения данные нельзя будет изменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Нет</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Подождите...
                </>
              ) : (
                'Да'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
