'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
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

interface VerificationRequestButtonProps {
  disabled: boolean;
  hasDocument?: boolean;
}

export function VerificationRequestButton({
  disabled,
  hasDocument = false,
}: VerificationRequestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{
    status: 'idle' | 'pending' | 'rejected';
    requestId?: string;
    createdAt?: string;
    rejectionReason?: string;
  }>({ status: 'idle' });

  // Проверяем статус заявки при монтировании компонента
  useEffect(() => {
    checkRequestStatus();
  }, []);

  // Функция для проверки статуса заявки
  const checkRequestStatus = async () => {
    try {
      const response = await fetch('/api/profile/verification-request');

      if (response.ok) {
        const data = await response.json();

        if (data.requests && data.requests.length > 0) {
          const latestRequest = data.requests[0];

          if (latestRequest.status === 'PENDING') {
            setRequestStatus({
              status: 'pending',
              requestId: latestRequest.id,
              createdAt: latestRequest.createdAt,
            });
          } else if (latestRequest.status === 'REJECTED') {
            setRequestStatus({
              status: 'rejected',
              rejectionReason: latestRequest.rejectionReason,
            });
          }
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса заявки:', error);
    }
  };

  // Функция для отправки заявки на подтверждение
  const sendVerificationRequest = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/profile/verification-request', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Заявка на подтверждение успешно отправлена');
        setRequestStatus({
          status: 'pending',
          requestId: data.requestId,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Если у пользователя уже есть активная заявка
        if (response.status === 400 && data.requestId) {
          setRequestStatus({
            status: 'pending',
            requestId: data.requestId,
            createdAt: data.createdAt,
          });
          toast.info('У вас уже есть активная заявка на подтверждение');
        } else {
          toast.error(data.message || 'Ошибка при отправке заявки');
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error);
      toast.error('Произошла ошибка при отправке заявки');
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Если у пользователя уже есть активная заявка
  if (requestStatus.status === 'pending') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            Ваша заявка на подтверждение аккаунта находится на рассмотрении.
            {requestStatus.createdAt && (
              <span className="block mt-1 text-blue-600">
                Дата отправки: {formatDate(requestStatus.createdAt)}
              </span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // Если заявка была отклонена
  if (requestStatus.status === 'rejected') {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-800">
            Ваша предыдущая заявка была отклонена.
            {requestStatus.rejectionReason && (
              <span className="block mt-1">
                Причина: {requestStatus.rejectionReason}
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={disabled || isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Отправить новую заявку
        </Button>
      </div>
    );
  }

  // Стандартное состояние - нет активных заявок
  return (
    <>
      {!hasDocument && (
        <div className="mb-4 p-4 border border-red-300 bg-red-50 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800">Внимание</h4>
              <p className="text-sm text-red-700">
                Для отправки заявки на верификацию необходимо загрузить фото
                документа.
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={() => setShowConfirmDialog(true)}
        disabled={disabled || isLoading || !hasDocument}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Отправить данные для создания подтвержденной учётной записи
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Подтверждение отправки</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отправить заявку на подтверждение аккаунта?
              Администратор проверит ваши данные и примет решение о
              подтверждении.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={sendVerificationRequest}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Отправить заявку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
