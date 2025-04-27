import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UserDropdown } from '@/components/user-dropdown';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Eye } from 'lucide-react';

// Расширенный интерфейс пользователя
interface ExtendedUser {
  id: string;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  role: string;
  isVerified: boolean;
  // Дата рождения
  birthDate?: string | Date;
  // Паспортные данные
  passportSeries?: string;
  passportNumber?: string;
  passportCode?: string;
  passportIssueDate?: string | Date;
  passportIssuedBy?: string;
  // Банковские данные
  bankName?: string;
  bankBik?: string;
  bankAccount?: string;
  bankCorAccount?: string;
  // Альтернативный документ
  useAlternativeDocument?: boolean;
  alternativeDocument?: string;
}

export default async function BuyPage() {
  // Проверяем, авторизован ли пользователь
  const user = (await getCurrentUser()) as ExtendedUser;

  // Если пользователь не авторизован, перенаправляем на главную страницу
  if (!user) {
    redirect('/');
  }

  // Если пользователь не верифицирован, перенаправляем на страницу верификации
  if (!user.isVerified) {
    redirect('/verify');
  }

  // Получаем активные предложения на продажу, которые не принадлежат текущему пользователю
  const activeOffersRaw = await prisma.sellOffer.findMany({
    where: {
      status: 'ACTIVE',
      sellerId: {
        not: user.id, // Исключаем собственные предложения пользователя
      },
      buyerId: null, // Только те, которые еще не куплены
    },
    include: {
      artwork: {
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              middleName: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Преобразуем Decimal в number для всех предложений
  const activeOffers = activeOffersRaw.map((offer) => ({
    ...offer,
    price: offer.price ? parseFloat(offer.price.toString()) : null,
  }));

  // Форматирование текущей даты и времени для уведомления
  const now = new Date();
  const formattedDate = now.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Сохраняем время входа в localStorage через клиентский компонент
  const loginTimestamp = `${formattedDate} в ${formattedTime}`;

  // Функция для форматирования цены
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
        ? 'Исключительная лицензия'
        : 'Неисключительная лицензия';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold">ShopEMX</h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <UserDropdown
              user={{
                firstName: user.firstName,
                lastName: user.lastName,
              }}
              loginTime={loginTimestamp}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6">Доступные произведения</h2>

            {activeOffers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg text-muted-foreground">
                  В настоящее время нет доступных произведений для покупки
                </p>
                <div className="mt-4 text-sm text-muted-foreground">
                  <details>
                    <summary>Диагностическая информация</summary>
                    <pre className="mt-2 p-4 bg-gray-100 rounded text-left overflow-auto">
                      {JSON.stringify(
                        {
                          userId: user.id,
                          offerCount: activeOffers.length,
                          offers: activeOffers.map((o) => ({
                            id: o.id,
                            status: o.status,
                            sellerId: o.sellerId,
                            createdAt: o.createdAt,
                          })),
                        },
                        null,
                        2
                      )}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeOffers.map((offer) => (
                  <Card key={offer.id} className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="line-clamp-2 hover:line-clamp-none">
                        {offer.artwork.title}
                      </CardTitle>
                      <CardDescription>
                        Автор: {offer.artwork.author.lastName}{' '}
                        {offer.artwork.author.firstName}{' '}
                        {offer.artwork.author.middleName || ''}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="space-y-2">
                        <p className="text-sm line-clamp-3 hover:line-clamp-none">
                          {offer.artwork.description}
                        </p>
                        <div className="flex justify-between items-center pt-2">
                          <div className="text-sm text-muted-foreground">
                            Тип:{' '}
                            {getContractTypeText(
                              offer.contractType,
                              offer.licenseType
                            )}
                          </div>
                          <div className="font-medium">
                            {formatPrice(offer.price, offer.isFree)}
                          </div>
                        </div>
                        {offer.contractType === 'LICENSE' &&
                          !offer.isPerpetual &&
                          offer.licenseDuration && (
                            <div className="text-sm text-muted-foreground">
                              Срок: {offer.licenseDuration}{' '}
                              {offer.licenseDuration % 10 === 1 &&
                              offer.licenseDuration % 100 !== 11
                                ? 'год'
                                : offer.licenseDuration % 10 >= 2 &&
                                  offer.licenseDuration % 10 <= 4 &&
                                  (offer.licenseDuration % 100 < 10 ||
                                    offer.licenseDuration % 100 >= 20)
                                ? 'года'
                                : 'лет'}
                            </div>
                          )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t">
                      <div className="w-full flex justify-between items-center">
                        <Link
                          href={offer.artwork.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm flex items-center text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span>Предпросмотр</span>
                        </Link>

                        <Link href={`/buy/confirm/${offer.id}`}>
                          <Button size="sm">Купить</Button>
                        </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
