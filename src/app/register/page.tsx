import { RegisterForm } from '@/components/forms/register-form';
import { Toaster } from '@/components/ui/sonner';
import { redirect } from 'next/navigation';

interface SearchParamsType {
  phone?: string;
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsType>;
}) {
  const params = await searchParams;

  // Если номер телефона не передан, перенаправляем на главную страницу
  if (!params.phone) {
    redirect('/');
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ShopEMX</h1>
          <p className="text-muted-foreground">Создание новой учетной записи</p>
        </div>

        <RegisterForm />
      </div>

      <Toaster />
    </div>
  );
}
