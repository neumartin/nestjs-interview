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

  @Column()
  todoListId: number;

  @ManyToOne((type) => TodoList, (todoList) => todoList.items)
  @JoinColumn({ name: 'todoListId' })
  todoList: TodoList;
}
