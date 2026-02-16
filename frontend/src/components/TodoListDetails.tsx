'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TodoList, TodoItem as TodoItemType, CreateItemDto } from '@/types';
import TodoItem from '@/components/TodoItem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { Virtuoso } from 'react-virtuoso';

interface TodoListDetailsProps {
    listId: number;
}

export default function TodoListDetails({ listId }: TodoListDetailsProps) {
    const queryClient = useQueryClient();
    const [newItemDescription, setNewItemDescription] = useState('');

    // Fetch List Details
    const { data: list, isLoading: listLoading } = useQuery<TodoList>({
        queryKey: ['todolist', listId],
        queryFn: async () => {
            const res = await api.get(`/api/todolists/${listId}`);
            return res.data;
        }
    });

    // Fetch Items
    const { data: items, isLoading: itemsLoading } = useQuery<TodoItemType[]>({
        queryKey: ['todolist', listId, 'items'],
        queryFn: async () => {
            const res = await api.get(`/api/todolists/item/${listId}`);
            return res.data;
        }
    });

    // Mutations
    const addItemMutation = useMutation({
        mutationFn: (newItem: CreateItemDto) => api.post('/api/todolists/item', newItem),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todolist', listId, 'items'] });
            setNewItemDescription('');
        }
    });

    const toggleItemMutation = useMutation({
        mutationFn: (item: TodoItemType) =>
            api.put(`/api/todolists/item/${item.id}`, {
                done: !item.done,
                description: item.description,
                todoListId: item.todoListId
            }),
        onMutate: async (itemToToggle) => {
            await queryClient.cancelQueries({ queryKey: ['todolist', listId, 'items'] });
            const previousItems = queryClient.getQueryData<TodoItemType[]>(['todolist', listId, 'items']);

            if (previousItems) {
                queryClient.setQueryData<TodoItemType[]>(['todolist', listId, 'items'],
                    previousItems.map(item =>
                        item.id === itemToToggle.id ? { ...item, done: !item.done } : item
                    )
                );
            }

            return { previousItems };
        },
        onError: (err, itemToToggle, context) => {
            if (context?.previousItems) {
                queryClient.setQueryData(['todolist', listId, 'items'], context.previousItems);
            }
        },
        onSettled: () => {
            // Invalidate to ensure consistency, but maybe with a slight delay or rely on next fetch
            // Removing immediate invalidation prevents race condition with async backend
            // queryClient.invalidateQueries({ queryKey: ['todolist', listId, 'items'] });
        }
    });

    const updateItemMutation = useMutation({
        mutationFn: ({ item, description }: { item: TodoItemType; description: string }) =>
            api.put(`/api/todolists/item/${item.id}`, {
                done: item.done,
                description: description,
                todoListId: item.todoListId
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todolist', listId, 'items'] });
        }
    });

    const deleteItemMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/todolists/item/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todolist', listId, 'items'] });
        }
    });

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemDescription.trim()) return;
        addItemMutation.mutate({
            description: newItemDescription,
            done: false,
            todoListId: listId
        });
    };

    // Real-time updates
    useEffect(() => {
        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Connected to WebSocket');
            socket.emit('joinList', listId);
        });

        socket.on('itemUpdated', (updatedItem: TodoItemType) => {
            queryClient.setQueryData<TodoItemType[]>(['todolist', listId, 'items'], (oldItems) => {
                if (!oldItems) return [updatedItem];

                const exists = oldItems.find(i => i.id === updatedItem.id);
                if (exists) {
                    return oldItems.map(item => item.id === updatedItem.id ? updatedItem : item);
                } else {
                    return [...oldItems, updatedItem];
                }
            });
        });

        return () => {
            socket.emit('leaveList', listId);
            socket.disconnect();
        };
    }, [listId, queryClient]);

    if (listLoading || itemsLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!list) return <div className="text-center p-8">List not found</div>;

    return (
        <div className="container mx-auto p-4 max-w-3xl h-screen flex flex-col">
            <Link href="/">
                <Button variant="ghost" className="mb-6 -ml-4 text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
            </Link>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 flex-1 flex flex-col min-h-0">
                <div className="mb-8 p-4 border-b border-gray-100 flex-shrink-0">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        {list.name}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{items?.length || 0} tasks</p>
                </div>

                <form onSubmit={handleAddItem} className="flex gap-2 mb-8 flex-shrink-0">
                    <Input
                        placeholder="Add a new task..."
                        value={newItemDescription}
                        onChange={(e) => setNewItemDescription(e.target.value)}
                        className="h-11 shadow-sm border-gray-200 focus:border-indigo-400"
                    />
                    <Button type="submit" size="lg" disabled={addItemMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                        {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                    </Button>
                </form>

                <div className="flex-1 min-h-0">
                    {items && items.length > 0 ? (
                        <Virtuoso
                            data={items}
                            totalCount={items.length}
                            itemContent={(index: number, item: TodoItemType) => (
                                <div className="pb-3">
                                    <TodoItem
                                        item={item}
                                        onToggle={() => toggleItemMutation.mutate(item)}
                                        onDelete={(id) => deleteItemMutation.mutate(id)}
                                        onUpdate={(id, description) => updateItemMutation.mutate({ item, description })}
                                    />
                                </div>
                            )}
                        />
                    ) : (
                        <div className="text-center py-10 text-gray-400 italic">
                            No tasks yet. Add one above!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
