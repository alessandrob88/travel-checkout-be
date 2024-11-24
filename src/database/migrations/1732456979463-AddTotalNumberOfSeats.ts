import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTotalNumberOfSeats1732456979463 implements MigrationInterface {
  name = 'AddTotalNumberOfSeats1732456979463';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "travel" ADD "totalNumberOfSeats" smallint NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "travel" DROP COLUMN "totalNumberOfSeats"`,
    );
  }
}
