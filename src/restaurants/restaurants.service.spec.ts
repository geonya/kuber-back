import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from 'src/restaurants/entities/category.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { CategoryRepository } from 'src/restaurants/repositories/category.repository';
import { RestaurantService } from 'src/restaurants/restaurants.service';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  getOrCreate: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('RestaurantsService', () => {
  let service: RestaurantService;
  let restaurantRepository: MockRepository<Restaurant>;
  let dishRepository: MockRepository<Dish>;
  let categoryRepository: MockRepository<CategoryRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RestaurantService,
        {
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Dish),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(CategoryRepository),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<RestaurantService>(RestaurantService);
    restaurantRepository = module.get(getRepositoryToken(Restaurant));
    dishRepository = module.get(getRepositoryToken(Dish));
    categoryRepository = module.get(getRepositoryToken(CategoryRepository));
  });

  it('should be definded', () => {
    expect(service).toBeDefined();
  });

  describe('createRestaurant', () => {
    const createRestaurantInput = {
      name: '맛나김밥',
      coverImg: '김밥.jpg',
      address: '경기도 용인시',
      categoryName: 'korea food',
    };

    // it('should create restaurant', async () => {
    //   restaurantRepository.create.mockResolvedValue(createRestaurantInput);
    //   categoryRepository.findOne.mockResolvedValue(mockCategory);
    //   restaurantRepository.save.mockResolvedValue(createRestaurantInput);
    //   const result = await service.createRestaurant(
    //     mockUser,
    //     createRestaurantInput,
    //   );
    //   expect(restaurantRepository.create).toHaveBeenCalledTimes(1);
    //   expect(restaurantRepository.create).toHaveBeenCalledWith();
    // });
  });
});
