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
import { useRouter } from 'next/navigation';

const bankDetailsSchema = z.object({
  bankName: z.string().optional(),
  bankBik: z
    .string()
    .regex(/^\d{9}$/, 'БИК должен состоять из 9 цифр')
    .optional(),
  bankAccount: z
    .string()
    .regex(/^\d{20}$/, 'Номер счета должен состоять из 20 цифр')
    .optional(),
  bankCorAccount: z
    .string()
    .regex(/^\d{20}$/, 'Корреспондентский счет должен состоять из 20 цифр')
    .optional(),
});

type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

interface BankDetailsFormProps {
  initialData?: BankDetailsFormData;
}

export const BankDetailsForm = ({ initialData }: BankDetailsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: initialData,
  });

  // Проверяем, заполнены ли все поля банковских реквизитов
  const hasAllBankDetails = (data: BankDetailsFormData) => {
    return (
      !!data.bankName &&
      !!data.bankBik &&
      !!data.bankAccount &&
      !!data.bankCorAccount
    );
  };

  const onSubmit = async (data: BankDetailsFormData) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile/bank-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при обновлении реквизитов');
      }

      toast.success('Банковские реквизиты успешно обновлены');

      // Если все поля заполнены, перенаправляем на страницу верификации
      if (hasAllBankDetails(data)) {
        toast.info('Перенаправляем на страницу верификации...');
        setTimeout(() => {
          router.push('/verify');
        }, 1500);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Ошибка при обновлении банковских реквизитов'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SectionHeader
        title="Банковская информация"
        description="Данные вашего банка для проведения расчетов"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bankName">Наименование банка</Label>
          <Input id="bankName" {...register('bankName')} disabled={isLoading} />
          {errors.bankName && (
            <p className="text-sm text-red-500">{errors.bankName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankBik">БИК</Label>
          <Input id="bankBik" {...register('bankBik')} disabled={isLoading} />
          {errors.bankBik && (
            <p className="text-sm text-red-500">{errors.bankBik.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccount">Номер счета</Label>
          <Input
            id="bankAccount"
            {...register('bankAccount')}
            disabled={isLoading}
          />
          {errors.bankAccount && (
            <p className="text-sm text-red-500">{errors.bankAccount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankCorAccount">Корреспондентский счет</Label>
          <Input
            id="bankCorAccount"
            {...register('bankCorAccount')}
            disabled={isLoading}
          />
          {errors.bankCorAccount && (
            <p className="text-sm text-red-500">
              {errors.bankCorAccount.message}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Сохранение...' : 'Сохранить реквизиты'}
      </Button>
    </form>
  );
};
