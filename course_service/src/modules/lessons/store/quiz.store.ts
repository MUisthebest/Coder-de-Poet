import { Injectable } from "@nestjs/common";

@Injectable()
export class QuizStore {
    private map = new Map<string, any>();
    
    set (lessonId: string, data: any) {
        this.map.set(lessonId, data);
    }

    get (lessonId: string) : any | undefined {
        return this.map.get(lessonId);
    }

    delete (lessonId: string) {
        this.map.delete(lessonId);
    }
}