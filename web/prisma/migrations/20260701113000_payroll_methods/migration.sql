ALTER TABLE `users`
  ADD COLUMN `profile_photo_url` LONGTEXT NULL;

CREATE TABLE `payroll_methods` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `bank_name` VARCHAR(100) NOT NULL,
  `card_type` VARCHAR(30) NOT NULL DEFAULT 'Debit',
  `account_number` VARCHAR(80) NOT NULL,
  `account_holder_name` VARCHAR(100) NOT NULL,
  `expiry_month` VARCHAR(10) NULL,
  `expiry_year` VARCHAR(10) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `payroll_methods_user_id_idx`(`user_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `payroll_methods_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
