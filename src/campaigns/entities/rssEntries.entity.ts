import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('rss_entries')
export class RssEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    title: string; 

    @Column({ length: 255, unique: true }) 
    link: string; 

    @CreateDateColumn()
    createdAt: Date; 

    @Column()
    rssUrl:string 
    
}