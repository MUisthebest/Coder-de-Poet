/*
    This file declares the category entity
*/

import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity('categories') 
    export class Category {
        @PrimaryGeneratedColumn('uuid')
        id : string;

        @Column({type: 'varchar', nullable: false}) 
        name: string;

        @Column({type: 'varchar', nullable: false, unique: true})
        slug: string;

        @Column({type: 'text', nullable: true})
        description: string;

        @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
        updatedAt: Date;
}
