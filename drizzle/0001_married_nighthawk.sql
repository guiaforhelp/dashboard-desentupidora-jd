CREATE TABLE `campanhas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`periodo` varchar(100),
	`campanha` varchar(255) NOT NULL,
	`cliques` int DEFAULT 0,
	`impressoes` int DEFAULT 0,
	`ctr` varchar(20),
	`cpcMedio` varchar(30),
	`custoTotal` varchar(30),
	`conversoes` int DEFAULT 0,
	`taxaConversao` varchar(20),
	`custoPorConversao` varchar(30),
	`cpaDesejado` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `campanhas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dias_semana` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`dia` varchar(20) NOT NULL,
	`conversoes` int DEFAULT 0,
	CONSTRAINT `dias_semana_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispositivos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`tipo` varchar(50) NOT NULL,
	`conversoesPercentual` varchar(20),
	`impressoesPercentual` varchar(20),
	`cliquesPercentual` varchar(20),
	`ajuste` varchar(20),
	CONSTRAINT `dispositivos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faixa_etaria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`faixa` varchar(20) NOT NULL,
	`conversoes` int DEFAULT 0,
	CONSTRAINT `faixa_etaria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grupos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cliques` int DEFAULT 0,
	`impressoes` int DEFAULT 0,
	`ctr` varchar(20),
	`cpcMedio` varchar(30),
	`custoTotal` varchar(30),
	`conversoes` int DEFAULT 0,
	`taxaConversao` varchar(20),
	`custoPorConversao` varchar(30),
	CONSTRAINT `grupos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `horarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`hora` varchar(10) NOT NULL,
	`conversoes` int DEFAULT 0,
	CONSTRAINT `horarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`local` varchar(100) NOT NULL,
	`cliques` int DEFAULT 0,
	`conversoes` int DEFAULT 0,
	`cpa` varchar(30),
	`categoria` enum('destaque','atencao') NOT NULL,
	CONSTRAINT `locais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sexo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campanhaId` int NOT NULL,
	`genero` varchar(20) NOT NULL,
	`conversoes` int DEFAULT 0,
	`percentualConhecido` varchar(20),
	CONSTRAINT `sexo_id` PRIMARY KEY(`id`)
);
