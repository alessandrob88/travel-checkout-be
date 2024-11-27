import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  constructor() {}
  async processPayment(amount: number): Promise<boolean> {
    console.log('amount payed::', amount);
    return true;
  }
}
