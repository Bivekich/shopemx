import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Если пользователь не авторизован, перенаправляем на главную страницу
  if (!user) {
    redirect('/');
  }

  // Если пользователь не администратор, перенаправляем на страницу дашборда
  if (user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AdminDashboard />;
}
