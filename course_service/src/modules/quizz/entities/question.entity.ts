import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Quiz } from './quiz.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column('simple-json')  // Lưu options dưới dạng JSON: [{ text: 'A', isCorrect: true }, ...]
  options: { text: string; isCorrect: boolean }[];

  @ManyToOne(() => Quiz, (quiz) => quiz.questions)
  quiz: Quiz;
}