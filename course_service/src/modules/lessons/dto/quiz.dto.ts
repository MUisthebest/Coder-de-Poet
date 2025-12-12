export interface QuestionDto {
  question: string;
  options: string[];
  correct_index: number;
}

export interface GenerateLessonQuizCommand {
    lesson_id : string;
    course_id: string;
    lesson_name: string;
    video_url: string;
}

export interface LessonQuizGeneratedEvent {
    lesson_id: string;
    course_id?: string;
    status: "COMPLETED" | "FAILED";
    quiz_questions?: QuestionDto[];
}