ALTER TABLE `LeaveRequest`
  ADD COLUMN `requested_work_mode` VARCHAR(20) NULL,
  ADD COLUMN `location_unlock_requested` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `location_unlock_approved` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `visit_location_name` VARCHAR(150) NULL,
  ADD COLUMN `visit_address` VARCHAR(255) NULL,
  ADD COLUMN `visit_latitude` DOUBLE NULL,
  ADD COLUMN `visit_longitude` DOUBLE NULL;

CREATE INDEX `LeaveRequest_leave_type_idx` ON `LeaveRequest`(`leave_type`);
CREATE INDEX `LeaveRequest_location_unlock_approved_idx` ON `LeaveRequest`(`location_unlock_approved`);