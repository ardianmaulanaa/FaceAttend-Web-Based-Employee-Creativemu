/*
  Warnings:

  - You are about to drop the column `checkInLatitude` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkInLongitude` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkInPhoto` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkInTime` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutLatitude` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutLongitude` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutPhoto` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutTime` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `Attendance` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(1))`.
  - You are about to drop the column `department` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,attendance_date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employee_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `attendance_date` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Attendance` DROP FOREIGN KEY `Attendance_userId_fkey`;

-- DropIndex
DROP INDEX `Attendance_userId_fkey` ON `Attendance`;

-- AlterTable
ALTER TABLE `Attendance` DROP COLUMN `checkInLatitude`,
    DROP COLUMN `checkInLongitude`,
    DROP COLUMN `checkInPhoto`,
    DROP COLUMN `checkInTime`,
    DROP COLUMN `checkOutLatitude`,
    DROP COLUMN `checkOutLongitude`,
    DROP COLUMN `checkOutPhoto`,
    DROP COLUMN `checkOutTime`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`,
    DROP COLUMN `userId`,
    ADD COLUMN `attendance_date` DATE NOT NULL,
    ADD COLUMN `check_in_latitude` DOUBLE NULL,
    ADD COLUMN `check_in_longitude` DOUBLE NULL,
    ADD COLUMN `check_in_photo` LONGBLOB NULL,
    ADD COLUMN `check_in_photo_mime` VARCHAR(50) NULL,
    ADD COLUMN `check_in_status` ENUM('ON_TIME', 'LATE') NULL,
    ADD COLUMN `check_in_time` DATETIME(3) NULL,
    ADD COLUMN `check_out_latitude` DOUBLE NULL,
    ADD COLUMN `check_out_longitude` DOUBLE NULL,
    ADD COLUMN `check_out_photo` LONGBLOB NULL,
    ADD COLUMN `check_out_photo_mime` VARCHAR(50) NULL,
    ADD COLUMN `check_out_status` ENUM('NORMAL', 'EARLY') NULL,
    ADD COLUMN `check_out_time` DATETIME(3) NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `early_leave_minutes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `late_minutes` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `note` VARCHAR(255) NULL,
    ADD COLUMN `scheduled_check_in` DATETIME(3) NULL,
    ADD COLUMN `scheduled_check_out` DATETIME(3) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `user_id` CHAR(36) NOT NULL,
    ADD COLUMN `work_minutes` INTEGER NOT NULL DEFAULT 0,
    MODIFY `status` ENUM('PENDING', 'PRESENT', 'LATE', 'ABSENT', 'PERMISSION', 'SICK') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `users` DROP COLUMN `department`,
    DROP COLUMN `position`,
    ADD COLUMN `department_id` CHAR(36) NULL,
    ADD COLUMN `employee_code` VARCHAR(30) NULL,
    ADD COLUMN `position_id` CHAR(36) NULL,
    ADD COLUMN `shift_id` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `Department` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `shift_id` CHAR(36) NULL,
    `salary_calculation` VARCHAR(30) NOT NULL DEFAULT 'monthly',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Department_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Position_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shift` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `tolerance_minutes` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Shift_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkSchedule` (
    `id` CHAR(36) NOT NULL,
    `shift_id` CHAR(36) NOT NULL,
    `day_of_week` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    `is_work_day` BOOLEAN NOT NULL DEFAULT true,
    `check_in_time` VARCHAR(5) NULL,
    `check_out_time` VARCHAR(5) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WorkSchedule_shift_id_day_of_week_key`(`shift_id`, `day_of_week`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Attendance_attendance_date_idx` ON `Attendance`(`attendance_date`);

-- CreateIndex
CREATE INDEX `Attendance_status_idx` ON `Attendance`(`status`);

-- CreateIndex
CREATE INDEX `Attendance_check_in_status_idx` ON `Attendance`(`check_in_status`);

-- CreateIndex
CREATE UNIQUE INDEX `Attendance_user_id_attendance_date_key` ON `Attendance`(`user_id`, `attendance_date`);

-- CreateIndex
CREATE UNIQUE INDEX `users_employee_code_key` ON `users`(`employee_code`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_position_id_fkey` FOREIGN KEY (`position_id`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkSchedule` ADD CONSTRAINT `WorkSchedule_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
