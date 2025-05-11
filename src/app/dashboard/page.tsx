import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EditProfileForm } from '@/components/forms/edit-profile-form';
import { EditBankForm } from '@/components/forms/edit-bank-form';
import { ChangePasswordForm } from '@/components/forms/change-password-form';
import { Suspense } from 'react';
import { WelcomeNotification } from '@/components/welcome-notification';
import { UploadDocumentButton } from '@/components/upload-document-button';
import { UserDropdown } from '@/components/user-dropdown';
import { CheckCircle } from 'lucide-react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; notification?: string }>;
}) {
  // Получаем параметры из URL
  const resolvedSearchParams = await searchParams;

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

  // Определяем текущий раздел
  const section = resolvedSearchParams.section || 'main';

  // Функция для рендеринга содержимого в зависимости от выбранного раздела
  const renderContent = () => {
    // Секция статуса аккаунта
    const accountStatusSection = () => {
      return (
        <div className="pt-4 border-t mt-6">
          <h3 className="text-lg font-semibold mb-4">Статус учётной записи</h3>

          <div className="flex items-center">
            <div className="flex items-center text-green-600">
              <CheckCircle className="mr-2 h-5 w-5" />
              <span className="font-medium">Подтвержденная учётная запись</span>
            </div>
          </div>
        </div>
      );
    };

    switch (section) {
      case 'edit-profile':
        return (
          <Suspense fallback={<div>Загрузка...</div>}>
            <EditProfileForm
              user={{
                firstName: user.firstName,
                lastName: user.lastName,
                middleName: user.middleName || '',
                email: user.email,
                phone: user.phone,
                birthDate: user.birthDate
                  ? user.birthDate.toString()
                  : undefined,
                passportSeries: user.passportSeries,
                passportNumber: user.passportNumber,
                passportCode: user.passportCode,
                passportIssueDate: user.passportIssueDate
                  ? user.passportIssueDate.toString()
                  : undefined,
                passportIssuedBy: user.passportIssuedBy,
                useAlternativeDocument: user.useAlternativeDocument,
                alternativeDocument: user.alternativeDocument,
              }}
            />
          </Suspense>
        );
      case 'edit-bank':
        return (
          <Suspense fallback={<div>Загрузка...</div>}>
            <EditBankForm
              user={{
                bankName: user.bankName,
                bankBik: user.bankBik,
                bankAccount: user.bankAccount,
                bankCorAccount: user.bankCorAccount,
              }}
            />
          </Suspense>
        );
      case 'change-password':
        return (
          <Suspense fallback={<div>Загрузка...</div>}>
            <ChangePasswordForm />
          </Suspense>
        );
      case 'account':
        return (
          <div>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Личные данные</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Имя
                    </p>
                    <p>{user.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Фамилия
                    </p>
                    <p>{user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Отчество
                    </p>
                    <p>{user.middleName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Дата рождения
                    </p>
                    <p>
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString('ru-RU')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Телефон
                    </p>
                    <p>{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </p>
                    <p>{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Статус учётной записи */}
              {accountStatusSection()}
            </div>
          </div>
        );
      case 'passport':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Паспортные данные</h2>

              {user.useAlternativeDocument && user.alternativeDocument ? (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Альтернативный документ
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <p>{user.alternativeDocument}</p>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Дата рождения
                    </h4>
                    <p>
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString('ru-RU')
                        : '—'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Дата рождения
                    </h4>
                    <p>
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString('ru-RU')
                        : '—'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Серия паспорта
                    </h4>
                    <p>{user.passportSeries || '—'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Номер паспорта
                    </h4>
                    <p>{user.passportNumber || '—'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Код подразделения
                    </h4>
                    <p>{user.passportCode || '—'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Дата выдачи
                    </h4>
                    <p>
                      {user.passportIssueDate
                        ? new Date(user.passportIssueDate).toLocaleDateString(
                            'ru-RU'
                          )
                        : '—'}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      Кем выдан
                    </h4>
                    <p>{user.passportIssuedBy || '—'}</p>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Link href="/dashboard?section=edit-profile">
                  <Button className="mr-2">
                    Редактировать паспортные данные
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-lg font-semibold mb-4">
                Фото документа, удостоверяющего личность
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Загрузите фото документа, удостоверяющего личность.
              </p>
              <UploadDocumentButton />
            </div>
          </div>
        );
      case 'bank':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Банковские реквизиты</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Банковский счет
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Название банка
                      </h4>
                      <p>{user.bankName || '—'}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        БИК
                      </h4>
                      <p>{user.bankBik || '—'}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Номер счета
                      </h4>
                      <p>{user.bankAccount || '—'}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        Корреспондентский счет
                      </h4>
                      <p>{user.bankCorAccount || '—'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link href="/dashboard?section=edit-bank">
                    <Button className="mr-2">
                      Редактировать банковские реквизиты
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      case 'admin':
        // Проверяем, что пользователь является администратором
        if (user.role !== 'ADMIN') {
          return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <p className="text-muted-foreground">
                У вас нет доступа к панели администратора
              </p>
            </div>
          );
        }
        return (
          <Suspense fallback={<div>Загрузка...</div>}>
            <AdminDashboard />
          </Suspense>
        );
      default:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-6">Личный кабинет</h2>
              <p className="text-lg">
                Добро пожаловать, {user.firstName} {user.lastName}!
              </p>
              <p className="text-muted-foreground mt-2">
                Используйте меню слева для навигации по разделам личного
                кабинета.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Личные данные</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Управление личными и контактными данными
                </p>
                <Link href="/dashboard?section=account">
                  <Button variant="outline" className="w-full">
                    Перейти
                  </Button>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">
                  Паспортные данные
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Управление паспортными данными и документами
                </p>
                <Link href="/dashboard?section=passport">
                  <Button variant="outline" className="w-full">
                    Перейти
                  </Button>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">
                  Банковские реквизиты
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Управление банковскими реквизитами
                </p>
                <Link href="/dashboard?section=bank">
                  <Button variant="outline" className="w-full">
                    Перейти
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Мои покупки</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Просмотр всех купленных произведений
                </p>
                <Link href="/dashboard/transactions?tab=purchases">
                  <Button variant="outline" className="w-full">
                    Просмотреть покупки
                  </Button>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Мои продажи</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Просмотр всех проданных произведений
                </p>
                <div className="flex flex-col space-y-2">
                  <Link href="/dashboard/transactions?tab=sales">
                    <Button variant="outline" className="w-full">
                      Просмотреть продажи
                    </Button>
                  </Link>
                  <Link href="/sell">
                    <Button className="w-full">Создать предложение</Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-lg font-semibold mb-2">
                  Управление задачами
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Создание и отслеживание личных задач
                </p>
                <Link href="/dashboard/todo">
                  <Button variant="outline" className="w-full">
                    Перейти к задачам
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">ShopEMX</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          <aside className="bg-white p-4 rounded-lg border">
            <nav className="space-y-2">
              <div className="px-4 py-2 font-semibold text-sm text-muted-foreground">
                Основное меню
              </div>
              <Link
                href="/dashboard"
                className={`block px-4 py-2 rounded-md ${
                  section === 'main'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                Главная
              </Link>

              <Link
                href="/sell"
                className="block px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Продать
              </Link>

              <Link
                href="/buy"
                className="block px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Купить
              </Link>

              <div className="mt-4 px-4 py-2 font-semibold text-sm text-muted-foreground">
                Учетная запись
              </div>
              <Link
                href="/dashboard?section=account"
                className={`block px-4 py-2 rounded-md ${
                  section === 'account'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                Личные данные
              </Link>
              <Link
                href="/dashboard?section=passport"
                className={`block px-4 py-2 rounded-md ${
                  section === 'passport' || section === 'edit-profile'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                Паспортные данные
              </Link>
              <Link
                href="/dashboard?section=bank"
                className={`block px-4 py-2 rounded-md ${
                  section === 'bank' || section === 'edit-bank'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                Банковские реквизиты
              </Link>
              <Link
                href="/dashboard/transactions"
                className="block px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Мои транзакции
              </Link>
              <Link
                href="/dashboard/todo"
                className="block px-4 py-2 rounded-md hover:bg-gray-100"
              >
                Мои задачи
              </Link>
              <Link
                href="/dashboard?section=change-password"
                className={`block px-4 py-2 rounded-md ${
                  section === 'change-password'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100'
                }`}
              >
                Сменить пароль
              </Link>

              {user.role === 'ADMIN' && (
                <>
                  <div className="mt-4 px-4 py-2 font-semibold text-sm text-muted-foreground">
                    Администрирование
                  </div>
                  <Link
                    href="/dashboard?section=admin"
                    className={`block px-4 py-2 rounded-md ${
                      section === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    Панель администратора
                  </Link>
                </>
              )}
            </nav>
          </aside>

          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-2xl font-bold mb-6">Учётная запись</h2>
            {renderContent()}
          </div>
        </div>
      </main>

      <Toaster />

      {/* Клиентский компонент для уведомлений */}
      <WelcomeNotification />
    </div>
  );
}
