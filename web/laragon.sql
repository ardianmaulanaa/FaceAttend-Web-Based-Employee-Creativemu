-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `employee_code` VARCHAR(30) NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'employee',
    `employee_type` VARCHAR(20) NOT NULL DEFAULT 'utama',
    `phone` VARCHAR(20) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `profile_photo` VARCHAR(255) NULL,
    `unit_id` CHAR(36) NULL,
    `department_id` CHAR(36) NULL,
    `position_id` CHAR(36) NULL,
    `shift_id` CHAR(36) NULL,
    `registered_office_id` CHAR(36) NULL,
    `npwp_number` VARCHAR(30) NULL,
    `ptkp_status` VARCHAR(20) NULL,
    `base_salary` DECIMAL(15, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_employee_code_key`(`employee_code`),
    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_employee_type_idx`(`employee_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `office_id` CHAR(36) NULL,
    `shift_id` CHAR(36) NULL,
    `salary_calculation` VARCHAR(30) NOT NULL DEFAULT 'monthly',
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Department_office_id_idx`(`office_id`),
    UNIQUE INDEX `Department_office_id_name_key`(`office_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Unit` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `department_id` CHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Unit_department_id_idx`(`department_id`),
    UNIQUE INDEX `Unit_department_id_name_key`(`department_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Position` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `unit_id` CHAR(36) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Position_unit_id_idx`(`unit_id`),
    UNIQUE INDEX `Position_unit_id_name_key`(`unit_id`, `name`),
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
CREATE TABLE `Attendance` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `attendance_date` DATE NOT NULL,
    `scheduled_check_in` DATETIME(3) NULL,
    `scheduled_check_out` DATETIME(3) NULL,
    `check_in_time` DATETIME(3) NULL,
    `check_out_time` DATETIME(3) NULL,
    `check_in_photo` LONGBLOB NULL,
    `check_out_photo` LONGBLOB NULL,
    `check_in_photo_mime` VARCHAR(50) NULL,
    `check_out_photo_mime` VARCHAR(50) NULL,
    `work_mode` VARCHAR(20) NOT NULL DEFAULT 'office',
    `registered_office_id` CHAR(36) NULL,
    `check_in_office_id` CHAR(36) NULL,
    `check_in_latitude` DOUBLE NULL,
    `check_in_longitude` DOUBLE NULL,
    `check_in_accuracy` DOUBLE NULL,
    `check_in_distance` DOUBLE NULL,
    `check_in_within_radius` BOOLEAN NOT NULL DEFAULT false,
    `check_out_office_id` CHAR(36) NULL,
    `check_out_latitude` DOUBLE NULL,
    `check_out_longitude` DOUBLE NULL,
    `check_out_accuracy` DOUBLE NULL,
    `check_out_distance` DOUBLE NULL,
    `check_out_within_radius` BOOLEAN NOT NULL DEFAULT false,
    `late_minutes` INTEGER NOT NULL DEFAULT 0,
    `late_seconds` INTEGER NOT NULL DEFAULT 0,
    `early_leave_minutes` INTEGER NOT NULL DEFAULT 0,
    `work_minutes` INTEGER NOT NULL DEFAULT 0,
    `is_over_tolerance` BOOLEAN NOT NULL DEFAULT false,
    `late_reason` VARCHAR(255) NULL,
    `early_leave_reason` VARCHAR(255) NULL,
    `is_wfh` BOOLEAN NOT NULL DEFAULT false,
    `is_wfc` BOOLEAN NOT NULL DEFAULT false,
    `is_visit` BOOLEAN NOT NULL DEFAULT false,
    `wfh_request_id` CHAR(36) NULL,
    `activity_note` VARCHAR(255) NULL,
    `status` ENUM('PENDING', 'PRESENT', 'LATE', 'ABSENT', 'PERMISSION', 'SICK') NOT NULL DEFAULT 'PENDING',
    `check_in_status` ENUM('ON_TIME', 'LATE') NULL,
    `check_out_status` ENUM('NORMAL', 'EARLY') NULL,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attendance_attendance_date_idx`(`attendance_date`),
    INDEX `Attendance_status_idx`(`status`),
    INDEX `Attendance_check_in_status_idx`(`check_in_status`),
    INDEX `Attendance_check_out_status_idx`(`check_out_status`),
    INDEX `Attendance_work_mode_idx`(`work_mode`),
    INDEX `Attendance_is_wfh_idx`(`is_wfh`),
    INDEX `Attendance_is_wfc_idx`(`is_wfc`),
    INDEX `Attendance_is_visit_idx`(`is_visit`),
    UNIQUE INDEX `Attendance_user_id_attendance_date_key`(`user_id`, `attendance_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceMonthlySummary` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `period_month` INTEGER NOT NULL,
    `period_year` INTEGER NOT NULL,
    `total_present_days` INTEGER NOT NULL DEFAULT 0,
    `total_late_days` INTEGER NOT NULL DEFAULT 0,
    `total_absent_days` INTEGER NOT NULL DEFAULT 0,
    `total_leave_days` INTEGER NOT NULL DEFAULT 0,
    `total_sick_days` INTEGER NOT NULL DEFAULT 0,
    `total_late_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_early_leave_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_work_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_wfh_days` INTEGER NOT NULL DEFAULT 0,
    `total_wfc_days` INTEGER NOT NULL DEFAULT 0,
    `total_visit_days` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttendanceMonthlySummary_period_month_period_year_idx`(`period_month`, `period_year`),
    UNIQUE INDEX `AttendanceMonthlySummary_user_id_period_month_period_year_key`(`user_id`, `period_month`, `period_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmployeeVisit` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `attendance_id` CHAR(36) NULL,
    `visit_date` DATE NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `client_name` VARCHAR(100) NULL,
    `address` VARCHAR(255) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `accuracy` DOUBLE NULL,
    `start_time` DATETIME(3) NULL,
    `end_time` DATETIME(3) NULL,
    `note` VARCHAR(255) NULL,
    `visit_photo` LONGBLOB NULL,
    `visit_photo_mime` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'planned',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `EmployeeVisit_visit_date_idx`(`visit_date`),
    INDEX `EmployeeVisit_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WfhRequest` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `request_date` DATE NOT NULL,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `allowed_radius_meters` INTEGER NULL DEFAULT 500,
    `approved_by_id` CHAR(36) NULL,
    `admin_note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WfhRequest_request_date_idx`(`request_date`),
    INDEX `WfhRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `leave_type` VARCHAR(30) NOT NULL,
    `requested_work_mode` VARCHAR(20) NULL,
    `location_unlock_requested` BOOLEAN NOT NULL DEFAULT false,
    `location_unlock_approved` BOOLEAN NOT NULL DEFAULT false,
    `visit_location_name` VARCHAR(150) NULL,
    `visit_address` VARCHAR(255) NULL,
    `visit_latitude` DOUBLE NULL,
    `visit_longitude` DOUBLE NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `total_days` INTEGER NOT NULL DEFAULT 1,
    `reason` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `admin_note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeaveRequest_status_idx`(`status`),
    INDEX `LeaveRequest_start_date_idx`(`start_date`),
    INDEX `LeaveRequest_leave_type_idx`(`leave_type`),
    INDEX `LeaveRequest_location_unlock_approved_idx`(`location_unlock_approved`),
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
    `attachment_url` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Announcement_target_idx`(`target`),
    INDEX `Announcement_status_idx`(`status`),
    INDEX `Announcement_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminNotification` (
    `id` CHAR(36) NOT NULL,
    `attendance_id` CHAR(36) NULL,
    `user_id` CHAR(36) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'unread',
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminNotification_type_idx`(`type`),
    INDEX `AdminNotification_status_idx`(`status`),
    INDEX `AdminNotification_is_read_idx`(`is_read`),
    INDEX `AdminNotification_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payroll` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `period_month` INTEGER NOT NULL,
    `period_year` INTEGER NOT NULL,
    `base_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_bonus` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_reward` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `leave_deduction` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `late_deduction` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `other_deduction` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `gross_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `pph_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `net_salary` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_late_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_work_minutes` INTEGER NOT NULL DEFAULT 0,
    `total_absent_days` INTEGER NOT NULL DEFAULT 0,
    `total_leave_days` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payroll_period_month_period_year_idx`(`period_month`, `period_year`),
    INDEX `Payroll_status_idx`(`status`),
    UNIQUE INDEX `Payroll_user_id_period_month_period_year_key`(`user_id`, `period_month`, `period_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayrollItem` (
    `id` CHAR(36) NOT NULL,
    `payroll_id` CHAR(36) NOT NULL,
    `type` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PayrollItem_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Permission_name_key`(`name`),
    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `id` CHAR(36) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `permission_id` CHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermission_role_idx`(`role`),
    UNIQUE INDEX `RolePermission_role_permission_id_key`(`role`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_position_id_fkey` FOREIGN KEY (`position_id`) REFERENCES `Position`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_registered_office_id_fkey` FOREIGN KEY (`registered_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_office_id_fkey` FOREIGN KEY (`office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Department` ADD CONSTRAINT `Department_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Unit` ADD CONSTRAINT `Unit_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Position` ADD CONSTRAINT `Position_unit_id_fkey` FOREIGN KEY (`unit_id`) REFERENCES `Unit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkSchedule` ADD CONSTRAINT `WorkSchedule_shift_id_fkey` FOREIGN KEY (`shift_id`) REFERENCES `Shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_registered_office_id_fkey` FOREIGN KEY (`registered_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_in_office_id_fkey` FOREIGN KEY (`check_in_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_check_out_office_id_fkey` FOREIGN KEY (`check_out_office_id`) REFERENCES `OfficeLocation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_wfh_request_id_fkey` FOREIGN KEY (`wfh_request_id`) REFERENCES `WfhRequest`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceMonthlySummary` ADD CONSTRAINT `AttendanceMonthlySummary_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeVisit` ADD CONSTRAINT `EmployeeVisit_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmployeeVisit` ADD CONSTRAINT `EmployeeVisit_attendance_id_fkey` FOREIGN KEY (`attendance_id`) REFERENCES `Attendance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WfhRequest` ADD CONSTRAINT `WfhRequest_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WfhRequest` ADD CONSTRAINT `WfhRequest_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminNotification` ADD CONSTRAINT `AdminNotification_attendance_id_fkey` FOREIGN KEY (`attendance_id`) REFERENCES `Attendance`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminNotification` ADD CONSTRAINT `AdminNotification_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayrollItem` ADD CONSTRAINT `PayrollItem_payroll_id_fkey` FOREIGN KEY (`payroll_id`) REFERENCES `Payroll`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
