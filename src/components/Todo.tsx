'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (!newTodo.trim()) return;

    const todo: TodoItem = {
      id: Date.now().toString(),
      text: newTodo,
      completed: false,
    };

    setTodos((prev) => [...prev, todo]);
    setNewTodo('');
    toast.success('Задача добавлена');
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    toast.info('Задача удалена');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Список задач</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Добавить новую задачу..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
            />
            <Button onClick={addTodo}>Добавить</Button>
          </div>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <p className="text-center text-muted-foreground">Нет задач</p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => toggleTodo(todo.id)}
                      id={`todo-${todo.id}`}
                    />
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={`${
                        todo.completed
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {todo.text}
                    </label>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteTodo(todo.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p>Всего задач: {todos.length}</p>
        <p>
          Выполнено: {todos.filter((todo) => todo.completed).length}/
          {todos.length}
        </p>
      </CardFooter>
    </Card>
  );
}
