/*
  Warnings:

  - You are about to alter the column `nombre` on the `rol` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `rol` MODIFY `nombre` ENUM('ADMINISTRADOR', 'ENCARGADO_COMUNIDAD', 'HABITANTE') NOT NULL;

-- AlterTable
ALTER TABLE `usuario` ADD COLUMN `estado_solicitud` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'SIN_COMUNIDAD') NOT NULL DEFAULT 'SIN_COMUNIDAD',
    ADD COLUMN `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `id_comunidad` INTEGER NULL,
    ADD COLUMN `numero_casa` VARCHAR(191) NULL,
    ADD COLUMN `telefono` VARCHAR(191) NULL,
    ADD COLUMN `tipo_habitante` ENUM('PROPIETARIO', 'INQUILINO', 'FAMILIAR', 'OTRO') NULL;

-- CreateTable
CREATE TABLE `Comunidad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NULL,
    `codigo_unico` VARCHAR(191) NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Comunidad_codigo_unico_key`(`codigo_unico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Anuncio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `contenido` TEXT NOT NULL,
    `fecha_public` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `es_importante` BOOLEAN NOT NULL DEFAULT false,
    `id_autor` INTEGER NOT NULL,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pago` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monto` DECIMAL(10, 2) NOT NULL,
    `fecha_pago` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `concepto` VARCHAR(191) NOT NULL,
    `referencia` VARCHAR(191) NULL,
    `comprobante_url` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
    `nota_admin` VARCHAR(191) NULL,
    `id_usuario` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Incidencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `fecha_reporte` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `foto_url` VARCHAR(191) NULL,
    `estado` ENUM('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO') NOT NULL DEFAULT 'ABIERTO',
    `id_usuario` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AreaComun` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha_reserva` DATETIME(3) NOT NULL,
    `hora_inicio` DATETIME(3) NOT NULL,
    `hora_fin` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'PENDIENTE',
    `id_usuario` INTEGER NOT NULL,
    `id_area` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Anuncio` ADD CONSTRAINT `Anuncio_id_autor_fkey` FOREIGN KEY (`id_autor`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Anuncio` ADD CONSTRAINT `Anuncio_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidencia` ADD CONSTRAINT `Incidencia_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AreaComun` ADD CONSTRAINT `AreaComun_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `AreaComun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
