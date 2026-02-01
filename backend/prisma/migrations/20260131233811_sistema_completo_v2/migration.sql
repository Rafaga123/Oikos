-- CreateTable
CREATE TABLE `Rol` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` ENUM('ADMINISTRADOR', 'ENCARGADO_COMUNIDAD', 'HABITANTE') NOT NULL,

    UNIQUE INDEX `Rol_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comunidad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `direccion` TEXT NULL,
    `codigo_unico` VARCHAR(191) NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Comunidad_codigo_unico_key`(`codigo_unico`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cedula` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `primer_nombre` VARCHAR(191) NOT NULL,
    `segundo_nombre` VARCHAR(191) NULL,
    `primer_apellido` VARCHAR(191) NOT NULL,
    `segundo_apellido` VARCHAR(191) NULL,
    `fecha_nacimiento` DATETIME(3) NULL,
    `telefono` VARCHAR(191) NULL,
    `foto_perfil_url` VARCHAR(191) NULL,
    `tipo_habitante` ENUM('PROPIETARIO', 'INQUILINO', 'FAMILIAR', 'OTRO') NULL,
    `numero_casa` VARCHAR(191) NULL,
    `estado_solicitud` ENUM('PENDIENTE', 'ACEPTADO', 'RECHAZADO', 'SIN_COMUNIDAD') NOT NULL DEFAULT 'SIN_COMUNIDAD',
    `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_rol` INTEGER NOT NULL,
    `id_comunidad` INTEGER NULL,

    UNIQUE INDEX `Usuario_cedula_key`(`cedula`),
    UNIQUE INDEX `Usuario_email_key`(`email`),
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
    `metodo_pago` VARCHAR(191) NULL,
    `banco_origen` VARCHAR(191) NULL,
    `banco_destino` VARCHAR(191) NULL,
    `id_usuario` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Anuncio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `contenido` TEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `prioridad` BOOLEAN NOT NULL DEFAULT false,
    `fecha_publicacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_expiracion` DATETIME(3) NULL,
    `id_comunidad` INTEGER NOT NULL,
    `id_autor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Encuesta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_fin` DATETIME(3) NOT NULL,
    `tipo_voto` VARCHAR(191) NOT NULL,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OpcionEncuesta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `texto` VARCHAR(191) NOT NULL,
    `id_encuesta` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VotoEncuesta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `id_encuesta` INTEGER NOT NULL,
    `id_opcion` INTEGER NOT NULL,

    UNIQUE INDEX `VotoEncuesta_id_usuario_id_encuesta_key`(`id_usuario`, `id_encuesta`),
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

-- CreateTable
CREATE TABLE `Incidencia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `categoria` VARCHAR(191) NULL,
    `importancia` VARCHAR(191) NULL,
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

-- CreateTable
CREATE TABLE `Post` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `contenido` TEXT NOT NULL,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_usuario` INTEGER NOT NULL,
    `id_comunidad` INTEGER NOT NULL,
    `cantidad_likes` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Like` (
    `id_usuario` INTEGER NOT NULL,
    `id_post` INTEGER NOT NULL,

    PRIMARY KEY (`id_usuario`, `id_post`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CuentaBancaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banco` VARCHAR(191) NOT NULL,
    `numero_cuenta` VARCHAR(191) NOT NULL,
    `titular` VARCHAR(191) NOT NULL,
    `cedula_rif` VARCHAR(191) NOT NULL,
    `tipo_cuenta` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `logo_url` VARCHAR(191) NULL,
    `id_comunidad` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `Rol`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Pago` ADD CONSTRAINT `Pago_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Anuncio` ADD CONSTRAINT `Anuncio_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Anuncio` ADD CONSTRAINT `Anuncio_id_autor_fkey` FOREIGN KEY (`id_autor`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Encuesta` ADD CONSTRAINT `Encuesta_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OpcionEncuesta` ADD CONSTRAINT `OpcionEncuesta_id_encuesta_fkey` FOREIGN KEY (`id_encuesta`) REFERENCES `Encuesta`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotoEncuesta` ADD CONSTRAINT `VotoEncuesta_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotoEncuesta` ADD CONSTRAINT `VotoEncuesta_id_encuesta_fkey` FOREIGN KEY (`id_encuesta`) REFERENCES `Encuesta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VotoEncuesta` ADD CONSTRAINT `VotoEncuesta_id_opcion_fkey` FOREIGN KEY (`id_opcion`) REFERENCES `OpcionEncuesta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogAuditoria` ADD CONSTRAINT `LogAuditoria_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LogAuditoria` ADD CONSTRAINT `LogAuditoria_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Incidencia` ADD CONSTRAINT `Incidencia_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AreaComun` ADD CONSTRAINT `AreaComun_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `AreaComun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Post` ADD CONSTRAINT `Post_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_id_post_fkey` FOREIGN KEY (`id_post`) REFERENCES `Post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CuentaBancaria` ADD CONSTRAINT `CuentaBancaria_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Regla` ADD CONSTRAINT `Regla_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_id_comunidad_fkey` FOREIGN KEY (`id_comunidad`) REFERENCES `Comunidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExcepcionHorario` ADD CONSTRAINT `ExcepcionHorario_id_horario_fkey` FOREIGN KEY (`id_horario`) REFERENCES `Horario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
