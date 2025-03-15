import { VerificationForm } from '@/components/forms/verification-form';
import { Toaster } from '@/components/ui/sonner';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function VerifyPage() {
  // Проверяем, авторизован ли пользователь
  const user = await getCurrentUser();

  // Если пользователь не авторизован, перенаправляем на главную страницу
  if (!user) {
    redirect('/');
  }

  // Если пользователь уже верифицирован, перенаправляем в личный кабинет
  if (user.isVerified) {
    redirect('/dashboard');
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ShopEMX</h1>
          <p className="text-muted-foreground">Подтверждение входа</p>
        </div>

        <VerificationForm />
      </div>

      <Toaster />
    </div>
  );
}
