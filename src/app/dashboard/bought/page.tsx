import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { UserDropdown } from '@/components/user-dropdown';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';

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
}

export default async function BoughtArtworksPage() {
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

  // Получаем купленные произведения пользователя
  const boughtOffersRaw = await prisma.sellOffer.findMany({
    where: {
      buyerId: user.id,
      status: 'ACCEPTED',
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
      updatedAt: 'desc',
    },
  });

  // Преобразуем Decimal в number
  const boughtOffers = boughtOffersRaw.map((offer) => ({
    ...offer,
    price: offer.price ? parseFloat(offer.price.toString()) : null,
  }));

  // Форматирование цены
  const formatPrice = (price: number | null, isFree: boolean) => {
    if (isFree) return 'Безвозмездная сделка';
    if (price === null) return '0,00 руб.';

    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

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

  // Сохраняем время входа для отображения в компоненте UserDropdown
  const loginTimestamp = `${formattedDate} в ${formattedTime}`;

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Купленные произведения</h2>
              <Link href="/dashboard">
                <Button variant="outline">Назад к профилю</Button>
              </Link>
            </div>

            {boughtOffers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-lg text-muted-foreground">
                  У вас пока нет купленных произведений
                </p>
                <div className="mt-4">
                  <Link href="/buy">
                    <Button>Перейти к покупке</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boughtOffers.map((offer) => (
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
                            {offer.contractType === 'EXCLUSIVE_RIGHTS'
                              ? 'Исключительные права'
                              : offer.licenseType === 'EXCLUSIVE'
                              ? 'Исключительная лицензия'
                              : 'Неисключительная лицензия'}
                          </div>
                          <div className="font-medium">
                            {formatPrice(offer.price, offer.isFree)}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Куплено:{' '}
                          {new Date(offer.updatedAt).toLocaleDateString(
                            'ru-RU'
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 border-t">
                      <div className="w-full flex justify-between items-center">
                        <Link href={offer.artwork.filePath} target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Eye size={16} />
                            Просмотр
                          </Button>
                        </Link>
                        <Link href={offer.artwork.filePath} download>
                          <Button size="sm" className="flex items-center gap-2">
                            <Download size={16} />
                            Скачать
                          </Button>
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
