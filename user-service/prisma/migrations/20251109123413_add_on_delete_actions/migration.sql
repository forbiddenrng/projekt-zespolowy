-- DropForeignKey
ALTER TABLE "public"."Abilities" DROP CONSTRAINT "Abilities_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Certificate" DROP CONSTRAINT "Certificate_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Education" DROP CONSTRAINT "Education_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Link" DROP CONSTRAINT "Link_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."User_Languages" DROP CONSTRAINT "User_Languages_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Work_Experience" DROP CONSTRAINT "Work_Experience_user_id_fkey";

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Work_Experience" ADD CONSTRAINT "Work_Experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Languages" ADD CONSTRAINT "User_Languages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abilities" ADD CONSTRAINT "Abilities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
