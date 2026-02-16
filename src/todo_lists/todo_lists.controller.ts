import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateTodoListDto } from './dtos/create-todo_list';
import { UpdateTodoListDto } from './dtos/update-todo_list';
import { TodoList } from '../interfaces/todo_list.interface';
import { TodoListsService } from './todo_lists.service';
import { Item } from './item.entity';
import { CreateItemDto } from './dtos/createItem';
import { UpdateItemDto } from './dtos/updateItem';

@Controller('api/todolists')
export class TodoListsController {
  constructor(private todoListsService: TodoListsService) {}

  @Get()
  index(): Promise<TodoList[]> {
    return this.todoListsService.all();
  }

  @Get('/:todoListId')
  show(@Param() param: { todoListId: number }): Promise<TodoList | null> {
    return this.todoListsService.get(param.todoListId);
  }

  @Post()
  create(@Body() dto: CreateTodoListDto): Promise<TodoList> {
    return this.todoListsService.create(dto);
  }

  @Put('/:todoListId')
  update(
    @Param() param: { todoListId: string },
    @Body() dto: UpdateTodoListDto,
  ): Promise<TodoList> {
    return this.todoListsService.update(Number(param.todoListId), dto);
  }

  @Delete('/:todoListId')
  delete(@Param() param: { todoListId: number }): Promise<void> {
    return this.todoListsService.delete(param.todoListId);
  }

  @Get('/item/:todoListId')
  showItems(@Param() param: { todoListId: number }): Promise<Item[] | null> {
    return this.todoListsService.geItems(param.todoListId);
  }

  @Post('/item')
  createItem(@Body() dto: CreateItemDto): Promise<Item> {
    return this.todoListsService.createItem(dto);
  }

  @Put('/item/:itemId')
  updateItem(
    @Param() param: { itemId: string },
    @Body() dto: UpdateItemDto,
  ): Promise<Item> {
    return this.todoListsService.updateItem(Number(param.itemId), dto);
  }

  @Delete('/item/:itemId')
  deleteItem(@Param() param: { itemId: number }): Promise<void> {
    return this.todoListsService.deleteItem(param.itemId);
  }
}
