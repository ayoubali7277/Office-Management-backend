-- DropForeignKey
ALTER TABLE `leave` DROP FOREIGN KEY `Leave_employeeId_fkey`;

-- DropIndex
DROP INDEX `Leave_employeeId_fkey` ON `leave`;

-- AlterTable
ALTER TABLE `leave` ADD COLUMN `managerId` INTEGER NULL,
    MODIFY `employeeId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
