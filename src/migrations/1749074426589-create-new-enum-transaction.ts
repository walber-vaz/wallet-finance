import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNewEnumTransaction1749074426589 implements MigrationInterface {
    name = 'CreateNewEnumTransaction1749074426589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."transactions_type_enum" RENAME TO "transactions_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('transfer', 'reversal', 'deposit', 'withdrawal')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum" USING "type"::"text"::"public"."transactions_type_enum"`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "type" SET DEFAULT 'transfer'`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum_old" AS ENUM('transfer', 'reversal')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "type" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "type" TYPE "public"."transactions_type_enum_old" USING "type"::"text"::"public"."transactions_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "type" SET DEFAULT 'transfer'`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transactions_type_enum_old" RENAME TO "transactions_type_enum"`);
    }

}
