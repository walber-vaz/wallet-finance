import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableTransactions1749070730367 implements MigrationInterface {
    name = 'CreateTableTransactions1749070730367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."transactions_type_enum" AS ENUM('transfer', 'reversal')`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'completed', 'reversed', 'failed')`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "type" "public"."transactions_type_enum" NOT NULL DEFAULT 'transfer', "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending', "description" character varying, "fromUserId" uuid NOT NULL, "toUserId" uuid NOT NULL, "reversalTransactionId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_ccbdb7637f348c5d146b5c6c3b3" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_92c3201a4b4dc707b5d13d3fcf7" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_92c3201a4b4dc707b5d13d3fcf7"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_ccbdb7637f348c5d146b5c6c3b3"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    }

}
