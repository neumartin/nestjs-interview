'use client';

import { useState } from 'react';
import { TodoItem as TodoItemType } from '@/types';
import { Button } from '@/components/ui/Button';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';

interface TodoItemProps {
    item: TodoItemType;
    onToggle: (id: number, done: boolean) => void;
    onDelete: (id: number) => void;
    onUpdate: (id: number, description: string) => void;
}

export default function TodoItem({ item, onToggle, onDelete, onUpdate }: TodoItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(item.description);

    const handleUpdate = () => {
        if (description.trim() !== item.description) {
            onUpdate(item.id, description);
        }
        setIsEditing(false);
    };

    return (
        <div className={cn(
            "group flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
            item.done ? "border-green-100 bg-green-50/50" : "border-gray-100 bg-white"
        )}>
            <button
                onClick={() => onToggle(item.id, !item.done)}
                className={cn(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0",
                    item.done ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-indigo-400"
                )}
            >
                {item.done && <Check className="w-3.5 h-3.5" />}
            </button>

            {isEditing ? (
                <form
                    className="flex-1 flex gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
                >
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onBlur={handleUpdate}
                    />
                </form>
            ) : (
                <span className={cn(
                    "flex-1 text-sm font-medium transition-all cursor-pointer break-all",
                    item.done ? "text-gray-400 line-through" : "text-gray-700"
                )} onClick={() => setIsEditing(true)}>
                    {item.description}
                </span>
            )}

            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(item.id)}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
