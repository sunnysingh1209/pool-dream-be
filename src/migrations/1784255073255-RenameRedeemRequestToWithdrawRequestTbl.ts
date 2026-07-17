import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameRedeemRequestToWithdrawRequestTbl1784255073255 implements MigrationInterface {
    name = 'RenameRedeemRequestToWithdrawRequestTbl1784255073255';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "RedeemRequestTbl" RENAME TO "WithdrawRequestTbl"`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" RENAME CONSTRAINT "PK_RedeemRequestTbl_Id" TO "PK_WithdrawRequestTbl_Id"`);
        await queryRunner.query(`ALTER INDEX "IDX_RedeemRequestTbl_UserId" RENAME TO "IDX_WithdrawRequestTbl_UserId"`);
        await queryRunner.query(`ALTER INDEX "IDX_RedeemRequestTbl_CreatedDate" RENAME TO "IDX_WithdrawRequestTbl_CreatedDate"`);

        // No more pending/review workflow — a withdrawal is executed the
        // moment a superadmin raises it, so these columns are dead weight.
        // Dropping "Status" also cascades to drop its index automatically.
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" DROP COLUMN "Status"`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" DROP COLUMN "ReviewedBy"`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" DROP COLUMN "ReviewedDate"`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" DROP COLUMN "ReviewRemarks"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" ADD "ReviewRemarks" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" ADD "ReviewedDate" TIMESTAMPTZ`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" ADD "ReviewedBy" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" ADD "Status" character varying(20) NOT NULL DEFAULT 'approved'`);
        await queryRunner.query(`CREATE INDEX "IDX_RedeemRequestTbl_Status" ON "WithdrawRequestTbl" ("Status")`);

        await queryRunner.query(`ALTER INDEX "IDX_WithdrawRequestTbl_CreatedDate" RENAME TO "IDX_RedeemRequestTbl_CreatedDate"`);
        await queryRunner.query(`ALTER INDEX "IDX_WithdrawRequestTbl_UserId" RENAME TO "IDX_RedeemRequestTbl_UserId"`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" RENAME CONSTRAINT "PK_WithdrawRequestTbl_Id" TO "PK_RedeemRequestTbl_Id"`);
        await queryRunner.query(`ALTER TABLE "WithdrawRequestTbl" RENAME TO "RedeemRequestTbl"`);
    }
}
