-- Custom SQL migration file, put your code below! --

-- Drop old tables
DROP TABLE IF EXISTS `locais`;
DROP TABLE IF EXISTS `horarios`;
DROP TABLE IF EXISTS `dias_semana`;
DROP TABLE IF EXISTS `faixa_etaria`;
DROP TABLE IF EXISTS `sexo`;
DROP TABLE IF EXISTS `dispositivos`;
DROP TABLE IF EXISTS `grupos`;
DROP TABLE IF EXISTS `campanhas`;

-- 1. weekly_campaign_summary
CREATE TABLE IF NOT EXISTS `weekly_campaign_summary` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `campaign_name` varchar(255) NOT NULL,
  `start_date` varchar(20) NOT NULL,
  `end_date` varchar(20) NOT NULL,
  `clicks` int,
  `impressions` int,
  `ctr` double,
  `avg_cpc` double,
  `total_cost` double,
  `conversions` int,
  `conversion_rate` double,
  `cost_per_conversion` double,
  `target_cpa_min` double,
  `target_cpa_max` double,
  `created_at` timestamp NOT NULL DEFAULT (now())
);

-- 2. ad_group_performance
CREATE TABLE IF NOT EXISTS `ad_group_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `ad_group_name` varchar(255) NOT NULL,
  `clicks` int,
  `impressions` int,
  `ctr` double,
  `avg_cpc` double,
  `total_cost` double,
  `conversions` int,
  `conversion_rate` double,
  `cost_per_conversion` double
);

-- 3. keyword_performance
CREATE TABLE IF NOT EXISTS `keyword_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `match_type` varchar(50),
  `ad_group_name` varchar(255),
  `clicks` int,
  `impressions` int,
  `total_cost` double,
  `conversions` int,
  `cost_per_conversion` double,
  `note` text
);

-- 4. search_terms
CREATE TABLE IF NOT EXISTS `search_terms` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `snapshot_date` varchar(20),
  `search_term` varchar(255) NOT NULL,
  `ad_group_name` varchar(255),
  `clicks` int,
  `impressions` int,
  `total_cost` double,
  `conversions` int,
  `classification` enum('bom','ruim','neutro') DEFAULT 'neutro',
  `notes` text
);

-- 5. device_performance
CREATE TABLE IF NOT EXISTS `device_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `device` varchar(100) NOT NULL,
  `clicks_percent` double,
  `impressions_percent` double,
  `conversions_percent` double,
  `bid_adjustment` double
);

-- 6. demographic_performance
CREATE TABLE IF NOT EXISTS `demographic_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `segment_type` enum('age','gender','gender_age','income') NOT NULL,
  `segment_name` varchar(100) NOT NULL,
  `conversions` int,
  `percentage` double,
  `notes` text
);

-- 7. hour_performance
CREATE TABLE IF NOT EXISTS `hour_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `hour` varchar(10) NOT NULL,
  `conversions` int
);

-- 8. day_performance
CREATE TABLE IF NOT EXISTS `day_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `day_name` varchar(20) NOT NULL,
  `conversions` int
);

-- 9. location_performance
CREATE TABLE IF NOT EXISTS `location_performance` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `clicks` int,
  `conversions` int,
  `cost_per_conversion` double,
  `status` enum('bom sinal','átenção','sem conversão') DEFAULT 'átenção',
  `notes` text
);

-- 10. insights
CREATE TABLE IF NOT EXISTS `insights` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `weekly_summary_id` int NOT NULL,
  `type` enum('positive','attention','executive') NOT NULL,
  `title` varchar(255),
  `description` text NOT NULL,
  `severity` enum('low','medium','high') DEFAULT 'medium'
);