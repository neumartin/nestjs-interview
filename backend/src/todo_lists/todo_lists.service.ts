import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateTodoListDto } from './dtos/create-todo_list';
import { UpdateTodoListDto } from './dtos/update-todo_list';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from './todo_list.entity';
import { Item } from './item.entity';
import { CreateItemDto } from './dtos/createItem';
import { UpdateItemDto } from './dtos/updateItem';
import { TodoListsGateway } from './todo_lists.gateway';
import { SyncService } from '../sync/sync.service';

@Injectable()
export class TodoListsService {
  constructor(
    @InjectRepository(TodoList)
    private readonly todoListRepository: Repository<TodoList>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @Inject('TODO_SERVICE_RMQ') private readonly client: ClientProxy,
    private readonly todoListsGateway: TodoListsGateway,
    @Inject(forwardRef(() => SyncService))
    private readonly syncService: SyncService,
  ) { }

  async all(): Promise<TodoList[]> {
    return await this.todoListRepository.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async get(id: number): Promise<TodoList | null> {
    return await this.todoListRepository.findOneBy({ id });
  }

  async create(dto: CreateTodoListDto): Promise<TodoList> {
    const todoList = this.todoListRepository.create({ name: dto.name });
    const savedList = await this.todoListRepository.save(todoList);
    this.syncService.createExternalList(savedList);
    return savedList;
  }

  async update(id: number, dto: UpdateTodoListDto): Promise<TodoList> {
    const todo = await this.todoListRepository.findOneBy({ id });

    if (!todo) {
      throw new NotFoundException(`Todo list with id ${id} not found`);
    }

    const saved = await this.todoListRepository.save({ id, ...dto } as TodoList);
    this.syncService.updateExternalList(saved);
    return saved;
  }

  async delete(id: number): Promise<void> {
    const list = await this.todoListRepository.findOneBy({ id });
    await this.todoListRepository.delete(id);
    if (list) {
      this.syncService.deleteExternalList(list);
    }
  }

  notifyItemUpdated(item: Item) {
    this.todoListsGateway.notifyItemUpdated(item.todoListId, item);
  }

  // ======= ITEMS ========

  async geItems(listId: number): Promise<Item[]> {
    return await this.itemRepository.find({
      where: { todoListId: listId },
      order: {
        description: 'ASC',
      },
    });
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
    const savedItem = await this.itemRepository.save(item);
    this.notifyItemUpdated(savedItem);
    this.syncService.createExternalItem(savedItem);
    return savedItem;
  }

  async updateItem(id: number, dto: UpdateItemDto): Promise<Item> {
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }

    this.client.emit('update_item', { id, ...dto });

    // Return the current item as the update is processed asynchronously
    return item;
  }

  async executeItemUpdate(payload: { id: number } & UpdateItemDto): Promise<void> {
    const { id, ...dto } = payload;
    const item = await this.itemRepository.findOneBy({ id });

    if (!item) {
      // In a real microservice, we might log this or handle it differently
      console.error(`Item with id ${id} not found in worker`);
      return;
    }

    const updatedItem = await this.itemRepository.save({ id, ...dto } as Item);
    this.todoListsGateway.notifyItemUpdated(updatedItem.todoListId, updatedItem);
    this.syncService.updateExternalItem(updatedItem);
  }

  async deleteItem(id: number): Promise<void> {
    const item = await this.itemRepository.findOneBy({ id });
    await this.itemRepository.delete(id);
    if (item) {
      this.syncService.deleteExternalItem(item);
    }
  }
}
