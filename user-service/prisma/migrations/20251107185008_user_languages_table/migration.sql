/*
  Warnings:

  - You are about to drop the column `level` on the `Languages` table. All the data in the column will be lost.
  - You are about to drop the `_LanguagesToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_LanguagesToUser" DROP CONSTRAINT "_LanguagesToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_LanguagesToUser" DROP CONSTRAINT "_LanguagesToUser_B_fkey";

-- AlterTable
ALTER TABLE "Languages" DROP COLUMN "level";

-- DropTable
DROP TABLE "public"."_LanguagesToUser";

-- CreateTable
CREATE TABLE "User_Languages" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "language_id" INTEGER NOT NULL,
    "level" VARCHAR(6) NOT NULL,

    CONSTRAINT "User_Languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Languages_user_id_language_id_key" ON "User_Languages"("user_id", "language_id");

-- AddForeignKey
ALTER TABLE "User_Languages" ADD CONSTRAINT "User_Languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Languages" ADD CONSTRAINT "User_Languages_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "Languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
