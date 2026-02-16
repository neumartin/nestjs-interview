import { Test, TestingModule } from '@nestjs/testing';
import { TodoListsController } from './todo_lists.controller';
import { TodoListsService } from './todo_lists.service';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TodoList } from './todo_list.entity';
import { Item } from './item.entity';

describe('TodoListsController', () => {
  let app: INestApplication;
  let todoListsController: TodoListsController;
  let todoListRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;
  let itemRepositoryMock: jest.Mocked<Record<string, jest.Mock>>;

  beforeEach(async () => {
    todoListRepositoryMock = {
      find: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };

    itemRepositoryMock = {
      findBy: jest.fn(),
      findOneBy: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodoListsController],
      providers: [
        TodoListsService,
        {
          provide: getRepositoryToken(TodoList),
          useValue: todoListRepositoryMock,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: itemRepositoryMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    todoListsController = module.get<TodoListsController>(TodoListsController);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('index', () => {
    it('should return all todo lists', async () => {
      const mockTodoLists = [
        { id: 1, name: 'Shopping List' },
        { id: 2, name: 'Work Tasks' },
      ];

      todoListRepositoryMock.find.mockResolvedValue(mockTodoLists);

      const result = await todoListsController.index();

      expect(result).toEqual(mockTodoLists);
    });
  });

  describe('show', () => {
    it('should return a single todo list by id', async () => {
      const mockTodoList = { id: 1, name: 'Shopping List' };
      todoListRepositoryMock.findOneBy.mockResolvedValue(mockTodoList);
      const result = await todoListsController.show({ todoListId: 1 });
      expect(result).toEqual(mockTodoList);
    });
  });

  describe('create', () => {
    it('should create a new todo list', async () => {
      const createDto = { name: 'New List' };
      const mockCreatedTodoList = { id: 1, name: 'New List' };

      todoListRepositoryMock.create.mockReturnValue(mockCreatedTodoList);
      todoListRepositoryMock.save.mockResolvedValue(mockCreatedTodoList);

      const result = await todoListsController.create(createDto);

      expect(result).toEqual(mockCreatedTodoList);
    });
  });

  describe('update', () => {
    it('should update an existing todo list', async () => {
      const updateDto = { name: 'Updated List' };
      const existingTodoList = { id: 1, name: 'Old Name' };
      const updatedTodoList = { id: 1, name: 'Updated List' };

      todoListRepositoryMock.findOneBy.mockResolvedValue(existingTodoList);
      todoListRepositoryMock.save.mockResolvedValue(updatedTodoList);

      const result = await todoListsController.update(
        { todoListId: '1' },
        updateDto,
      );

      expect(result).toEqual(updatedTodoList);
    });
  });

  describe('delete', () => {
    it('should delete a todo list', async () => {
      todoListRepositoryMock.delete.mockResolvedValue({ affected: 1 });
      await todoListsController.delete({ todoListId: 1 });
      expect(todoListRepositoryMock.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('Items', () => {
    describe('showItems', () => {
      it('should return items for a todo list', async () => {
        const mockItems = [
          { id: 1, description: 'Buy milk', done: false, todoListId: 1 },
        ];
        itemRepositoryMock.findBy.mockResolvedValue(mockItems);

        const result = await todoListsController.showItems({ todoListId: 1 });

        expect(result).toEqual(mockItems);
        expect(itemRepositoryMock.findBy).toHaveBeenCalledWith({
          todoListId: 1,
        });
      });
    });

    describe('createItem', () => {
      it('should create a new item', async () => {
        const createItemDto = {
          description: 'Buy milk',
          todoListId: 1,
          done: false,
        };
        const mockTodoList = { id: 1, name: 'Shopping List' };
        const mockCreatedItem = { id: 1, ...createItemDto };

        todoListRepositoryMock.findOneBy.mockResolvedValue(mockTodoList);
        itemRepositoryMock.create.mockReturnValue(mockCreatedItem);
        itemRepositoryMock.save.mockResolvedValue(mockCreatedItem);

        const result = await todoListsController.createItem(createItemDto);

        expect(result).toEqual(mockCreatedItem);
        expect(todoListRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(itemRepositoryMock.create).toHaveBeenCalledWith(createItemDto);
        expect(itemRepositoryMock.save).toHaveBeenCalledWith(mockCreatedItem);
      });
    });

    describe('updateItem', () => {
      it('should update an existing item', async () => {
        const updateItemDto = { description: 'Buy bread', done: true, todoListId: 1 };
        const existingItem = {
          id: 1,
          description: 'Buy milk',
          done: false,
          todoListId: 1,
        };
        const updatedItem = { id: 1, ...updateItemDto, todoListId: 1 };

        itemRepositoryMock.findOneBy.mockResolvedValue(existingItem);
        itemRepositoryMock.save.mockResolvedValue(updatedItem);

        const result = await todoListsController.updateItem(
          { itemId: '1' },
          updateItemDto,
        );

        expect(result).toEqual(updatedItem);
        expect(itemRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: 1 });
        expect(itemRepositoryMock.save).toHaveBeenCalledWith({
          id: 1,
          ...updateItemDto,
        });
      });
    });

    describe('deleteItem', () => {
      it('should delete an item', async () => {
        itemRepositoryMock.delete.mockResolvedValue({ affected: 1 });

        await todoListsController.deleteItem({ itemId: 1 });

        expect(itemRepositoryMock.delete).toHaveBeenCalledWith(1);
      });
    });
  });
});
