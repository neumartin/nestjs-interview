export interface TodoList {
    id: number;
    name: string;
    // items might be missing if not joined
}

export interface TodoItem {
    id: number;
    done: boolean;
    description: string;
    todoListId: number;
}

export interface CreateTodoListDto {
    name: string;
}

export interface UpdateTodoListDto {
    name: string;
}

export interface CreateItemDto {
    done: boolean;
    description: string;
    todoListId: number;
}

export interface UpdateItemDto {
    done?: boolean;
    description?: string;
    todoListId: number; // The backend DTO requires this? Let's check. Yes, it's in the class definition.
}
