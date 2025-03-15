'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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

// Типы для заявок на подтверждение
interface VerificationRequest {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  user?: User;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string;
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

export function VerificationRequestsList() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] =
    useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showUserDetailsDialog, setShowUserDetailsDialog] = useState(false);
  const [userDocumentUrl, setUserDocumentUrl] = useState<string | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  // Загрузка заявок при монтировании компонента
  useEffect(() => {
    fetchRequests();
  }, []);

  // Функция для загрузки заявок
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/verification-requests');
      if (!response.ok) {
        throw new Error('Ошибка при загрузке заявок');
      }
      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      console.error('Ошибка при загрузке заявок:', error);
      toast.error('Не удалось загрузить заявки на подтверждение');
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для одобрения заявки
  const handleApprove = async (requestId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/verification-requests/${requestId}/approve`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка при одобрении заявки');
      }

      toast.success('Заявка успешно одобрена');
      fetchRequests(); // Обновляем список заявок
    } catch (error) {
      console.error('Ошибка при одобрении заявки:', error);
      toast.error(
        error instanceof Error ? error.message : 'Ошибка при одобрении заявки'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Функция для отклонения заявки
  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      toast.error('Укажите причину отклонения');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/admin/verification-requests/${selectedRequest.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка при отклонении заявки');
      }

      toast.success('Заявка отклонена');
      setShowRejectDialog(false);
      setRejectionReason('');
      fetchRequests(); // Обновляем список заявок
    } catch (error) {
      console.error('Ошибка при отклонении заявки:', error);
      toast.error(
        error instanceof Error ? error.message : 'Ошибка при отклонении заявки'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Функция для открытия диалога отклонения заявки
  const openRejectDialog = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  // Функция для форматирования даты
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

  // Функция для получения статуса заявки
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            На рассмотрении
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Одобрена
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Отклонена
          </Badge>
        );
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  // Функция для открытия диалога с деталями пользователя
  const openUserDetailsDialog = async (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowUserDetailsDialog(true);

    // Загружаем документ пользователя, если он есть
    if (request.user) {
      setIsLoadingDocument(true);
      try {
        const response = await fetch(
          `/api/admin/users/${request.userId}/document`
        );
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
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Заявки на подтверждение</CardTitle>
          <CardDescription>
            Здесь будут отображаться заявки пользователей на подтверждение
            аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Нет активных заявок на подтверждение
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
          <CardTitle>Заявки на подтверждение</CardTitle>
          <CardDescription>
            Управление заявками пользователей на подтверждение аккаунта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Список заявок на подтверждение аккаунта</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Пользователь</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.user ? (
                      <div>
                        <div className="flex items-center">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left"
                            onClick={() => openUserDetailsDialog(request)}
                          >
                            {`${request.user.lastName} ${
                              request.user.firstName
                            } ${request.user.middleName || ''}`}
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.user.email}
                        </div>
                      </div>
                    ) : (
                      `Пользователь ID: ${request.userId}`
                    )}
                  </TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-right">
                    {request.status === 'PENDING' && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleApprove(request.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Одобрить
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => openRejectDialog(request)}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    )}
                    {request.status === 'REJECTED' &&
                      request.rejectionReason && (
                        <div className="text-sm text-muted-foreground">
                          Причина: {request.rejectionReason}
                        </div>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Диалог отклонения заявки */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонение заявки</DialogTitle>
            <DialogDescription>
              Укажите причину отклонения заявки. Эта информация будет
              отображаться пользователю.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Причина отклонения</Label>
              <Textarea
                id="reason"
                placeholder="Укажите причину отклонения заявки"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isProcessing}
            >
              Отмена
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Отклонить заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог с деталями пользователя */}
      <Dialog
        open={showUserDetailsDialog}
        onOpenChange={setShowUserDetailsDialog}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
            <DialogDescription>
              Полная информация о пользователе для принятия решения о
              верификации
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.user && (
            <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Личные данные */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Личные данные</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Имя
                    </p>
                    <p>{selectedRequest.user.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Фамилия
                    </p>
                    <p>{selectedRequest.user.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Отчество
                    </p>
                    <p>{selectedRequest.user.middleName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Дата рождения
                    </p>
                    <p>
                      {selectedRequest.user.birthDate
                        ? new Date(
                            selectedRequest.user.birthDate
                          ).toLocaleDateString('ru-RU')
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Телефон
                    </p>
                    <p>{selectedRequest.user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </p>
                    <p>{selectedRequest.user.email}</p>
                  </div>
                </div>
              </div>

              {/* Паспортные данные или альтернативный документ */}
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedRequest.user.useAlternativeDocument
                    ? 'Альтернативный документ'
                    : 'Паспортные данные'}
                </h3>

                {selectedRequest.user.useAlternativeDocument ? (
                  <div className="bg-gray-50 p-4 rounded-md border">
                    <p>{selectedRequest.user.alternativeDocument || '—'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Серия паспорта
                      </p>
                      <p>{selectedRequest.user.passportSeries || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Номер паспорта
                      </p>
                      <p>{selectedRequest.user.passportNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Код подразделения
                      </p>
                      <p>{selectedRequest.user.passportCode || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Дата выдачи
                      </p>
                      <p>
                        {selectedRequest.user.passportIssueDate
                          ? new Date(
                              selectedRequest.user.passportIssueDate
                            ).toLocaleDateString('ru-RU')
                          : '—'}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        Кем выдан
                      </p>
                      <p>{selectedRequest.user.passportIssuedBy || '—'}</p>
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
                    <p>{selectedRequest.user.bankName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      БИК
                    </p>
                    <p>{selectedRequest.user.bankBik || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Номер счета
                    </p>
                    <p>{selectedRequest.user.bankAccount || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Корреспондентский счет
                    </p>
                    <p>{selectedRequest.user.bankCorAccount || '—'}</p>
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
                    <img
                      src={userDocumentUrl}
                      alt="Документ пользователя"
                      className="max-h-[300px] object-contain mx-auto"
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
            {selectedRequest?.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUserDetailsDialog(false);
                    if (selectedRequest) {
                      openRejectDialog(selectedRequest);
                    }
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Отклонить
                </Button>
                <Button
                  onClick={() => {
                    if (selectedRequest) {
                      handleApprove(selectedRequest.id);
                      setShowUserDetailsDialog(false);
                    }
                  }}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Одобрить
                </Button>
              </>
            )}
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
