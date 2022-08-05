import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import {
  CreateOrderInput,
  CreateOrderOutput,
} from 'src/orders/dtos/create-order.dto';
import {
  EditOrderInput,
  EditOrderOutput,
} from 'src/orders/dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from 'src/orders/dtos/get-order.dto';
import {
  GetOrdersInput,
  GetOrdersOutput,
} from 'src/orders/dtos/get-orders.dto';
import { OrderItem } from 'src/orders/entities/order-item.entity';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  NEW_COOKED_ORDER,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from '../common/common.constants';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB)
    private readonly pubsub: PubSub,
  ) {}
  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Could not find restaurant',
        };
      }
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          return {
            ok: false,
            error: 'Not found Dish',
          };
        }
        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice += dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        orderItems.push(orderItem);
      }
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
      await this.pubsub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: `Could not create Order ${error}`,
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[] = [];
      if (user.role === UserRole.Client) {
        // find orders
        orders = await this.orders.find({
          where: {
            customer: {
              id: user.id,
            },
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: {
              id: user.id,
            },
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: {
              id: user.id,
            },
          },
          relations: {
            orders: true,
          },
        });
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error: 'Could not get orders',
      };
    }
  }

  checkUnAuthorized(user: User, order: Order) {
    let unAuthorizedRole: UserRole | null = null;
    if (user.role === UserRole.Client && user.id !== order.customerId) {
      unAuthorizedRole = UserRole.Client;
    }
    if (user.role === UserRole.Delivery && user.id !== order.driverId) {
      unAuthorizedRole = UserRole.Delivery;
    }
    if (user.role === UserRole.Owner && user.id !== order.restaurant.ownerId) {
      unAuthorizedRole = UserRole.Owner;
    }

    return unAuthorizedRole;
  }

  async getOrder(user: User, { id }: GetOrderInput): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: {
          id,
        },
        relations: {
          restaurant: true,
          user: true,
        },
      });
      if (!order) {
        return {
          ok: false,
          error: 'Not found order',
        };
      }
      const unAuthorizedRole = this.checkUnAuthorized(user, order);
      if (unAuthorizedRole) {
        return {
          ok: false,
          error: `${unAuthorizedRole} can't see this order`,
        };
      }
      return {
        ok: true,
        order,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }
  async editOrder(
    user: User,
    { id, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: {
          id,
        },
        relations: {
          restaurant: true,
        },
      });
      if (!order) {
        return {
          ok: false,
          error: 'Not found Order',
        };
      }
      const unAuthorizedRole = this.checkUnAuthorized(user, order);
      if (unAuthorizedRole) {
        return {
          ok: false,
          error: `${unAuthorizedRole} can't see this order`,
        };
      }
      let canEdit = true;
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }
      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: 'Can not edit this order Because of UserRole',
        };
      }
      await this.orders.save({
        id,
        status,
      });
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubsub.publish(NEW_COOKED_ORDER, {
            cookedOrders: { ...order, status },
          });
        }
      }
      return {
        ok: true,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }
}
