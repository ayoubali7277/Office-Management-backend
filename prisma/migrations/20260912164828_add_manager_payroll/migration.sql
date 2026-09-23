-- DropForeignKey
ALTER TABLE `Payroll` DROP FOREIGN KEY `Payroll_employeeId_fkey`;

-- DropIndex
DROP INDEX `Payroll_employeeId_fkey` ON `Payroll`;

-- AlterTable
ALTER TABLE `Payroll` ADD COLUMN `managerId` INTEGER NULL,
    MODIFY `employeeId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
