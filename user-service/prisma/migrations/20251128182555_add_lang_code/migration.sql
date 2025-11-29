/*
  Warnings:

  - Added the required column `code` to the `Languages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Languages" ADD COLUMN     "code" VARCHAR(5) NOT NULL;
