'use client';

import { useState, useEffect } from 'react';
import { UserDropdown } from '@/components/user-dropdown';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, FileText, Search, Upload } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

// Интерфейсы для страницы транзакций
interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string;
  email: string;
}

interface Author {
  firstName: string;
  lastName: string;
  middleName: string | null;
}

interface Artwork {
  id: string;
  title: string;
  description: string;
  filePath: string;
  author: Author;
}

interface Transaction {
  id: string;
  price: number | null;
  isFree: boolean;
  contractType: 'EXCLUSIVE_RIGHTS' | 'LICENSE';
  licenseType: 'EXCLUSIVE' | 'NON_EXCLUSIVE' | null;
  isPerpetual: boolean | null;
  licenseDuration: number | null;
  createdAt: string;
  updatedAt: string;
  status: string;
  sellerId: string;
  buyerId: string | null;
  contractPath: string | null;
  artwork: Artwork;
  seller?: User;
  buyer?: User;
}

export default function TransactionsPage() {
  // Состояния
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState('purchases');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractTypeFilter, setContractTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Получение данных пользователя и транзакций
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        // Получаем текущего пользователя
        const userResponse = await fetch('/api/user');
        if (!userResponse.ok) {
          throw new Error('Не удалось получить данные пользователя');
        }
        const userData = await userResponse.json();
        setUser(userData.user);

        // Получаем покупки пользователя
        const purchasesResponse = await fetch('/api/transactions/purchases');
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          setPurchases(purchasesData.purchases || []);
        }

        // Получаем продажи пользователя
        const salesResponse = await fetch('/api/transactions/sales');
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          setSales(salesData.sales || []);
        }

        // Проверяем URL для установки активной вкладки
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam === 'purchases' || tabParam === 'sales') {
          setActiveTab(tabParam);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Редирект на страницу логина, если пользователь не авторизован
  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/';
    }
  }, [isLoading, user]);

  // Функции для фильтрации и сортировки
  const filterTransactions = (transactions: Transaction[]) => {
    return transactions
      .filter((transaction) => {
        // Фильтрация по поисковому запросу
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          searchTerm === '' ||
          transaction.artwork.title.toLowerCase().includes(searchLower) ||
          transaction.artwork.description.toLowerCase().includes(searchLower);

        // Фильтрация по статусу
        const matchesStatus =
          statusFilter === 'all' || transaction.status === statusFilter;

        // Фильтрация по типу контракта
        const matchesContractType =
          contractTypeFilter === 'all' ||
          transaction.contractType === contractTypeFilter;

        // Фильтрация по времени
        let matchesTime = true;
        if (timeFilter !== 'all') {
          const now = new Date();
          const transactionDate = new Date(transaction.updatedAt);
          const diffInDays = Math.floor(
            (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (timeFilter === 'last-week' && diffInDays > 7) {
            matchesTime = false;
          } else if (timeFilter === 'last-month' && diffInDays > 30) {
            matchesTime = false;
          } else if (timeFilter === 'last-year' && diffInDays > 365) {
            matchesTime = false;
          }
        }

        return (
          matchesSearch && matchesStatus && matchesContractType && matchesTime
        );
      })
      .sort((a, b) => {
        // Сортировка
        if (sortBy === 'date-desc') {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        } else if (sortBy === 'date-asc') {
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        } else if (sortBy === 'price-desc') {
          const priceA = a.isFree ? 0 : a.price || 0;
          const priceB = b.isFree ? 0 : b.price || 0;
          return priceB - priceA;
        } else if (sortBy === 'price-asc') {
          const priceA = a.isFree ? 0 : a.price || 0;
          const priceB = b.isFree ? 0 : b.price || 0;
          return priceA - priceB;
        }
        return 0;
      });
  };

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

  // Получение статуса в текстовом виде
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает подтверждения';
      case 'ACTIVE':
        return 'Активно';
      case 'ACCEPTED':
        return 'Завершено';
      case 'DECLINED':
        return 'Отклонено';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return status;
    }
  };

  // Получение цвета бейджа статуса
  const getStatusBadgeVariant = (
    status: string
  ):
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'warning'
    | 'success' => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACTIVE':
        return 'default';
      case 'ACCEPTED':
        return 'success';
      case 'DECLINED':
        return 'destructive';
      case 'CANCELLED':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Форматирование относительной даты
  const formatRelativeDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ru,
    });
  };

  // Форматирование типа договора
  const formatContractType = (transaction: Transaction) => {
    if (transaction.contractType === 'EXCLUSIVE_RIGHTS') {
      return 'Исключительные права';
    } else {
      return transaction.licenseType === 'EXCLUSIVE'
        ? 'Исключительная лицензия'
        : 'Неисключительная лицензия';
    }
  };

  // Форматирование срока лицензии
  const formatLicenseDuration = (transaction: Transaction) => {
    if (transaction.contractType === 'LICENSE') {
      if (transaction.isPerpetual) {
        return 'Бессрочно';
      } else if (transaction.licenseDuration) {
        return `${transaction.licenseDuration} ${getDurationText(
          transaction.licenseDuration
        )}`;
      }
    }
    return '-';
  };

  // Склонение слова "год" в зависимости от числа
  const getDurationText = (years: number) => {
    const lastDigit = years % 10;
    const lastTwoDigits = years % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'лет';
    }

    if (lastDigit === 1) {
      return 'год';
    }

    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'года';
    }

    return 'лет';
  };

  // Если данные еще загружаются
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
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

  // Сохраняем время входа для отображения в компоненте UserDropdown
  const loginTimestamp = `${formattedDate} в ${formattedTime}`;

  // Фильтрованные и отсортированные транзакции
  const filteredPurchases = filterTransactions(purchases);
  const filteredSales = filterTransactions(sales);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold">ShopEMX</h1>
            </Link>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <UserDropdown
                user={{
                  firstName: user.firstName,
                  lastName: user.lastName,
                }}
                loginTime={loginTimestamp}
              />
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Мои транзакции</h2>
              <Link href="/dashboard">
                <Button variant="outline">Назад к профилю</Button>
              </Link>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger
                  value="purchases"
                  className="flex gap-2 items-center"
                >
                  <Download size={16} />
                  Покупки
                  <Badge variant="secondary" className="ml-1">
                    {filteredPurchases.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex gap-2 items-center">
                  <Upload size={16} />
                  Продажи
                  <Badge variant="secondary" className="ml-1">
                    {filteredSales.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="relative col-span-1 md:col-span-4">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск по названию или описанию"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="ACTIVE">Активные</SelectItem>
                      <SelectItem value="ACCEPTED">Завершенные</SelectItem>
                      <SelectItem value="PENDING">Ожидающие</SelectItem>
                      <SelectItem value="DECLINED">Отклоненные</SelectItem>
                      <SelectItem value="CANCELLED">Отмененные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Select
                    value={contractTypeFilter}
                    onValueChange={setContractTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Тип договора" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="EXCLUSIVE_RIGHTS">
                        Исключительные права
                      </SelectItem>
                      <SelectItem value="LICENSE">Лицензия</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Период" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все время</SelectItem>
                      <SelectItem value="last-week">
                        Последняя неделя
                      </SelectItem>
                      <SelectItem value="last-month">
                        Последний месяц
                      </SelectItem>
                      <SelectItem value="last-year">Последний год</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Сначала новые</SelectItem>
                      <SelectItem value="date-asc">Сначала старые</SelectItem>
                      <SelectItem value="price-desc">
                        По убыванию цены
                      </SelectItem>
                      <SelectItem value="price-asc">
                        По возрастанию цены
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="purchases">
                {filteredPurchases.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-muted-foreground">
                      {searchTerm ||
                      statusFilter !== 'all' ||
                      contractTypeFilter !== 'all' ||
                      timeFilter !== 'all'
                        ? 'Нет результатов, соответствующих заданным фильтрам'
                        : 'У вас пока нет покупок'}
                    </p>
                    {!searchTerm &&
                      statusFilter === 'all' &&
                      contractTypeFilter === 'all' &&
                      timeFilter === 'all' && (
                        <div className="mt-4">
                          <Link href="/buy">
                            <Button>Перейти к покупке</Button>
                          </Link>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPurchases.map((transaction) => (
                      <Card
                        key={transaction.id}
                        className="h-full flex flex-col"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="line-clamp-2 hover:line-clamp-none">
                              {transaction.artwork.title}
                            </CardTitle>
                            <Badge
                              variant={
                                getStatusBadgeVariant(transaction.status) as
                                  | 'default'
                                  | 'destructive'
                                  | 'outline'
                                  | 'secondary'
                              }
                            >
                              {getStatusText(transaction.status)}
                            </Badge>
                          </div>
                          <CardDescription>
                            Автор: {transaction.artwork.author.lastName}{' '}
                            {transaction.artwork.author.firstName}{' '}
                            {transaction.artwork.author.middleName || ''}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="space-y-2">
                            <p className="text-sm line-clamp-3 hover:line-clamp-none">
                              {transaction.artwork.description}
                            </p>
                            <div className="flex justify-between items-center pt-2">
                              <div className="text-sm text-muted-foreground">
                                {formatContractType(transaction)}
                              </div>
                              <div className="font-medium">
                                {formatPrice(
                                  transaction.price,
                                  transaction.isFree
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Срок: {formatLicenseDuration(transaction)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatRelativeDate(transaction.updatedAt)}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2 border-t">
                          <div className="w-full flex justify-between items-center">
                            <Link
                              href={transaction.artwork.filePath}
                              target="_blank"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Eye size={16} />
                                Просмотр
                              </Button>
                            </Link>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <FileText size={16} />
                                  Договор
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Договор о передаче прав
                                  </DialogTitle>
                                  <DialogDescription>
                                    Договор для произведения &quot;
                                    {transaction.artwork.title}&quot;
                                  </DialogDescription>
                                </DialogHeader>
                                {transaction.contractPath ? (
                                  <div className="mt-4">
                                    <div className="bg-gray-50 p-4 rounded-md">
                                      <iframe
                                        src={transaction.contractPath}
                                        className="w-full h-[50vh] border rounded"
                                      ></iframe>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                      <Link
                                        href={transaction.contractPath}
                                        download
                                      >
                                        <Button className="flex items-center gap-2">
                                          <Download size={16} />
                                          Скачать договор
                                        </Button>
                                      </Link>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8">
                                    <p className="text-muted-foreground">
                                      Договор недоступен для просмотра
                                    </p>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Link href={transaction.artwork.filePath} download>
                              <Button
                                size="sm"
                                className="flex items-center gap-2"
                              >
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
              </TabsContent>

              <TabsContent value="sales">
                {filteredSales.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-lg text-muted-foreground">
                      {searchTerm ||
                      statusFilter !== 'all' ||
                      contractTypeFilter !== 'all' ||
                      timeFilter !== 'all'
                        ? 'Нет результатов, соответствующих заданным фильтрам'
                        : 'У вас пока нет предложений на продажу'}
                    </p>
                    {!searchTerm &&
                      statusFilter === 'all' &&
                      contractTypeFilter === 'all' &&
                      timeFilter === 'all' && (
                        <div className="mt-4">
                          <Link href="/sell">
                            <Button>Выставить на продажу</Button>
                          </Link>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSales.map((transaction) => (
                      <Card
                        key={transaction.id}
                        className="h-full flex flex-col"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="line-clamp-2 hover:line-clamp-none">
                              {transaction.artwork.title}
                            </CardTitle>
                            <Badge
                              variant={
                                getStatusBadgeVariant(transaction.status) as
                                  | 'default'
                                  | 'destructive'
                                  | 'outline'
                                  | 'secondary'
                              }
                            >
                              {getStatusText(transaction.status)}
                            </Badge>
                          </div>
                          <CardDescription>
                            {transaction.buyerId ? (
                              <span>
                                Покупатель:{' '}
                                {transaction.buyer?.lastName || 'Неизвестно'}{' '}
                                {transaction.buyer?.firstName || ''}
                              </span>
                            ) : (
                              <span>Ожидает покупателя</span>
                            )}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="space-y-2">
                            <p className="text-sm line-clamp-3 hover:line-clamp-none">
                              {transaction.artwork.description}
                            </p>
                            <div className="flex justify-between items-center pt-2">
                              <div className="text-sm text-muted-foreground">
                                {formatContractType(transaction)}
                              </div>
                              <div className="font-medium">
                                {formatPrice(
                                  transaction.price,
                                  transaction.isFree
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Срок: {formatLicenseDuration(transaction)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatRelativeDate(transaction.updatedAt)}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-2 border-t">
                          <div className="w-full flex justify-between items-center">
                            <Link
                              href={transaction.artwork.filePath}
                              target="_blank"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Eye size={16} />
                                Просмотр
                              </Button>
                            </Link>
                            {transaction.status === 'PENDING' ? (
                              <Link href={`/sell/confirm/${transaction.id}`}>
                                <Button
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  Подтвердить
                                </Button>
                              </Link>
                            ) : (
                              <>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex items-center gap-2"
                                    >
                                      <FileText size={16} />
                                      Договор
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Договор о передаче прав
                                      </DialogTitle>
                                      <DialogDescription>
                                        Договор для произведения &quot;
                                        {transaction.artwork.title}&quot;
                                      </DialogDescription>
                                    </DialogHeader>
                                    {transaction.contractPath ? (
                                      <div className="mt-4">
                                        <div className="bg-gray-50 p-4 rounded-md">
                                          <iframe
                                            src={transaction.contractPath}
                                            className="w-full h-[50vh] border rounded"
                                          ></iframe>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                          <Link
                                            href={transaction.contractPath}
                                            download
                                          >
                                            <Button className="flex items-center gap-2">
                                              <Download size={16} />
                                              Скачать договор
                                            </Button>
                                          </Link>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8">
                                        <p className="text-muted-foreground">
                                          Договор будет доступен после
                                          подтверждения предложения
                                        </p>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Toaster />
    </div>
  );
}
