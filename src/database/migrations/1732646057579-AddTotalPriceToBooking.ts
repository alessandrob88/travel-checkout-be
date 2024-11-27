import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalPriceToBooking1732646057579 implements MigrationInterface {
  name = 'AddTotalPriceToBooking1732646057579';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD "totalPrice" integer NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "totalPrice"`);
  }
}
