import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@InputType({ isAbstract: true })
//abstract : only for extenting
@ObjectType()
@Entity()
export class Restaurant {
  @PrimaryGeneratedColumn()
  @Field((type) => Number)
  id: number;

  @Field((type) => String)
  @Column()
  @IsString()
  @Length(2)
  name: string;

  @Field((type) => Boolean, { nullable: true })
  @Column({ default: true })
  @IsBoolean()
  isVegan: boolean;

  @Field((type) => String, { defaultValue: 'home sweet home' })
  @Column()
  @IsString()
  address: string;
}
