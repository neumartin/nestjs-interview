import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TodoList } from './todo_list.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  externalId: string;

  @Column()
  done: boolean;

  @Column()
  description: string;

  @Column()
  todoListId: number;

  @ManyToOne((type) => TodoList, (todoList) => todoList.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'todoListId' })
  todoList: TodoList;
}
