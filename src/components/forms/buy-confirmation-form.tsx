'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Интерфейсы для пользователя и предложения продажи
interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string;
  birthDate?: string | Date;
  passportSeries?: string;
  passportNumber?: string;
  passportCode?: string;
  passportIssueDate?: string | Date;
  passportIssuedBy?: string;
  bankName?: string;
  bankBik?: string;
  bankAccount?: string;
  bankCorAccount?: string;
  useAlternativeDocument?: boolean;
  alternativeDocument?: string;
}

interface SellOffer {
  id: string;
  price: number | null;
  isFree: boolean;
  contractType: 'EXCLUSIVE_RIGHTS' | 'LICENSE';
  licenseType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | null;
  isExclusive: boolean | null;
  isPerpetual: boolean | null;
  licenseDuration: number | null;
  artworkId: string;
  sellerId: string;
  artwork: {
    id: string;
    title: string;
    description: string;
    filePath: string;
    author: {
      firstName: string;
      lastName: string;
      middleName: string | null;
      phone: string;
    };
  };
}

export function BuyConfirmationForm({
  user,
  sellOffer,
}: {
  user: User;
  sellOffer: SellOffer;
}) {
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [showContract, setShowContract] = useState(false);

  // Форматирование текущей даты для контракта
  const formattedDate = new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Форматирование цены
  const priceFormatted = sellOffer.isFree
    ? 'Бесплатно'
    : `${sellOffer.price?.toLocaleString('ru-RU')} ₽`;

  // Форматирование типа контракта
  const contractTypeFormatted =
    sellOffer.contractType === 'EXCLUSIVE_RIGHTS'
      ? 'Отчуждение исключительных прав'
      : 'Лицензионный договор';

  // Форматирование типа лицензии для лицензионного договора
  const licenseTypeFormatted =
    sellOffer.contractType === 'LICENSE'
      ? sellOffer.licenseType === 'EXCLUSIVE'
        ? 'Исключительная лицензия'
        : 'Неисключительная лицензия'
      : null;

  // Форматирование срока лицензии
  const licenseDurationFormatted =
    sellOffer.contractType === 'LICENSE'
      ? sellOffer.isPerpetual
        ? 'Бессрочно'
        : `${sellOffer.licenseDuration} лет`
      : null;

  // Состояние для хранения URL контракта
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [isGeneratingContract, setIsGeneratingContract] = useState(false);

  // Функция для генерации контракта
  const generateContract = async () => {
    setIsGeneratingContract(true);
    try {
      const response = await fetch(
        `/api/buy/generate-contract/${sellOffer.id}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при генерации контракта');
      }

      const data = await response.json();
      setContractUrl(data.contractUrl);
      toast.success('Контракт успешно сгенерирован');
    } catch (error) {
      console.error('Ошибка при генерации контракта:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при генерации контракта'
      );
    } finally {
      setIsGeneratingContract(false);
    }
  };

  // Функция для обработки подписания контракта
  const handleSignContract = async () => {
    if (!isAgreed) {
      toast.error('Необходимо согласиться с условиями контракта');
      return;
    }

    setIsSigning(true);

    try {
      const response = await fetch('/api/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sellOfferId: sellOffer.id,
          buyerId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка при покупке произведения');
      }

      toast.success('Покупка успешно завершена!');
      // Перенаправляем на страницу с купленными файлами
      router.push('/dashboard/bought');
      router.refresh();
    } catch (error) {
      console.error('Ошибка при покупке:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Произошла ошибка при покупке произведения'
      );
    } finally {
      setIsSigning(false);
    }
  };

  // Генерация текста контракта
  const contractText = showContract ? (
    <div className="mt-4 space-y-4 p-4 border rounded-md bg-gray-50 max-h-96 overflow-y-auto">
      <h3 className="text-center font-bold text-lg mb-4">
        {sellOffer.contractType === 'EXCLUSIVE_RIGHTS'
          ? 'ДОГОВОР ОБ ОТЧУЖДЕНИИ ИСКЛЮЧИТЕЛЬНОГО ПРАВА'
          : 'ЛИЦЕНЗИОННЫЙ ДОГОВОР'}
      </h3>

      <p>г. Москва</p>
      <p className="text-right">{formattedDate}</p>

      <p>
        {sellOffer.artwork.author.lastName} {sellOffer.artwork.author.firstName}{' '}
        {sellOffer.artwork.author.middleName || ''}, именуемый в дальнейшем
        &quot;Правообладатель&quot;, с одной стороны, и {user.lastName}{' '}
        {user.firstName} {user.middleName || ''}, именуемый в дальнейшем
        &quot;Приобретатель&quot;, с другой стороны, заключили настоящий договор
        о нижеследующем:
      </p>

      <p className="font-bold">1. ПРЕДМЕТ ДОГОВОРА</p>
      <p>
        1.1. Правообладатель передает Приобретателю
        {sellOffer.contractType === 'EXCLUSIVE_RIGHTS'
          ? ' исключительное право в полном объеме'
          : sellOffer.licenseType === 'EXCLUSIVE'
          ? ' исключительную лицензию'
          : ' неисключительную лицензию'}
        на произведение &quot;{sellOffer.artwork.title}&quot; (далее -
        &quot;Произведение&quot;).
      </p>
      <p>1.2. Описание Произведения: {sellOffer.artwork.description}</p>

      {sellOffer.contractType === 'LICENSE' && (
        <>
          <p className="font-bold">2. СРОК ДЕЙСТВИЯ ДОГОВОРА</p>
          <p>
            2.1. Настоящий договор вступает в силу с момента его подписания
            Сторонами и действует
            {sellOffer.isPerpetual
              ? ' бессрочно.'
              : ` в течение ${sellOffer.licenseDuration} лет.`}
          </p>
        </>
      )}

      <p className="font-bold">
        {sellOffer.contractType === 'LICENSE' ? '3' : '2'}. ВОЗНАГРАЖДЕНИЕ
      </p>
      <p>
        {sellOffer.contractType === 'LICENSE' ? '3.1' : '2.1'}. За
        {sellOffer.contractType === 'EXCLUSIVE_RIGHTS'
          ? ' отчуждение исключительного права'
          : ' предоставление лицензии'}{' '}
        на Произведение Приобретатель обязуется уплатить Правообладателю
        вознаграждение в размере{' '}
        {sellOffer.isFree
          ? '0 (ноль) рублей'
          : `${sellOffer.price?.toLocaleString('ru-RU')} (${
              sellOffer.price
            }) рублей`}
        .
      </p>

      <p className="font-bold">
        {sellOffer.contractType === 'LICENSE' ? '4' : '3'}. ПОДПИСИ СТОРОН
      </p>
      <div className="flex flex-col space-y-4 mt-4">
        <div>
          <p className="font-bold">Правообладатель:</p>
          <p>
            {sellOffer.artwork.author.lastName}{' '}
            {sellOffer.artwork.author.firstName}{' '}
            {sellOffer.artwork.author.middleName || ''}
          </p>
          <p>
            <span className="text-sm italic">
              Подписано простой электронной подписью
            </span>
          </p>
        </div>

        <div>
          <p className="font-bold">Приобретатель:</p>
          <p>
            {user.lastName} {user.firstName} {user.middleName || ''}
          </p>
          {isAgreed && (
            <p>
              <span className="text-sm italic">
                Подписано простой электронной подписью
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Информация о произведении</CardTitle>
          <CardDescription>
            Проверьте данные перед подтверждением покупки
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-gray-500">Название</h3>
                <p className="font-medium">{sellOffer.artwork.title}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-500">Автор</h3>
                <p className="font-medium">
                  {sellOffer.artwork.author.lastName}{' '}
                  {sellOffer.artwork.author.firstName}{' '}
                  {sellOffer.artwork.author.middleName || ''}
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-gray-500">Цена</h3>
                <p className="font-medium">{priceFormatted}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-500">
                  Тип договора
                </h3>
                <p className="font-medium">{contractTypeFormatted}</p>
              </div>
            </div>
            {sellOffer.contractType === 'LICENSE' && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      Тип лицензии
                    </h3>
                    <p className="font-medium">{licenseTypeFormatted}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-gray-500">
                      Срок лицензии
                    </h3>
                    <p className="font-medium">{licenseDurationFormatted}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Button
          type="button"
          onClick={() => setShowContract(!showContract)}
          variant="outline"
          className="w-full"
        >
          {showContract ? 'Скрыть договор' : 'Показать договор'}
        </Button>

        {contractText}

        <div className="flex items-start space-x-2 mt-4">
          <Checkbox
            id="terms"
            checked={isAgreed}
            onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Я согласен с условиями договора и подтверждаю покупку
            </Label>
            <p className="text-xs text-gray-500">
              Нажимая на кнопку &quot;Подписать договор&quot;, вы соглашаетесь с
              условиями договора и подтверждаете его подписание с помощью
              простой электронной подписи.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={generateContract}
            disabled={isGeneratingContract}
            variant="outline"
            className="flex-1"
          >
            {isGeneratingContract ? 'Генерация...' : 'Сгенерировать контракт'}
          </Button>

          {contractUrl && (
            <Button variant="secondary" className="flex-1" asChild>
              <a href={contractUrl} target="_blank" rel="noopener noreferrer">
                Просмотреть PDF
              </a>
            </Button>
          )}
        </div>

        <Button
          onClick={handleSignContract}
          className="w-full"
          disabled={!isAgreed || isSigning}
        >
          {isSigning
            ? 'Подписание...'
            : 'Подписать договор и совершить покупку'}
        </Button>
      </div>
    </div>
  );
}
