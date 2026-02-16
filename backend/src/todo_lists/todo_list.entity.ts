import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class TodoList {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  externalId: string;

  @Column()
  name: string;

  @OneToMany((type) => Item, (item) => item.todoList)
  items: Item[];
}
