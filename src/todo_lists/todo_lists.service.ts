import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoListDto } from './dtos/create-todo_list';
import { UpdateTodoListDto } from './dtos/update-todo_list';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from './todo_list.entity';
import { Item } from './item.entity';
import { CreateItemDto } from './dtos/createItem';
import { UpdateItemDto } from './dtos/updateItem';

@Injectable()
export class TodoListsService {
  constructor(
    @InjectRepository(TodoList)
    private readonly todoListRepository: Repository<TodoList>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {}

  async all(): Promise<TodoList[]> {
    return await this.todoListRepository.find();
  }

  async get(id: number): Promise<TodoList | null> {
    return await this.todoListRepository.findOneBy({ id });
  }

  async create(dto: CreateTodoListDto): Promise<TodoList> {
    const todoList = this.todoListRepository.create({ name: dto.name });
    return await this.todoListRepository.save(todoList);
  }

  async update(id: number, dto: UpdateTodoListDto): Promise<TodoList> {
    const todo = await this.todoListRepository.findOneBy({ id });

    if (!todo) {
      throw new NotFoundException(`Todo list with id ${id} not found`);
    }

    return await this.todoListRepository.save({ id, ...dto } as TodoList);
  }

  async delete(id: number): Promise<void> {
    await this.todoListRepository.delete(id);
  }

  // ======= ITEMS ========

  async geItems(listId: number): Promise<Item[]> {
    return await this.itemRepository.findBy({ todoListId: listId });
  }

  async createItem(itemDto: CreateItemDto): Promise<Item> {
    const list = await this.todoListRepository.findOneBy({
      id: itemDto.todoListId,
    });

    if (!list) {
      throw new NotFoundException(
        `Todo list with id ${itemDto.todoListId} not found`,
      );
    }

    const item = this.itemRepository.create({ ...itemDto });
    return await this.itemRepository.save(item);
  }

  async updateItem(id: number, dto: UpdateItemDto): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    return await this.itemRepository.save({ id, ...dto } as Item);
  }

  async deleteItem(id: number): Promise<void> {
    await this.itemRepository.delete(id);
  }
}
