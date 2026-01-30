-- CreateTable
CREATE TABLE `Regla` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `contenido` TEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ultima_modificacion` DATETIME(3) NOT NULL,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Regla` ADD CONSTRAINT `Regla_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
