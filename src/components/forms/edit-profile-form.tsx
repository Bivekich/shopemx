'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';

// Схема валидации для формы
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно для заполнения'),
  lastName: z.string().min(1, 'Фамилия обязательна для заполнения'),
  middleName: z.string().optional(),
  email: z
    .string()
    .min(1, 'Электронная почта обязательна для заполнения')
    .email('Введите корректный адрес электронной почты')
    .refine(
      (email) => {
        const parts = email.split('@');
        if (parts.length !== 2) return false;

        const [localPart, domainPart] = parts;
        if (localPart.length > 30) return false;

        const domainParts = domainPart.split('.');
        if (domainParts.length < 2) return false;

        const tld = domainParts[domainParts.length - 1];
        if (tld.length > 5) return false;

        const domainName = domainPart.substring(
          0,
          domainPart.length - tld.length - 1
        );
        if (domainName.length > 30) return false;

        return true;
      },
      {
        message:
          'Адрес электронной почты должен соответствовать ограничениям: до 30 символов до @, до 30 символов после @ и до 5 символов после точки',
      }
    ),
  phone: z.string().min(1, 'Телефон обязателен для заполнения'),
  birthDate: z
    .string()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;

        const date = new Date(val);
        const now = new Date();
        const minDate = new Date('1900-01-01');

        return !isNaN(date.getTime()) && date <= now && date >= minDate;
      },
      {
        message:
          'Дата рождения должна быть корректной, не ранее 1900 года и не в будущем',
      }
    )
    .optional(),
  passportSeries: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{4}$/.test(val), {
      message: 'Серия паспорта должна содержать 4 цифры',
    })
    .optional(),
  passportNumber: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{6}$/.test(val), {
      message: 'Номер паспорта должен содержать 6 цифр',
    })
    .optional(),
  passportCode: z
    .string()
    .refine((val) => !val || val.length === 0 || /^\d{3}-\d{3}$/.test(val), {
      message: 'Код подразделения должен быть в формате XXX-XXX',
    })
    .optional(),
  passportIssueDate: z
    .string()
    .refine(
      (val) => {
        if (!val || val.length === 0) return true;

        const date = new Date(val);
        const now = new Date();
        const minDate = new Date('1991-01-01'); // Минимальная дата - 1991 год (распад СССР)

        return !isNaN(date.getTime()) && date <= now && date >= minDate;
      },
      {
        message:
          'Дата выдачи паспорта должна быть не ранее 1991 года и не в будущем',
      }
    )
    .optional(),
  passportIssuedBy: z
    .string()
    .min(5, 'Укажите полное название органа, выдавшего паспорт')
    .optional(),
  useAlternativeDocument: z.boolean().default(false),
  alternativeDocument: z
    .string()
    .max(100, 'Максимальная длина - 100 символов')
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileFormProps {
  user: {
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    phone: string;
    birthDate?: string;
    passportSeries?: string;
    passportNumber?: string;
    passportCode?: string;
    passportIssueDate?: string;
    passportIssuedBy?: string;
    useAlternativeDocument?: boolean;
    alternativeDocument?: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function EditProfileForm({
  user,
  onCancel,
  onSuccess,
}: EditProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [formData, setFormData] = useState<ProfileFormValues | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      middleName: user.middleName || '',
      email: user.email || '',
      phone: user.phone || '',
      birthDate: user.birthDate || '',
      passportSeries: user.passportSeries || '',
      passportNumber: user.passportNumber || '',
      passportCode: user.passportCode || '',
      passportIssueDate: user.passportIssueDate || '',
      passportIssuedBy: user.passportIssuedBy || '',
      useAlternativeDocument: user.useAlternativeDocument || false,
      alternativeDocument: user.alternativeDocument || '',
    },
  });

  const useAlternativeDocument = form.watch('useAlternativeDocument');

  // Отслеживаем изменения формы
  const watchedValues = form.watch();

  // Проверяем, были ли внесены изменения в форму
  const checkFormChanged = () => {
    const hasChanged =
      watchedValues.firstName !== user.firstName ||
      watchedValues.lastName !== user.lastName ||
      watchedValues.middleName !== (user.middleName || '') ||
      watchedValues.email !== user.email ||
      watchedValues.phone !== user.phone ||
      watchedValues.birthDate !== (user.birthDate || '') ||
      watchedValues.passportSeries !== (user.passportSeries || '') ||
      watchedValues.passportNumber !== (user.passportNumber || '') ||
      watchedValues.passportCode !== (user.passportCode || '') ||
      watchedValues.passportIssueDate !== (user.passportIssueDate || '') ||
      watchedValues.passportIssuedBy !== (user.passportIssuedBy || '') ||
      watchedValues.useAlternativeDocument ||
      (watchedValues.useAlternativeDocument &&
        watchedValues.alternativeDocument !== '');

    return hasChanged;
  };

  // Функция для форматирования серии паспорта (только цифры, максимум 4)
  const formatPassportSeries = (series: string): string => {
    // Удаляем все нецифровые символы
    const digitsOnly = series.replace(/\D/g, '');

    // Ограничиваем до 4 цифр
    return digitsOnly.substring(0, 4);
  };

  // Функция для форматирования номера паспорта (только цифры, максимум 6)
  const formatPassportNumber = (number: string): string => {
    // Удаляем все нецифровые символы
    const digitsOnly = number.replace(/\D/g, '');

    // Ограничиваем до 6 цифр
    return digitsOnly.substring(0, 6);
  };

  // Функция для форматирования кода подразделения в формате XXX-XXX
  const formatPassportCode = (code: string): string => {
    // Удаляем все нецифровые символы
    const digitsOnly = code.replace(/\D/g, '');

    // Если длина меньше 6, просто возвращаем как есть
    if (digitsOnly.length < 6) return code;

    // Форматируем в виде XXX-XXX
    return `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(3, 6)}`;
  };

  const handleSaveClick = () => {
    // Валидация формы перед показом диалога подтверждения
    form.trigger().then((isValid) => {
      if (isValid) {
        const data = form.getValues();

        // Проверяем обязательные поля
        if (!data.firstName || data.firstName.trim() === '') {
          toast.error('Введите имя');
          return;
        }

        if (!data.lastName || data.lastName.trim() === '') {
          toast.error('Введите фамилию');
          return;
        }

        if (!data.email || data.email.trim() === '') {
          toast.error('Введите электронную почту');
          return;
        }

        if (!data.phone || data.phone.trim() === '') {
          toast.error('Введите телефон');
          return;
        }

        if (!data.birthDate || data.birthDate.trim() === '') {
          toast.error('Введите дату рождения');
          return;
        }

        // Если есть паспортные данные, проверяем их заполненность
        if (
          data.passportSeries ||
          data.passportNumber ||
          data.passportCode ||
          data.passportIssueDate ||
          data.passportIssuedBy
        ) {
          if (!data.passportSeries || data.passportSeries.trim() === '') {
            toast.error('Введите серию паспорта');
            return;
          }

          if (!data.passportNumber || data.passportNumber.trim() === '') {
            toast.error('Введите номер паспорта');
            return;
          }

          if (!data.passportCode || data.passportCode.trim() === '') {
            toast.error('Введите код подразделения');
            return;
          }

          // Форматируем и проверяем код подразделения
          data.passportCode = formatPassportCode(data.passportCode);
          if (!/^\d{3}-\d{3}$/.test(data.passportCode)) {
            toast.error('Код подразделения должен быть в формате XXX-XXX');
            return;
          }

          if (!data.passportIssueDate || data.passportIssueDate.trim() === '') {
            toast.error('Введите дату выдачи паспорта');
            return;
          }

          if (!data.passportIssuedBy || data.passportIssuedBy.trim() === '') {
            toast.error('Введите кем выдан паспорт');
            return;
          }
        }

        setFormData(data);
        setShowConfirmSave(true);
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const data = formData || form.getValues();

      // Форматируем код подразделения перед отправкой
      if (data.passportCode) {
        data.passportCode = formatPassportCode(data.passportCode);

        // Проверяем, соответствует ли код формату XXX-XXX
        if (!/^\d{3}-\d{3}$/.test(data.passportCode)) {
          toast.error('Код подразделения должен быть в формате XXX-XXX');
          setIsLoading(false);
          return;
        }
      }

      // Проверяем, используется ли альтернативный документ
      if (data.useAlternativeDocument) {
        // Если используется альтернативный документ, очищаем паспортные данные
        data.passportSeries = '';
        data.passportNumber = '';
        data.passportCode = '';
        data.passportIssueDate = '';
        data.passportIssuedBy = '';

        // Проверяем наличие альтернативного документа
        if (
          !data.alternativeDocument ||
          data.alternativeDocument.trim() === ''
        ) {
          toast.error('Введите данные альтернативного документа');
          setIsLoading(false);
          return;
        }
      } else {
        // Если не используется альтернативный документ, устанавливаем пустую строку
        data.alternativeDocument = '';
      }

      // Форматируем дату выдачи паспорта, если она есть
      if (data.passportIssueDate) {
        data.passportIssueDate = new Date(data.passportIssueDate)
          .toISOString()
          .split('T')[0];
      }

      console.log('Отправляемые данные профиля:', data);

      // Отправляем запрос на сохранение данных профиля
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Ошибка ответа:', responseData);
        throw new Error(responseData.message || 'Ошибка при сохранении данных');
      }

      console.log('Успешный ответ:', responseData);
      toast.success('Паспортные и контактные данные были изменены');

      if (onSuccess) {
        onSuccess();
      } else {
        // Если обработчик не передан, перенаправляем на страницу паспортных данных
        router.push('/dashboard?section=passport');
      }
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при сохранении данных'
      );
    } finally {
      setIsLoading(false);
      setShowConfirmSave(false);
    }
  };

  const handleCancel = () => {
    if (checkFormChanged()) {
      setShowConfirmCancel(true);
    } else {
      navigateBack();
    }
  };

  const navigateBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Если обработчик не передан, перенаправляем на страницу паспортных данных
      router.push('/dashboard?section=passport');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">
          Редактирование паспортных и контактных данных
        </h2>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveClick();
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useAlternativeDocument"
                checked={useAlternativeDocument}
                onCheckedChange={(checked) => {
                  form.setValue('useAlternativeDocument', checked === true);
                  checkFormChanged();
                }}
              />
              <Label htmlFor="useAlternativeDocument">
                Использовать иной документ, удостоверяющий личность
              </Label>
            </div>

            {useAlternativeDocument ? (
              <div className="space-y-2">
                <Label htmlFor="alternativeDocument">
                  Данные документа (до 100 символов)
                </Label>
                <Input
                  id="alternativeDocument"
                  {...form.register('alternativeDocument')}
                  maxLength={100}
                  onChange={(e) => {
                    form.setValue('alternativeDocument', e.target.value);
                    checkFormChanged();
                  }}
                />
                {form.formState.errors.alternativeDocument && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.alternativeDocument.message}
                  </p>
                )}

                <div className="mt-4">
                  <Label htmlFor="birthDate">Дата рождения</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...form.register('birthDate')}
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      form.setValue('birthDate', e.target.value);
                      checkFormChanged();
                    }}
                  />
                  {form.formState.errors.birthDate && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.birthDate.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Дата рождения</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    {...form.register('birthDate')}
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      form.setValue('birthDate', e.target.value);
                      checkFormChanged();
                    }}
                  />
                  {form.formState.errors.birthDate && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.birthDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportSeries">
                    Серия паспорта (4 цифры)
                  </Label>
                  <Input
                    id="passportSeries"
                    {...form.register('passportSeries')}
                    maxLength={4}
                    onChange={(e) => {
                      // Форматируем серию паспорта при вводе
                      const formattedSeries = formatPassportSeries(
                        e.target.value
                      );
                      form.setValue('passportSeries', formattedSeries);
                      checkFormChanged();
                    }}
                    placeholder="0000"
                  />
                  {form.formState.errors.passportSeries && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.passportSeries.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportNumber">
                    Номер паспорта (6 цифр)
                  </Label>
                  <Input
                    id="passportNumber"
                    {...form.register('passportNumber')}
                    maxLength={6}
                    onChange={(e) => {
                      // Форматируем номер паспорта при вводе
                      const formattedNumber = formatPassportNumber(
                        e.target.value
                      );
                      form.setValue('passportNumber', formattedNumber);
                      checkFormChanged();
                    }}
                    placeholder="000000"
                  />
                  {form.formState.errors.passportNumber && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.passportNumber.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportCode">Код подразделения</Label>
                  <Input
                    id="passportCode"
                    {...form.register('passportCode')}
                    onChange={(e) => {
                      // Форматируем код подразделения при вводе
                      const formattedCode = formatPassportCode(e.target.value);
                      form.setValue('passportCode', formattedCode);
                      checkFormChanged();
                    }}
                    placeholder="XXX-XXX"
                  />
                  {form.formState.errors.passportCode && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.passportCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passportIssueDate">Дата выдачи</Label>
                  <Input
                    id="passportIssueDate"
                    type="date"
                    {...form.register('passportIssueDate')}
                    min="1991-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      form.setValue('passportIssueDate', e.target.value);
                      checkFormChanged();
                    }}
                  />
                  {form.formState.errors.passportIssueDate && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.passportIssueDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="passportIssuedBy">Кем выдан</Label>
                  <Input
                    id="passportIssuedBy"
                    {...form.register('passportIssuedBy')}
                    onChange={(e) => {
                      form.setValue('passportIssuedBy', e.target.value);
                      checkFormChanged();
                    }}
                  />
                  {form.formState.errors.passportIssuedBy && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.passportIssuedBy.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Контактные данные</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Имя</Label>
                <Input
                  id="firstName"
                  {...form.register('firstName')}
                  onChange={(e) => {
                    form.setValue('firstName', e.target.value);
                    checkFormChanged();
                  }}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Фамилия</Label>
                <Input
                  id="lastName"
                  {...form.register('lastName')}
                  onChange={(e) => {
                    form.setValue('lastName', e.target.value);
                    checkFormChanged();
                  }}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Отчество</Label>
                <Input
                  id="middleName"
                  {...form.register('middleName')}
                  onChange={(e) => {
                    form.setValue('middleName', e.target.value);
                    checkFormChanged();
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  onChange={(e) => {
                    form.setValue('phone', e.target.value);
                    checkFormChanged();
                  }}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">Электронная почта</Label>
                <Input
                  id="email"
                  {...form.register('email')}
                  onChange={(e) => {
                    form.setValue('email', e.target.value);
                    checkFormChanged();
                  }}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </form>
      </div>

      {/* Диалог подтверждения сохранения */}
      <AlertDialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение данных</AlertDialogTitle>
            <AlertDialogDescription>
              Пожалуйста, проверьте введенные данные перед сохранением:
            </AlertDialogDescription>
          </AlertDialogHeader>

          {formData && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Личные данные:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Имя:</div>
                  <div>{formData.firstName}</div>

                  <div className="text-muted-foreground">Фамилия:</div>
                  <div>{formData.lastName}</div>

                  <div className="text-muted-foreground">Отчество:</div>
                  <div>{formData.middleName || '—'}</div>

                  <div className="text-muted-foreground">Дата рождения:</div>
                  <div>{formatDate(formData.birthDate)}</div>

                  <div className="text-muted-foreground">Email:</div>
                  <div>{formData.email}</div>

                  <div className="text-muted-foreground">Телефон:</div>
                  <div>{formData.phone}</div>
                </div>
              </div>

              {formData.useAlternativeDocument &&
              formData.alternativeDocument ? (
                <div className="space-y-2">
                  <h3 className="font-semibold">Альтернативный документ:</h3>
                  <div className="text-sm">{formData.alternativeDocument}</div>
                </div>
              ) : (
                (formData.passportSeries || formData.passportNumber) && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Паспортные данные:</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Серия:</div>
                      <div>{formData.passportSeries || '—'}</div>

                      <div className="text-muted-foreground">Номер:</div>
                      <div>{formData.passportNumber || '—'}</div>

                      <div className="text-muted-foreground">
                        Код подразделения:
                      </div>
                      <div>{formData.passportCode || '—'}</div>

                      <div className="text-muted-foreground">Дата выдачи:</div>
                      <div>{formatDate(formData.passportIssueDate)}</div>

                      <div className="text-muted-foreground">Кем выдан:</div>
                      <div>{formData.passportIssuedBy || '—'}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Подтвердить и сохранить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог подтверждения отмены */}
      <AlertDialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение отмены</AlertDialogTitle>
            <AlertDialogDescription>
              Вы внесли изменения в форму. Вы действительно хотите вернуться без
              сохранения?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Продолжить редактирование</AlertDialogCancel>
            <AlertDialogAction onClick={navigateBack}>
              Вернуться без сохранения
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
