import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmExModule } from 'src/db/typeorm-ex.module';
import { Category } from 'src/restaurants/entities/category.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { CategoryRepository } from 'src/restaurants/repositories/category.repository';
import { Restaurant } from './entities/restaurant.entity';
import {
  CategoryResolver,
  DishResolver,
  RestaurantResolver,
} from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Restaurant, Category, Dish]),
    TypeOrmExModule.forCustomRepository([CategoryRepository]),
  ],
  providers: [
    RestaurantResolver,
    RestaurantService,
    CategoryResolver,
    DishResolver,
  ],
})
export class RestaurantsModule {}
