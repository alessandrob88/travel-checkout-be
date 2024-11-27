import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingTable1732703037332 implements MigrationInterface {
  name = 'AddBookingTable1732703037332';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "bookings_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'expired', 'user_soft_deleted')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "selectedSeats" integer NOT NULL, "totalPrice" integer NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "expirationTime" TIMESTAMP, "userId" uuid NOT NULL, "travelId" uuid NOT NULL, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac40c236196ebe338ffeaf8760" ON "bookings" ("selectedSeats") `,
    );
    await queryRunner.query(
      `ALTER TABLE "moods" ADD CONSTRAINT "FK_b23d9645305ed06145fb8df27c5" FOREIGN KEY ("travelId") REFERENCES "travels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_84a995f2bb589ccd72c7b55b3e0" FOREIGN KEY ("travelId") REFERENCES "travels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_84a995f2bb589ccd72c7b55b3e0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_38a69a58a323647f2e75eb994de"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_ac40c236196ebe338ffeaf8760"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TYPE "bookings_status_enum"`);
  }
}
