'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { UploadDocumentButton } from '@/components/upload-document-button';
import { useRouter } from 'next/navigation';

interface VerificationStatusProps {
  user: {
    isVerified: boolean;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate?: string;
    passportSeries?: string;
    passportNumber?: string;
    passportCode?: string;
    passportIssueDate?: string;
    passportIssuedBy?: string;
    bankName?: string;
    bankBik?: string;
    bankAccount?: string;
    bankCorAccount?: string;
    useAlternativeDocument?: boolean;
    alternativeDocument?: string;
  };
}

type VerificationStatus = 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED';

export function VerificationStatus({ user }: VerificationStatusProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>('NOT_VERIFIED');
  const [step, setStep] = useState<'data' | 'document' | 'request'>('data');
  const router = useRouter();

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch('/api/profile/verification-request');
      if (response.ok) {
        const data = await response.json();
        if (user.isVerified) {
          setStatus('VERIFIED');
        } else if (data.requests && data.requests.length > 0) {
          const latestRequest = data.requests[0];
          if (latestRequest.status === 'PENDING') {
            setStatus('PENDING');
          } else {
            setStatus('NOT_VERIFIED');
          }
        } else {
          setStatus('NOT_VERIFIED');
        }
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса верификации:', error);
    }
  };

  // Проверяем текущий статус верификации при загрузке компонента
  useEffect(() => {
    checkVerificationStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitRequest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/verification-request', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Заявка на подтверждение успешно отправлена');
        setStatus('PENDING');
        // Обновляем страницу после отправки заявки
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        toast.error(data.message || 'Ошибка при отправке заявки');
      }
    } catch (error) {
      console.error('Ошибка при отправке заявки:', error);
      toast.error('Произошла ошибка при отправке заявки');
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем заполнение обязательных полей
  const requiredFields = [
    {
      name: 'Паспортные данные',
      value: user.useAlternativeDocument
        ? user.alternativeDocument
        : user.passportSeries &&
          user.passportNumber &&
          user.passportCode &&
          user.passportIssueDate &&
          user.passportIssuedBy,
    },
    {
      name: 'Банковские реквизиты',
      value:
        user.bankName &&
        user.bankBik &&
        user.bankAccount &&
        user.bankCorAccount,
    },
    {
      name: 'Дата рождения',
      value: user.birthDate,
    },
  ];

  const missingFields = requiredFields.filter((field) => !field.value);
  const allDataFilled = missingFields.length === 0;

  // При инициализации или изменении данных определяем текущий шаг
  useEffect(() => {
    if (allDataFilled) {
      setStep('document');
    } else {
      setStep('data');
    }
  }, [allDataFilled]);

  if (status === 'VERIFIED') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Аккаунт подтвержден</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Ваш аккаунт полностью верифицирован. Вам доступны все функции
            платформы.
          </p>
          <div className="mt-4">
            <Link href="/dashboard">
              <Button className="w-full">Перейти в личный кабинет</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'PENDING') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="font-medium">Заявка на рассмотрении</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Ваша заявка на подтверждение аккаунта находится на рассмотрении у
            администратора. Мы уведомим вас по email когда заявка будет
            рассмотрена.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-yellow-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Аккаунт не подтвержден</span>
          </div>

          {step === 'data' && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                Для отправки заявки на подтверждение необходимо заполнить:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {missingFields.map((field) => (
                  <li key={field.name} className="text-muted-foreground">
                    {field.name}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Link href="/profile">
                  <Button className="w-full">Заполнить данные профиля</Button>
                </Link>
              </div>
            </div>
          )}

          {step === 'document' && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Данные профиля заполнены. Теперь необходимо загрузить фото
                паспорта.
              </p>
              <div className="bg-slate-50 p-4 rounded-md border mb-4">
                <h3 className="text-lg font-medium mb-2">
                  Загрузка фото паспорта
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Для верификации необходимо загрузить фото паспорта (разворот с
                  фотографией)
                </p>
                <UploadDocumentButton />
              </div>
              <div className="mt-4">
                <Button onClick={() => setStep('request')} className="w-full">
                  Продолжить
                </Button>
              </div>
            </div>
          )}

          {step === 'request' && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Все необходимые данные заполнены и документы загружены. Вы
                можете отправить заявку на подтверждение аккаунта.
              </p>
              <Button
                onClick={handleSubmitRequest}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Отправить заявку на подтверждение
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
