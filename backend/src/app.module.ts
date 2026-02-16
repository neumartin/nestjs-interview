
import { Module } from '@nestjs/common';
import { TodoListsModule } from './todo_lists/todo_lists.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoList } from './todo_lists/todo_list.entity';
import { ConfigModule } from '@nestjs/config';
import { Item } from './todo_lists/item.entity';
import { SyncModule } from './sync/sync.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TodoListsModule,
    SyncModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [TodoList, Item],
        synchronize: true,
        logging: true,
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
