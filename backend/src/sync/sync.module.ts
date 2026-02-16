
import { Module, forwardRef } from '@nestjs/common';
import { SyncService } from './sync.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoList } from '../todo_lists/todo_list.entity';
import { Item } from '../todo_lists/item.entity';
import { TodoListsModule } from '../todo_lists/todo_lists.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
    imports: [
        TypeOrmModule.forFeature([TodoList, Item]),
        forwardRef(() => TodoListsModule),
    ],
    providers: [SyncService],
    exports: [SyncService],
})
export class SyncModule { }
