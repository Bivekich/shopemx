import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BuyConfirmationForm } from '@/components/forms/buy-confirmation-form';
import { UserDropdown } from '@/components/user-dropdown';
import Link from 'next/link';

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

// Интерфейс для произведения
interface Artwork {
  id: string;
  title: string;
  description: string;
  filePath: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    firstName: string;
    lastName: string;
    middleName: string | null;
    phone: string;
  };
}

// Интерфейс для предложения продажи
interface SellOffer {
  id: string;
  price: number | null;
  isFree: boolean;
  contractType: 'EXCLUSIVE_RIGHTS' | 'LICENSE';
  licenseType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | null;
  isExclusive: boolean | null;
  isPerpetual: boolean | null;
  licenseDuration: number | null;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  artworkId: string;
  sellerId: string;
  buyerId: string | null;
  contractPath: string | null;
  artwork: Artwork;
}

export default async function BuyConfirmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  // Получаем данные о предложении продажи
  const { id } = await params;
  const sellOfferRaw = await prisma.sellOffer.findUnique({
    where: {
      id: id,
    },
    include: {
      artwork: {
        include: {
          author: {
            select: {
              firstName: true,
              lastName: true,
              middleName: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  // Преобразуем Decimal в number
  const sellOffer = sellOfferRaw
    ? {
        ...sellOfferRaw,
        price: sellOfferRaw.price
          ? parseFloat(sellOfferRaw.price.toString())
          : null,
      }
    : null;

  // Если предложение не найдено, принадлежит текущему пользователю или уже куплено
  if (
    !sellOffer ||
    sellOffer.sellerId === user.id ||
    sellOffer.buyerId !== null
  ) {
    redirect('/buy');
  }

  // Если предложение не активно (не подтверждено продавцом)
  if (sellOffer.status !== 'ACTIVE') {
    redirect('/buy');
  }

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
            <h2 className="text-2xl font-bold mb-6">Подтверждение покупки</h2>
            <BuyConfirmationForm
              user={user}
              sellOffer={sellOffer as SellOffer}
            />
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
