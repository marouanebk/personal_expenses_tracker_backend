/*
  Warnings:

  - Added the required column `transactionType` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionType` to the `Income` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "transactionType" "TransactionType" NOT NULL;

-- AlterTable
ALTER TABLE "Income" ADD COLUMN     "transactionType" "TransactionType" NOT NULL;
