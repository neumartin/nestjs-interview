'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CreateTodoListDto } from '@/types';
import { Plus } from 'lucide-react';

export default function CreateTodoList() {
    const [name, setName] = useState('');
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: (newTodo: { name: string }) => {
            return api.post<CreateTodoListDto>('/api/todolists', newTodo);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['todolists'] });
            setName('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        mutation.mutate({ name });
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
            <Input
                type="text"
                placeholder="New List Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1"
            />
            <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Adding...' : <><Plus className="w-4 h-4 mr-1" /> Add</>}
            </Button>
        </form>
    );
}
