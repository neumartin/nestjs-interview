'use client';

import Link from 'next/link';
import { TodoList } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, ArrowRight } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface TodoListCardProps {
    list: TodoList;
}

export default function TodoListCard({ list }: TodoListCardProps) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/api/todolists/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todolists'] });
        },
    });

    return (
        <Card className="p-6 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full bg-white/50 backdrop-blur-sm border-white/40">
            <div>
                <h3 className="text-xl font-semibold mb-2 text-gray-800">{list.name}</h3>
                <p className="text-sm text-gray-500">Manage your tasks in this list.</p>
            </div>

            <div className="flex justify-between items-center mt-6">
                <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteMutation.mutate(list.id)}
                    disabled={deleteMutation.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
                <Link href={`/todolists/${list.id}`}>
                    <Button variant="outline" className="gap-2 group">
                        View List <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>
        </Card>
    );
}
