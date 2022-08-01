import { Field, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Dish } from 'src/restaurants/entities/dish.entity';

@InputType()
export class CreateDishInput extends PickType(Dish, [
  'name',
  'price',
  'photo',
  'description',
  'options',
]) {
  @Field((type) => Number)
  restaurandId: number;
}

@ObjectType()
export class CreateDishOutput extends CoreOutput {}
