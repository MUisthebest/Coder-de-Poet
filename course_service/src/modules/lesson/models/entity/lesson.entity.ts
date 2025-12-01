/*
    This file declares the lesson entity

    course_id will be reference to course entity
*/

import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity('lesson') 
    export class Category {
        @PrimaryGeneratedColumn('uuid')
        id : string;


}
