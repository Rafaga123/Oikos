-- CreateTable
CREATE TABLE `Horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `dias` VARCHAR(191) NOT NULL,
    `hora_inicio` VARCHAR(191) NOT NULL,
    `hora_fin` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `capacidad` INTEGER NULL,
    `grupo` VARCHAR(191) NULL,
    `fecha_inicio` DATETIME(3) NULL,
    `fecha_fin` DATETIME(3) NULL,
    `descripcion` TEXT NULL,
    `restricciones` TEXT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultima_modificacion` DATETIME(3) NOT NULL,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExcepcionHorario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATETIME(3) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `horario_especial` VARCHAR(191) NULL,
    `id_horario` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExcepcionHorario` ADD CONSTRAINT `ExcepcionHorario_id_horario_fkey` FOREIGN KEY (`id_horario`) REFERENCES `Horario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
