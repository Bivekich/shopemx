'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const bankDetailsSchema = z.object({
  bankName: z
    .string()
    .min(1, 'Название банка обязательно для заполнения')
    .optional(),
  bankBik: z.string().min(9, 'БИК должен содержать 9 цифр').optional(),
  bankAccount: z
    .string()
    .min(20, 'Расчетный счет должен содержать 20 цифр')
    .optional(),
  bankCorAccount: z
    .string()
    .min(20, 'Корреспондентский счет должен содержать 20 цифр')
    .optional(),
});

type BankDetailsFormData = z.infer<typeof bankDetailsSchema>;

interface BankDetailsFormProps {
  initialData?: Partial<BankDetailsFormData>;
}

export const BankDetailsForm = ({ initialData }: BankDetailsFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankDetailsFormData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues: initialData,
  });

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
        throw new Error(
          error.message || 'Ошибка при обновлении банковских реквизитов'
        );
      }

      const result = await response.json();
      console.log('Обновленные банковские данные:', result.data);

      toast.success('Банковские реквизиты успешно обновлены');
    } catch (error) {
      console.error('Ошибка при обновлении банковских реквизитов:', error);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bankName">Название банка</Label>
          <Input id="bankName" {...register('bankName')} disabled={isLoading} />
          {errors.bankName && (
            <p className="text-sm text-red-500">{errors.bankName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankBik">БИК</Label>
          <Input
            id="bankBik"
            {...register('bankBik')}
            disabled={isLoading}
            maxLength={9}
          />
          {errors.bankBik && (
            <p className="text-sm text-red-500">{errors.bankBik.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="bankAccount">Расчетный счет</Label>
          <Input
            id="bankAccount"
            {...register('bankAccount')}
            disabled={isLoading}
            maxLength={20}
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
            maxLength={20}
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
