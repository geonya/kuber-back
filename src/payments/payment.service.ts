import { Injectable } from '@nestjs/common';
import { Cron, Interval, SchedulerRegistry, Timeout } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { User } from '../users/entities/user.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dtos/create-payment.dto';
import { GetPaymentOutput } from './dtos/get-payment.dto';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,

    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,

    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPayment(
    owner: User,
    { transactionId, restaurantId }: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'Not Found Restaurant',
        };
      }
      if (restaurant.ownerId !== owner.id) {
        return {
          ok: false,
          error: 'Not Authorized!',
        };
      }
      await this.payments.save(
        this.payments.create({
          transactionId,
          user: owner,
          restaurant,
        }),
      );
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

  async getPayment(user: User): Promise<GetPaymentOutput> {
    try {
      const payments = await this.payments.find({
        where: {
          user: {
            id: user.id,
          },
        },
      });
      return {
        ok: true,
        payments,
      };
    } catch (error) {
      console.error(error);
      return {
        ok: false,
        error,
      };
    }
  }

  @Cron('30 * * * * *', { name: 'myJob' })
  checkForPayments() {
    console.log('Checking for payment (Cron)');
    const job = this.schedulerRegistry.getCronJob('myJob');
    job.stop();
  }

  @Interval(5000)
  checkForPaymentsI() {
    console.log('Checking for payment (Interval)');
  }

  @Timeout(10000)
  checkForPaymentsT() {
    console.log('Checking for payment (Timout)');
  }
}
