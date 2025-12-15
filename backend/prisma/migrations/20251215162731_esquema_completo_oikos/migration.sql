-- AlterTable
ALTER TABLE `anuncio` ADD COLUMN `imagen_url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `comunidad` MODIFY `direccion` TEXT NULL;

-- CreateTable
CREATE TABLE `Encuesta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pregunta` VARCHAR(200) NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_fin` DATETIME(3) NOT NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VotoEncuesta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `opcion_elegida` VARCHAR(191) NOT NULL,
    `fecha_voto` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_encuesta` INTEGER NOT NULL,
    `cedula_usuario` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `VotoEncuesta_id_encuesta_cedula_usuario_key`(`id_encuesta`, `cedula_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LogAuditoria` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `accion` VARCHAR(191) NOT NULL,
    `detalle_tecnico` TEXT NULL,
    `fecha_hora` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_usuario` INTEGER NULL,
    `id_comunidad` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Encuesta` ADD CONSTRAINT `Encuesta_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotoEncuesta` ADD CONSTRAINT `VotoEncuesta_id_encuesta_fkey` FOREIGN KEY (`id_encuesta`) REFERENCES `Encuesta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotoEncuesta` ADD CONSTRAINT `VotoEncuesta_cedula_usuario_fkey` FOREIGN KEY (`cedula_usuario`) REFERENCES `Usuario`(`cedula`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogAuditoria` ADD CONSTRAINT `LogAuditoria_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogAuditoria` ADD CONSTRAINT `LogAuditoria_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
