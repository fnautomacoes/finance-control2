CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` enum('checking','savings','investment','credit_card','other') NOT NULL,
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`balance` decimal(15,2) DEFAULT '0',
	`initialBalance` decimal(15,2) DEFAULT '0',
	`isActive` boolean DEFAULT true,
	`bankName` varchar(100),
	`accountNumber` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('real_estate','vehicle','jewelry','art','other') NOT NULL,
	`description` text,
	`purchaseDate` date,
	`purchasePrice` decimal(15,2),
	`currentValue` decimal(15,2),
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` enum('income','expense') NOT NULL,
	`color` varchar(7) DEFAULT '#3b82f6',
	`icon` varchar(50),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(100),
	`phone` varchar(20),
	`type` enum('person','company') NOT NULL,
	`category` varchar(50),
	`notes` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `costCenters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`code` varchar(20),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `costCenters_id` PRIMARY KEY(`id`),
	CONSTRAINT `costCenters_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`categoryId` int,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` enum('budget','savings','investment') NOT NULL,
	`targetAmount` decimal(15,2) NOT NULL,
	`currentAmount` decimal(15,2) DEFAULT '0',
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`startDate` date NOT NULL,
	`endDate` date,
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`ticker` varchar(20),
	`type` enum('stock','etf','fund','fii','bond','crypto','real_estate','other') NOT NULL,
	`quantity` decimal(15,6) NOT NULL,
	`averagePrice` decimal(15,4) NOT NULL,
	`currentPrice` decimal(15,4),
	`totalCost` decimal(15,2) NOT NULL,
	`currentValue` decimal(15,2),
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`purchaseDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`type` enum('loan','mortgage','credit_card','other') NOT NULL,
	`description` text,
	`originalAmount` decimal(15,2) NOT NULL,
	`currentAmount` decimal(15,2) NOT NULL,
	`interestRate` decimal(5,2),
	`startDate` date,
	`endDate` date,
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketIndices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`value` decimal(15,4),
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketIndices_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketIndices_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `netWorthHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalAssets` decimal(15,2) NOT NULL,
	`totalLiabilities` decimal(15,2) NOT NULL,
	`netWorth` decimal(15,2) NOT NULL,
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`date` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `netWorthHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`description` varchar(255) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`dueDate` date NOT NULL,
	`paidDate` date,
	`status` enum('pending','paid','overdue','cancelled') DEFAULT 'pending',
	`categoryId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`status` enum('active','completed','paused','cancelled') DEFAULT 'active',
	`budget` decimal(15,2),
	`spent` decimal(15,2) DEFAULT '0',
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`startDate` date,
	`endDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contactId` int,
	`description` varchar(255) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` enum('BRL','USD','EUR') NOT NULL DEFAULT 'BRL',
	`dueDate` date NOT NULL,
	`receivedDate` date,
	`status` enum('pending','received','overdue','cancelled') DEFAULT 'pending',
	`categoryId` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `receivables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`categoryId` int,
	`projectId` int,
	`contactId` int,
	`description` varchar(255) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`date` date NOT NULL,
	`status` enum('pending','completed','cancelled') DEFAULT 'completed',
	`notes` text,
	`attachments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
