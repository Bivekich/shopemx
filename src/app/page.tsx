import { LoginForm } from '@/components/forms/login-form';
import { Toaster } from '@/components/ui/sonner';

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">ShopEMX</h1>
          <p className="text-muted-foreground">
            Система документооборота по продаже и покупке интеллектуальной
            собственности
          </p>
        </div>

        <LoginForm />
      </div>

      <Toaster />
    </div>
  );
}
