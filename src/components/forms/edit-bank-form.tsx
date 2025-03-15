'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Схема валидации для формы
const bankFormSchema = z.object({
  bankName: z.string().optional(),
  bankBik: z
    .string()
    .optional()
    .refine((val) => !val || val.length === 0 || val.length === 9, {
      message: 'БИК должен содержать 9 цифр',
    }),
  bankAccount: z
    .string()
    .optional()
    .refine((val) => !val || val.length === 0 || val.length === 20, {
      message: 'Номер счета должен содержать 20 цифр',
    }),
  bankCorAccount: z
    .string()
    .optional()
    .refine((val) => !val || val.length === 0 || val.length === 20, {
      message: 'Номер корреспондентского счета должен содержать 20 цифр',
    }),
});

type BankFormValues = z.infer<typeof bankFormSchema>;

interface EditBankFormProps {
  user: {
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    bankCorAccount?: string;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function EditBankForm({ user, onCancel, onSuccess }: EditBankFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [formData, setFormData] = useState<BankFormValues | null>(null);

  const form = useForm<BankFormValues>({
    resolver: zodResolver(bankFormSchema),
    defaultValues: {
      bankName: user.bankName || '',
      bankBik: user.bankBik || '',
      bankAccount: user.bankAccount || '',
      bankCorAccount: user.bankCorAccount || '',
    },
  });

  // Отслеживаем изменения формы
  const watchedValues = form.watch();

  // Проверяем, были ли внесены изменения в форму
  const checkFormChanged = () => {
    const hasChanged =
      watchedValues.bankName !== (user.bankName || '') ||
      watchedValues.bankBik !== (user.bankBik || '') ||
      watchedValues.bankAccount !== (user.bankAccount || '') ||
      watchedValues.bankCorAccount !== (user.bankCorAccount || '');

    return hasChanged;
  };

  const handleSaveClick = () => {
    // Валидация формы перед показом диалога подтверждения
    form.trigger().then((isValid) => {
      if (isValid) {
        const values = form.getValues();

        // Проверяем, что хотя бы один из способов выбран
        if (!values.bankAccount) {
          toast.error('Введите номер счета');
          return;
        }

        // Проверяем заполненность полей для банковского счета
        if (values.bankAccount) {
          if (!values.bankName || values.bankName.trim() === '') {
            toast.error('Введите название банка');
            return;
          }
          if (
            !values.bankBik ||
            values.bankBik.trim() === '' ||
            values.bankBik.length !== 9
          ) {
            toast.error('БИК должен содержать 9 цифр');
            return;
          }
          if (
            !values.bankAccount ||
            values.bankAccount.trim() === '' ||
            values.bankAccount.length !== 20
          ) {
            toast.error('Номер счета должен содержать 20 цифр');
            return;
          }
        }

        setFormData(values);
        setShowConfirmSave(true);
      }
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      const values = formData || form.getValues();

      // Подготавливаем данные для отправки
      const bankData = {
        bankName: values.bankName || null,
        bankBik: values.bankBik || null,
        bankAccount: values.bankAccount || null,
        bankCorAccount: values.bankCorAccount || null,
      };

      // Отправляем запрос на сохранение банковских данных
      const response = await fetch('/api/profile/bank-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bankData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Ошибка при сохранении данных');
      }

      toast.success('Банковские реквизиты были изменены');

      if (onSuccess) {
        onSuccess();
      } else {
        // Если обработчик не передан, перенаправляем на страницу банковских данных
        router.push('/dashboard?section=bank');
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
      // Если обработчик не передан, перенаправляем на страницу банковских данных
      router.push('/dashboard?section=bank');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-6">
          Редактирование банковских реквизитов
        </h2>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveClick();
          }}
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Банковский счет</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Наименование банка</Label>
                <Input id="bankName" {...form.register('bankName')} />
                {form.formState.errors.bankName && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankBik">БИК</Label>
                <Input
                  id="bankBik"
                  {...form.register('bankBik')}
                  maxLength={9}
                />
                {form.formState.errors.bankBik && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankBik.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Номер счета</Label>
                <Input
                  id="bankAccount"
                  {...form.register('bankAccount')}
                  maxLength={20}
                />
                {form.formState.errors.bankAccount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankAccount.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankCorAccount">Корреспондентский счет</Label>
                <Input
                  id="bankCorAccount"
                  {...form.register('bankCorAccount')}
                  maxLength={20}
                />
                {form.formState.errors.bankCorAccount && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.bankCorAccount.message}
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
                <h3 className="font-semibold">Банковский счет:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Название банка:</div>
                  <div>{formData.bankName || '—'}</div>

                  <div className="text-muted-foreground">БИК:</div>
                  <div>{formData.bankBik || '—'}</div>

                  <div className="text-muted-foreground">Номер счета:</div>
                  <div>{formData.bankAccount || '—'}</div>

                  <div className="text-muted-foreground">Корр. счет:</div>
                  <div>{formData.bankCorAccount || '—'}</div>
                </div>
              </div>
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
