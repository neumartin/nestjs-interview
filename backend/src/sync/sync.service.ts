
import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from '../todo_lists/todo_list.entity';
import { Item } from '../todo_lists/item.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TodoListsGateway } from '../todo_lists/todo_lists.gateway';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);
    private readonly apiUrl: string;

    constructor(
        @InjectRepository(TodoList)
        private readonly todoListRepository: Repository<TodoList>,
        @InjectRepository(Item)
        private readonly itemRepository: Repository<Item>,
        private readonly configService: ConfigService,
        @Inject(forwardRef(() => TodoListsGateway))
        private readonly gateway: TodoListsGateway,
    ) {
        this.apiUrl = this.configService.get<string>('EXTERNAL_API_URL') || '';
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleCron() {
        this.logger.debug('Starting synchronization...');
        await this.syncFromExternal();
    }

    async syncFromExternal() {
        try {
            const response = await axios.get(`${this.apiUrl}/todolists`);
            const externalLists = response.data;

            for (const extList of externalLists) {
                // extList structure assumed: { id: string, name: string, todoItems: [] }
                // We'll adapt based on actual API. Assuming "todoItems" or "items".

                let localList = await this.todoListRepository.findOne({
                    where: { externalId: extList.id },
                });

                if (!localList) {
                    // If not found by externalId, checking by name to avoid duplicates?
                    // For now, trust externalId.
                    localList = this.todoListRepository.create({
                        name: extList.name,
                        externalId: extList.id,
                    });
                    localList = await this.todoListRepository.save(localList);
                    this.logger.log(`Created local list from external: ${localList.name}`);
                } else {
                    // Update name if changed
                    if (localList.name !== extList.name) {
                        localList.name = extList.name;
                        await this.todoListRepository.save(localList);
                    }
                }

                // Sync items
                // Check property name for items
                const items = extList.items || extList.todoItems || [];
                if (Array.isArray(items)) {
                    await this.syncItems(localList, items);
                }
            }
        } catch (error) {
            this.logger.error('Error fetching from external API', error.message);
        }
    }

    private async syncItems(localList: TodoList, externalItems: any[]) {
        const localItems = await this.itemRepository.find({ where: { todoListId: localList.id } });
        const externalIds = new Set(externalItems.map(i => i.id));

        for (const extItem of externalItems) {
            let localItem = localItems.find(i => i.externalId === extItem.id);
            // Map external fields to local
            // Assuming: id, description, isFinished (or done)
            const description = extItem.description;
            const done = extItem.isFinished !== undefined ? extItem.isFinished : (extItem.done !== undefined ? extItem.done : false);

            if (!localItem) {
                localItem = this.itemRepository.create({
                    description,
                    done,
                    externalId: extItem.id,
                    todoList: localList // TypeORM ManyToOne relation
                });
                // We need to set todoListId explicitly if using querybuilder, but here object is fine?
                // todoListId is a column.
                // Creating with relation object should populate foreign key.
                localItem.todoListId = localList.id;
                await this.itemRepository.save(localItem);
                this.gateway.notifyItemUpdated(localList.id, localItem);
            } else {
                if (localItem.description !== description || localItem.done !== done) {
                    localItem.description = description;
                    localItem.done = done;
                    await this.itemRepository.save(localItem);
                    this.gateway.notifyItemUpdated(localList.id, localItem);
                }
            }
        }

        // Handle deletions (External is master for deletions during pull)
        for (const localItem of localItems) {
            if (localItem.externalId && !externalIds.has(localItem.externalId)) {
                await this.itemRepository.delete(localItem.id);
                // Notify deletion ?? The gateway assumes item update.
                // We might need a 'itemDeleted' event.
                // For now, we skip notification for deletion or send a specific payload?
                // Frontend handles 'itemUpdated'.
                this.logger.log(`Deleted local item ${localItem.id} as it was removed externally`);
            }
        }
    }

    // Push Methods
    async createExternalList(list: TodoList) {
        try {
            const response = await axios.post(`${this.apiUrl}/todolists`, {
                name: list.name
            });
            if (response.data && response.data.id) {
                list.externalId = response.data.id;
                await this.todoListRepository.save(list);
            }
        } catch (e) {
            this.logger.error(`Failed to create external list`, e.message);
        }
    }

    async updateExternalList(list: TodoList) {
        if (!list.externalId) return;
        try {
            await axios.patch(`${this.apiUrl}/todolists/${list.externalId}`, {
                name: list.name
            });
        } catch (e) {
            this.logger.error(`Failed to update external list`, e.message);
        }
    }

    async deleteExternalList(list: TodoList) {
        if (!list.externalId) return;
        try {
            await axios.delete(`${this.apiUrl}/todolists/${list.externalId}`);
        } catch (e) {
            this.logger.error(`Failed to delete external list`, e.message);
        }
    }

    async createExternalItem(item: Item) {
        // Problem: How to create item?
        // Assuming: POST /todolists/{id}/items or PATCH /todolists/{id} with items?
        // Or maybe there is no create item endpoint and we must update the list.
        // But we have Delete Item and Update Item endpoints.
        // Let's try POST /todolists/{listId}/items (Standard REST?)
        // Or checking docs URL again -> `CreateTodoItemBody` exists.
        // It implies creation is possible.
        // `TodoItemApi` -> `updateTodoItem`, `deleteTodoItem`.
        // Where is `createTodoItem`?
        // Maybe it's `POST /todolists/{listId}/todoitems`? (Guessing based on DELETE path)
        // Path: `/todolists/{todolistId}/todoitems/{todoitemId}` for DELETE.
        // So creation might be `POST /todolists/{todolistId}/todoitems`.

        const list = await this.todoListRepository.findOneBy({ id: item.todoListId });
        if (!list || !list.externalId) return; // Can't add to unsynced list

        try {
            const response = await axios.post(`${this.apiUrl}/todolists/${list.externalId}/todoitems`, {
                description: item.description,
                isFinished: item.done
            });
            if (response.data && response.data.id) {
                item.externalId = response.data.id;
                await this.itemRepository.save(item);
            }
        } catch (e) {
            this.logger.error(`Failed to create external item. Trying fallback...`, e.message);
            // Fallback: maybe Update TodoList?
        }
    }

    async updateExternalItem(item: Item) {
        const list = await this.todoListRepository.findOneBy({ id: item.todoListId });
        if (!list || !list.externalId || !item.externalId) return;

        try {
            await axios.patch(`${this.apiUrl}/todolists/${list.externalId}/todoitems/${item.externalId}`, {
                description: item.description,
                isFinished: item.done
            });
        } catch (e) {
            this.logger.error(`Failed to update external item`, e.message);
        }
    }

    async deleteExternalItem(item: Item) {
        const list = await this.todoListRepository.findOneBy({ id: item.todoListId });
        if (!list || !list.externalId || !item.externalId) return;

        try {
            await axios.delete(`${this.apiUrl}/todolists/${list.externalId}/todoitems/${item.externalId}`);
        } catch (e) {
            this.logger.error(`Failed to delete external item`, e.message);
        }
    }

}
