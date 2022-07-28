import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AllCategoriesOutput } from 'src/restaurants/dtos/all-categories.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from 'src/restaurants/dtos/delete-restaurant.dto';
import { EditRestaurantInput } from 'src/restaurants/dtos/edit-restaurant.dto';
import { Category } from 'src/restaurants/entities/category.entity';
import { CategoryRepository } from 'src/restaurants/repositories/category.repository';
import { EditProfileOutput } from 'src/users/dtos/edit-profile.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    // Custom
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Could not create restuarant',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditProfileOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: editRestaurantInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant Not Found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'Not Authorized because you are not owner',
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: deleteRestaurantInput.restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant Not Found',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: 'Not Authorized because you are not owner',
        };
      }
      await this.restaurants.delete(deleteRestaurantInput.restaurantId);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find({});
      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories',
      };
    }
  }
}
