import { Todo } from '@/components/Todo';

export const metadata = {
  title: 'Список задач | ShopEMX',
  description: 'Управление задачами',
};

export default function TodoPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Управление задачами</h1>
      <div className="flex justify-center">
        <Todo />
      </div>
    </div>
  );
}
