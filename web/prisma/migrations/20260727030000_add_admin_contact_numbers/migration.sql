CREATE TABLE IF NOT EXISTS `admin_contact_numbers` (
  `id` CHAR(36) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `phone_number` VARCHAR(25) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `admin_contact_numbers_phone_number_key` (`phone_number`),
  INDEX `admin_contact_numbers_is_active_idx` (`is_active`)
);