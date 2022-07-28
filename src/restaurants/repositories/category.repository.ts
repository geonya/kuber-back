import { CustomRepository } from 'src/db/typeorm-ex.decorator';
import { Category } from 'src/restaurants/entities/category.entity';
import { Repository } from 'typeorm';

@CustomRepository(Category)
export class CategoryRepository extends Repository<Category> {}
