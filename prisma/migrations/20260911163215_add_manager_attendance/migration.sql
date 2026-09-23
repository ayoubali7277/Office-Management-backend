-- CreateTable
CREATE TABLE `ManagerAttendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `managerId` INTEGER NOT NULL,

    UNIQUE INDEX `ManagerAttendance_managerId_date_key`(`managerId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ManagerAttendance` ADD CONSTRAINT `ManagerAttendance_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
