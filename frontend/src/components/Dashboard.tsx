'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TodoList } from '@/types';
import TodoListCard from '@/components/TodoListCard';
import CreateTodoList from '@/components/CreateTodoList';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
    const { data: lists, isLoading, isError } = useQuery<TodoList[]>({
        queryKey: ['todolists'],
        queryFn: async () => {
            const response = await api.get('/api/todolists');
            return response.data;
        },
    });

    return (
        <div className="container mx-auto p-8 max-w-6xl">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4">
                    My Todo Lists
                </h1>
                <p className="text-gray-500 mb-8">Organize your tasks efficiently.</p>

                <div className="flex justify-center">
                    <CreateTodoList />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            ) : isError ? (
                <div className="text-center text-red-500 p-8 bg-red-50 rounded-lg">
                    Failed to load todo lists. Please try again.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lists?.map((list) => (
                        <div key={list.id} className="group relative">
                            <TodoListCard list={list} />
                        </div>
                    ))}
                    {lists?.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No todo lists found. Create one above!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
