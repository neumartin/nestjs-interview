import { Module, forwardRef } from '@nestjs/common';
import { TodoListsController } from './todo_lists.controller';
import { TodoListsService } from './todo_lists.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoList } from './todo_list.entity';
import { Item } from './item.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TodoListsGateway } from './todo_lists.gateway';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoList, Item]),
    ClientsModule.registerAsync([
      {
        name: 'TODO_SERVICE_RMQ',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URI') ||
              'amqp://localhost:5672',
            ],
            queue: configService.get<string>('RABBITMQ_QUEUE') || 'items_queue',
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    forwardRef(() => SyncModule),
  ],
  controllers: [TodoListsController],
  providers: [TodoListsService, TodoListsGateway],
  exports: [TodoListsService, TodoListsGateway],
})
export class TodoListsModule { }
