/*
  Warnings:

  - You are about to drop the column `allowRegistartions` on the `platformsetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `platformsetting` DROP COLUMN `allowRegistartions`,
    ADD COLUMN `allowRegistrations` BOOLEAN NOT NULL DEFAULT true;
