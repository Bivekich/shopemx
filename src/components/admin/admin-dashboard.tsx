'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerificationRequestsList } from './verification-requests-list';
import { UsersList } from './users-list';
import Link from 'next/link';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('verification-requests');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <Link href="/dashboard">
          <Button variant="outline">Вернуться в личный кабинет</Button>
        </Link>
      </div>

      <Tabs
        defaultValue="verification-requests"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verification-requests">
            Заявки на подтверждение
          </TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
        </TabsList>
        <TabsContent value="verification-requests" className="mt-6">
          <VerificationRequestsList />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
