-- AlterTable
ALTER TABLE `Attendance` ADD COLUMN `check_in_accuracy` DOUBLE NULL,
    ADD COLUMN `check_in_distance` DOUBLE NULL,
    ADD COLUMN `check_in_office_id` CHAR(36) NULL,
    ADD COLUMN `check_in_within_radius` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `check_out_accuracy` DOUBLE NULL,
    ADD COLUMN `check_out_distance` DOUBLE NULL,
    ADD COLUMN `check_out_office_id` CHAR(36) NULL,
    ADD COLUMN `check_out_within_radius` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `registered_office_id` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `registered_office_id` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `OfficeLocation` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `radius_meters` INTEGER NOT NULL DEFAULT 100,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `OfficeLocation_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `content` TEXT NOT NULL,
    `target` VARCHAR(20) NOT NULL DEFAULT 'all',
    `status` VARCHAR(20) NOT NULL DEFAULT 'published',
    `author_id` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Announcement_target_idx`(`target`),
    INDEX `Announcement_status_idx`(`status`),
    INDEX `Announcement_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Attendance_registered_office_id_idx` ON `Attendance`(`registered_office_id`);

-- CreateIndex
CREATE INDEX `Attendance_check_in_office_id_idx` ON `Attendance`(`check_in_office_id`);

-- CreateIndex
CREATE INDEX `Attendance_check_out_office_id_idx` ON `Attendance`(`check_out_office_id`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_registered_office_id_fkey` FOREIGN KEY (`registered_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_registered_office_id_fkey` FOREIGN KEY (`registered_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_in_office_id_fkey` FOREIGN KEY (`check_in_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_out_office_id_fkey` FOREIGN KEY (`check_out_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
