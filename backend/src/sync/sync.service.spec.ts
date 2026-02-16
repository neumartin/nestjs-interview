
import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TodoList } from '../todo_lists/todo_list.entity';
import { Item } from '../todo_lists/item.entity';
import { ConfigService } from '@nestjs/config';
import { TodoListsGateway } from '../todo_lists/todo_lists.gateway';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SyncService', () => {
    let service: SyncService;
    let todoListRepository;
    let itemRepository;
    let gateway;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SyncService,
                {
                    provide: getRepositoryToken(TodoList),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                    },
                },
                {
                    provide: getRepositoryToken(Item),
                    useValue: {
                        find: jest.fn().mockResolvedValue([]),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        delete: jest.fn(),
                        remove: jest.fn(),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('http://localhost:8080'),
                    },
                },
                {
                    provide: TodoListsGateway,
                    useValue: {
                        notifyItemUpdated: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SyncService>(SyncService);
        todoListRepository = module.get(getRepositoryToken(TodoList));
        itemRepository = module.get(getRepositoryToken(Item));
        gateway = module.get(TodoListsGateway);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('syncFromExternal', () => {
        it('should fetch lists and create local list if not exists', async () => {
            const externalLists = [
                { id: 'ext-1', name: 'External List', items: [] },
            ];
            mockedAxios.get.mockResolvedValue({ data: externalLists });
            todoListRepository.findOne.mockResolvedValue(null); // Not found locally
            todoListRepository.create.mockReturnValue({ id: 1, name: 'External List', externalId: 'ext-1' });
            todoListRepository.save.mockResolvedValue({ id: 1, name: 'External List', externalId: 'ext-1' });

            await service.syncFromExternal();

            expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8080/todolists');
            expect(todoListRepository.create).toHaveBeenCalledWith({
                name: 'External List',
                externalId: 'ext-1',
            });
            expect(todoListRepository.save).toHaveBeenCalled();
        });

        it('should update local list if name matches but properties differ', async () => {
            const externalLists = [
                { id: 'ext-1', name: 'Updated Name', items: [] },
            ];
            const localList = { id: 1, name: 'Old Name', externalId: 'ext-1' };

            mockedAxios.get.mockResolvedValue({ data: externalLists });
            todoListRepository.findOne.mockResolvedValue(localList);
            todoListRepository.save.mockResolvedValue({ ...localList, name: 'Updated Name' });

            await service.syncFromExternal();

            expect(todoListRepository.save).toHaveBeenCalled();
            expect(localList.name).toBe('Updated Name');
        });
    });

    describe('syncItems', () => {
        it('should sync items for a list', async () => {
            const localList = { id: 1, externalId: 'ext-1' };
            const externalItems = [
                { id: 'item-1', description: 'Item 1', isFinished: true }
            ];
            // Mock finding local items
            itemRepository.find.mockResolvedValue([]); // No local items

            // Mock syncFromExternal calls syncItems internally, but we can't easily test private method directly without calling public wrapper.
            // We'll simulate via syncFromExternal setup.

            const externalLists = [
                { id: 'ext-1', name: 'List', items: externalItems },
            ];
            mockedAxios.get.mockResolvedValue({ data: externalLists });
            todoListRepository.findOne.mockResolvedValue(localList);

            itemRepository.create.mockReturnValue({ id: 10, description: 'Item 1', done: true, externalId: 'item-1', todoList: localList });
            itemRepository.save.mockResolvedValue({});

            await service.syncFromExternal();

            expect(itemRepository.create).toHaveBeenCalledWith({
                description: 'Item 1',
                done: true,
                externalId: 'item-1',
                todoList: localList
            });
            expect(gateway.notifyItemUpdated).toHaveBeenCalledWith(localList.id, expect.anything());
        });
    });

    describe('push methods', () => {
        it('createExternalList should post to external api', async () => {
            const list = { id: 1, name: 'New List' } as TodoList;
            mockedAxios.post.mockResolvedValue({ data: { id: 'ext-new' } });

            await service.createExternalList(list);

            expect(mockedAxios.post).toHaveBeenCalledWith('http://localhost:8080/todolists', { name: 'New List' });
            expect(list.externalId).toBe('ext-new');
            expect(todoListRepository.save).toHaveBeenCalledWith(list);
        });
    });
});
