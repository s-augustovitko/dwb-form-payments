-- Disable foreign key checks temporarily to ensure a smooth drop process 
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Drop Rate Limits (Independent Table)
DROP TABLE IF EXISTS rate_limits;

-- 2. Drop Payment Records (Child of form_submissions)
DROP TABLE IF EXISTS submission_payments;

-- 3. Drop Selections/Order Items (Child of form_submissions & form_addons)
DROP TABLE IF EXISTS submission_selections;

-- 4. Drop Submission Metadata (Child of form_submissions)
DROP TABLE IF EXISTS submission_metadata;

-- 5. Drop Submissions (Child of forms)
DROP TABLE IF EXISTS form_submissions;

-- 6. Drop Addons/Sessions/Meals (Child of forms)
DROP TABLE IF EXISTS form_addons;

-- 7. Drop the Parent Forms table
DROP TABLE IF EXISTS forms;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
