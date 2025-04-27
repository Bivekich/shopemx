import { VerificationForm } from '@/components/forms/verification-form';
import { VerificationStatus } from '@/components/verification-status';
import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function VerifyPage() {
  // Проверяем, авторизован ли пользователь
  const user = await getCurrentUser();

  // Если пользователь не авторизован, перенаправляем на главную страницу
  if (!user) {
    redirect('/');
  }

  // Проверяем, есть ли активные коды верификации для входа
  const hasActiveVerificationCodes = await prisma.verificationCode.findFirst({
    where: {
      userId: user.id,
      status: 'PENDING',
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  // Получаем полные данные пользователя из базы данных
  const userProfile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      isVerified: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      birthDate: true,
      passportSeries: true,
      passportNumber: true,
      passportCode: true,
      passportIssueDate: true,
      passportIssuedBy: true,
      bankName: true,
      bankBik: true,
      bankAccount: true,
      bankCorAccount: true,
      useAlternativeDocument: true,
      alternativeDocument: true,
    },
  });

  // Подготавливаем данные пользователя для компонента VerificationStatus
  const userData = {
    isVerified: userProfile?.isVerified || false,
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    birthDate: userProfile?.birthDate
      ? userProfile.birthDate.toISOString()
      : undefined,
    passportSeries: userProfile?.passportSeries || undefined,
    passportNumber: userProfile?.passportNumber || undefined,
    passportCode: userProfile?.passportCode || undefined,
    passportIssueDate: userProfile?.passportIssueDate
      ? userProfile.passportIssueDate.toISOString()
      : undefined,
    passportIssuedBy: userProfile?.passportIssuedBy || undefined,
    bankName: userProfile?.bankName || undefined,
    bankBik: userProfile?.bankBik || undefined,
    bankAccount: userProfile?.bankAccount || undefined,
    bankCorAccount: userProfile?.bankCorAccount || undefined,
    useAlternativeDocument: userProfile?.useAlternativeDocument || false,
    alternativeDocument: userProfile?.alternativeDocument || undefined,
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ShopEMX</h1>
          {hasActiveVerificationCodes ? (
            <p className="text-muted-foreground">Подтверждение входа</p>
          ) : (
            <p className="text-muted-foreground">Статус верификации</p>
          )}
        </div>

        {hasActiveVerificationCodes ? (
          // Форма подтверждения входа
          <VerificationForm />
        ) : (
          // Компонент статуса верификации аккаунта
          <VerificationStatus user={userData} />
        )}
      </div>

      <Toaster />
    </div>
  );
}
