'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';

// Типы для пользователей
interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
  birthDate?: string | Date;
  // Паспортные данные
  passportSeries?: string;
  passportNumber?: string;
  passportCode?: string;
  passportIssueDate?: string | Date;
  passportIssuedBy?: string;
  // Альтернативный документ
  useAlternativeDocument?: boolean;
  alternativeDocument?: string;
  // Банковские данные
  bankName?: string;
  bankBik?: string;
  bankAccount?: string;
  bankCorAccount?: string;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [userDocumentUrl, setUserDocumentUrl] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Загрузка пользователей при монтировании компонента
  useEffect(() => {
    fetchUsers();
  }, []);

  // Функция для загрузки пользователей
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Ошибка при загрузке пользователей');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error);
      toast.error('Не удалось загрузить список пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Функция для открытия диалога с деталями пользователя
  const openUserDetailsDialog = async (user: User) => {
    setSelectedUser(user);
    setShowUserDetailsDialog(true);

    // Загружаем документ пользователя, если он есть
    setIsLoadingDocument(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/document`);
      if (response.ok) {
        const data = await response.json();
        setUserDocumentUrl(data.documentUrl);
      } else {
        setUserDocumentUrl(null);
      }
    } catch (error) {
      console.error('Ошибка при загрузке документа:', error);
      setUserDocumentUrl(null);
    } finally {
      setIsLoadingDocument(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>
            Список зарегистрированных пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-muted-foreground">
              Нет зарегистрированных пользователей
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Пользователи</CardTitle>
          <CardDescription>
            Список зарегистрированных пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Список пользователей системы</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="flex items-center">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-left"
                          onClick={() => openUserDetailsDialog(user)}
                        >
                          {`${user.lastName} ${user.firstName} ${
                            user.middleName || ''
                          }`}
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {user.isVerified ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          <span>Подтвержден</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          <span>Не подтвержден</span>
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openUserDetailsDialog(user)}
                    >
                      Подробнее
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог с деталями пользователя */}
      <Dialog
        open={showUserDetailsDialog}
        onOpenChange={setShowUserDetailsDialog}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
            <DialogDescription>
              Полная информация о пользователе
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Личные данные */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Личные данные</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Имя
                    </p>
                    <p>{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Фамилия
                    </p>
                    <p>{selectedUser.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Отчество
                    </p>
                    <p>{selectedUser.middleName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Дата рождения
                    </p>
                    <p>
                      {selectedUser.birthDate
                        ? new Date(selectedUser.birthDate).toLocaleDateString(
                            'ru-RU'
                          )
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Телефон
                    </p>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </p>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Роль
                    </p>
                    <p>
                      {selectedUser.role === 'ADMIN'
                        ? 'Администратор'
                        : 'Пользователь'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Статус
                    </p>
                    <p>
                      {selectedUser.isVerified
                        ? 'Подтвержден'
                        : 'Не подтвержден'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Паспортные данные или альтернативный документ */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedUser.useAlternativeDocument
                    ? 'Альтернативный документ'
                    : 'Паспортные данные'}
                </h3>

                {selectedUser.useAlternativeDocument ? (
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <p>{selectedUser.alternativeDocument || '—'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Серия паспорта
                      </p>
                      <p>{selectedUser.passportSeries || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Номер паспорта
                      </p>
                      <p>{selectedUser.passportNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Код подразделения
                      </p>
                      <p>{selectedUser.passportCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Дата выдачи
                      </p>
                      <p>
                        {selectedUser.passportIssueDate
                          ? new Date(
                              selectedUser.passportIssueDate
                            ).toLocaleDateString('ru-RU')
                          : '—'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Кем выдан
                      </p>
                      <p>{selectedUser.passportIssuedBy || '—'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Банковские реквизиты */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  Банковские реквизиты
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Название банка
                    </p>
                    <p>{selectedUser.bankName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      БИК
                    </p>
                    <p>{selectedUser.bankBik || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Номер счета
                    </p>
                    <p>{selectedUser.bankAccount || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Корреспондентский счет
                    </p>
                    <p>{selectedUser.bankCorAccount || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Фото документа */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Фото документа</h3>
                {isLoadingDocument ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : userDocumentUrl ? (
                  <div className="border rounded-md p-2">
                    <Image
                      src={userDocumentUrl}
                      alt="Документ пользователя"
                      className="max-h-[300px] object-contain mx-auto"
                      width={500}
                      height={300}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center bg-gray-50 border rounded-md">
                    <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Документ не загружен
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUserDetailsDialog(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
