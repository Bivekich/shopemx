'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface LogoutButtonProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  className?: string;
}

export function LogoutButton({
  variant = 'ghost',
  className = '',
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Очищаем время входа при выходе из системы
      localStorage.removeItem('loginTime');

      // Отправляем запрос на выход
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при выходе из системы');
      }

      toast.success('Вы успешно вышли из системы');

      // Небольшая задержка перед перенаправлением, чтобы пользователь увидел сообщение
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      console.error('Ошибка при выходе из системы:', error);
      toast.error('Произошла ошибка при выходе из системы');
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      className={`flex items-center ${className}`}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Выход...
        </>
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </>
      )}
    </Button>
  );
}
