-- Migration: Add income_increment_amount field to budget_data table
-- This field stores the base amount to add each month during auto-increment

USE personal_finance_planner;

ALTER TABLE budget_data 
ADD COLUMN income_increment_amount DECIMAL(10,2) DEFAULT NULL 
AFTER income_increment_date;

-- Verify the change
DESCRIBE budget_data;
