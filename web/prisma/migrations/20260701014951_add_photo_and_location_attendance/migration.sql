/*
  Warnings:

  - The primary key for the `Attendance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.
  - You are about to alter the column `userId` on the `Attendance` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Char(36)`.

*/
-- DropForeignKey
ALTER TABLE `Attendance` DROP FOREIGN KEY `Attendance_userId_fkey`;

-- DropIndex
DROP INDEX `Attendance_userId_fkey` ON `Attendance`;

-- AlterTable
ALTER TABLE `Attendance` DROP PRIMARY KEY,
    ADD COLUMN `checkInLatitude` DOUBLE NULL,
    ADD COLUMN `checkInLongitude` DOUBLE NULL,
    ADD COLUMN `checkOutLatitude` DOUBLE NULL,
    ADD COLUMN `checkOutLongitude` DOUBLE NULL,
    MODIFY `id` CHAR(36) NOT NULL,
    MODIFY `userId` CHAR(36) NOT NULL,
    MODIFY `checkInPhoto` VARCHAR(255) NULL,
    MODIFY `checkOutPhoto` VARCHAR(255) NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
