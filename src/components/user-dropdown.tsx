'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/logout-button';
import { ChevronDown, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserDropdownProps {
  user: {
    firstName: string;
    lastName: string;
  };
  loginTime: string;
}

export function UserDropdown({ user, loginTime }: UserDropdownProps) {
  const [storedLoginTime, setStoredLoginTime] = useState<string | null>(null);

  // При первой загрузке проверяем, есть ли сохраненное время входа
  useEffect(() => {
    const savedLoginTime = localStorage.getItem('loginTime');

    // Если времени входа нет в localStorage или это первый вход в сессии, сохраняем текущее время
    if (!savedLoginTime) {
      localStorage.setItem('loginTime', loginTime);
      setStoredLoginTime(loginTime);
    } else {
      setStoredLoginTime(savedLoginTime);
    }

    // Очищаем время входа при выходе из системы
    return () => {
      // Не очищаем при обычном размонтировании компонента
    };
  }, [loginTime]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span>
            {user.firstName} {user.lastName}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex flex-col items-start">
          <span className="text-sm font-medium">Время входа:</span>
          <span className="text-sm text-green-600">
            {storedLoginTime || loginTime}
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogoutButton variant="ghost" className="w-full justify-start p-0" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
