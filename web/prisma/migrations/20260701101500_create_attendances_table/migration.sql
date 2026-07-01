-- CreateTable
CREATE TABLE `attendances` (
    `id` CHAR(36) NOT NULL,
    `employee_id` CHAR(36) NOT NULL,
    `attendance_date` DATE NOT NULL,
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `check_in_photo_url` LONGTEXT NULL,
    `check_out_photo_url` LONGTEXT NULL,
    `check_in_latitude` DECIMAL(10,6) NULL,
    `check_in_longitude` DECIMAL(10,6) NULL,
    `check_out_latitude` DECIMAL(10,6) NULL,
    `check_out_longitude` DECIMAL(10,6) NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `attendances_employee_id_attendance_date_key`(`employee_id`, `attendance_date`),
    INDEX `attendances_attendance_date_idx`(`attendance_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `attendances`
    ADD CONSTRAINT `attendances_employee_id_fkey`
    FOREIGN KEY (`employee_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
