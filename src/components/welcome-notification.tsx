'use client';

import { useState, useEffect } from 'react';
import { NotificationDialog } from '@/components/ui/notification-dialog';

export function WelcomeNotification() {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Проверяем, было ли уже показано уведомление в этой сессии
    const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');

    if (!hasShownWelcome) {
      // Если уведомление еще не было показано, показываем его
      setShowNotification(true);
      // Отмечаем, что уведомление было показано
      sessionStorage.setItem('hasShownWelcome', 'true');
    }
  }, []);

  return (
    <NotificationDialog
      open={showNotification}
      onClose={() => setShowNotification(false)}
      title="Добро пожаловать!"
      description="Вы успешно вошли в систему ShopEMX. Добро пожаловать в вашу учётную запись."
      actionLabel="Продолжить"
    />
  );
}
