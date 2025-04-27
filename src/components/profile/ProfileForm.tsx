'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SectionHeader } from '@/components/ui/section-header';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Имя обязательно для заполнения'),
  lastName: z.string().min(1, 'Фамилия обязательна для заполнения'),
  middleName: z.string().optional(),
  email: z
    .string()
    .min(1, 'Электронная почта обязательна для заполнения')
    .email('Введите корректный адрес электронной почты'),
  phone: z.string().min(1, 'Телефон обязателен для заполнения'),
  birthDate: z.string().optional(),
  passportSeries: z.string().optional(),
  passportNumber: z.string().optional(),
  passportCode: z.string().optional(),
  passportIssueDate: z.string().optional(),
  passportIssuedBy: z.string().optional(),
  useAlternativeDocument: z.boolean().default(false),
  alternativeDocument: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: ProfileFormData;
}

export const ProfileForm = ({ initialData }: ProfileFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [useAltDoc, setUseAltDoc] = useState(
    initialData?.useAlternativeDocument || false
  );
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      ...initialData,
      useAlternativeDocument: initialData?.useAlternativeDocument || false,
    },
  });

  // Отслеживаем изменения чекбокса
  const useAlternativeDocument = watch('useAlternativeDocument');

  // Обновляем состояние при изменении значения из формы
  if (useAlternativeDocument !== useAltDoc) {
    setUseAltDoc(useAlternativeDocument);
  }

  // Проверяем, заполнены ли все обязательные поля
  const hasCompletedProfile = (data: ProfileFormData) => {
    // Проверяем паспортные данные
    const hasPassportData = useAltDoc
      ? !!data.alternativeDocument
      : !!(
          data.passportSeries &&
          data.passportNumber &&
          data.passportCode &&
          data.passportIssueDate &&
          data.passportIssuedBy
        );

    // Проверяем дату рождения
    const hasBirthDate = !!data.birthDate;

    return hasPassportData && hasBirthDate;
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при обновлении профиля');
      }

      toast.success('Профиль успешно обновлен');

      // Проверяем, заполнены ли все необходимые поля
      if (hasCompletedProfile(data)) {
        // Если все заполнено, перенаправляем на страницу верификации
        toast.info('Перенаправляем на страницу верификации...');
        setTimeout(() => {
          router.push('/verify');
        }, 1500);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Ошибка при обновлении профиля'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">Имя</Label>
          <Input
            id="firstName"
            {...register('firstName')}
            disabled={isLoading}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Фамилия</Label>
          <Input id="lastName" {...register('lastName')} disabled={isLoading} />
          {errors.lastName && (
            <p className="text-sm text-red-500">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Отчество</Label>
          <Input
            id="middleName"
            {...register('middleName')}
            disabled={isLoading}
          />
          {errors.middleName && (
            <p className="text-sm text-red-500">{errors.middleName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Дата рождения</Label>
          <Input
            id="birthDate"
            type="date"
            {...register('birthDate')}
            disabled={isLoading}
          />
          {errors.birthDate && (
            <p className="text-sm text-red-500">{errors.birthDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Электронная почта</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" {...register('phone')} disabled={isLoading} />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <SectionHeader
        title="Паспортные данные"
        description="Информация о вашем документе, удостоверяющем личность"
        className="pt-4"
      />

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="useAlternativeDocument"
          {...register('useAlternativeDocument')}
          checked={useAltDoc}
          onCheckedChange={(checked) => setUseAltDoc(checked as boolean)}
        />
        <Label htmlFor="useAlternativeDocument" className="font-normal">
          Использовать альтернативный документ вместо паспорта РФ
        </Label>
      </div>

      {!useAltDoc ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="passportSeries">Серия паспорта</Label>
            <Input
              id="passportSeries"
              {...register('passportSeries')}
              disabled={isLoading}
            />
            {errors.passportSeries && (
              <p className="text-sm text-red-500">
                {errors.passportSeries.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportNumber">Номер паспорта</Label>
            <Input
              id="passportNumber"
              {...register('passportNumber')}
              disabled={isLoading}
            />
            {errors.passportNumber && (
              <p className="text-sm text-red-500">
                {errors.passportNumber.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportCode">Код подразделения</Label>
            <Input
              id="passportCode"
              {...register('passportCode')}
              disabled={isLoading}
            />
            {errors.passportCode && (
              <p className="text-sm text-red-500">
                {errors.passportCode.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passportIssueDate">Дата выдачи</Label>
            <Input
              id="passportIssueDate"
              type="date"
              {...register('passportIssueDate')}
              disabled={isLoading}
            />
            {errors.passportIssueDate && (
              <p className="text-sm text-red-500">
                {errors.passportIssueDate.message}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="passportIssuedBy">Кем выдан</Label>
            <Input
              id="passportIssuedBy"
              {...register('passportIssuedBy')}
              disabled={isLoading}
            />
            {errors.passportIssuedBy && (
              <p className="text-sm text-red-500">
                {errors.passportIssuedBy.message}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="alternativeDocument">
            Описание альтернативного документа
          </Label>
          <Textarea
            id="alternativeDocument"
            {...register('alternativeDocument')}
            disabled={isLoading}
            placeholder="Укажите данные альтернативного документа (загранпаспорт, ВНЖ и т.д.)"
            className="min-h-[100px]"
          />
          {errors.alternativeDocument && (
            <p className="text-sm text-red-500">
              {errors.alternativeDocument.message}
            </p>
          )}
        </div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
      </Button>
    </form>
  );
};
