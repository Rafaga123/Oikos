# 🏛️ Oikos: Sistema Integral de Gestión de Comunidades Residenciales

> **Oikos** (del griego *oîkos*: casa, patrimonio, familia).

![Logo Oikos](./Images/OIKOS.png)
## 📖 Descripción del Proyecto

**Oikos** es una solución de software completa (*Full Stack*) desarrollada para resolver los problemas comunes en la administración de propiedades horizontales: falta de transparencia, comunicación ineficiente y procesos manuales tediosos.

El sistema actúa como un puente digital entre la **Junta de Condominio/Administración** y los **Residentes**, centralizando todas las operaciones vitales de la comunidad en una sola interfaz web segura, intuitiva y accesible.

A diferencia de los sistemas contables tradicionales, Oikos pone énfasis en la convivencia y la participación, integrando módulos de votación democrática, gestión de incidencias y reserva de espacios comunes, además de la gestión financiera.

---

## 🚀 Características Principales y Módulos

### 1. Gestión de Identidad y Seguridad (IAM)
* **Autenticación Robusta:** Sistema de inicio de sesión seguro mediante Cédula de Identidad o Correo Electrónico.
* **Roles Jerárquicos (RBAC):**
    * *Administrador:* Mantenimiento del sistema.
    * *Encargado de Comunidad:* Presidentes o administradores con permisos de gestión total sobre su edificio.
    * *Habitante:* Perfiles diferenciados para Propietarios, Inquilinos y Familiares.
* **Recuperación de Accesos:** Sistema automatizado de restablecimiento de credenciales vía correo electrónico seguro.

### 2. Onboarding y Multi-Comunidad
* **Arquitectura Multi-Tenant:** Capacidad para gestionar múltiples comunidades aisladas en una misma base de datos.
* **Códigos Únicos de Acceso:** Sistema de invitación mediante códigos alfanuméricos generados automáticamente para unirse a una residencia específica.
* **Flujo de Bienvenida:** Asistente interactivo para nuevos usuarios (Creación vs. Unión a comunidad).

### 3. Módulo Financiero
* **Registro de Pagos:** Interfaz para que los residentes reporten transferencias, pagos móviles o depósitos.
* **Auditoría de Transacciones:** Panel para que los encargados aprueben o rechacen pagos, con opción de feedback (motivo de rechazo).
* **Historial de Solvencia:** Visualización del estado de cuenta personal.

### 4. Módulo de Convivencia y Democracia
* **Muro de Anuncios:** Feed de noticias oficial para comunicados importantes (suspensión de servicios, reuniones, etc.).
* **Sistema de Votaciones:** Módulo de encuestas digitales para tomar decisiones comunitarias de forma transparente y democrática.
* **Gestión de Incidencias:** Reporte de averías o problemas en áreas comunes con seguimiento de estado (*Abierto, En Progreso, Resuelto*).

### 5. Gestión de Espacios (Próximamente)
* **Reservas:** Calendario para el uso de áreas comunes (Salón de fiestas, Parrilleras, Piscinas).

---

## 🛠️ Stack Tecnológico

El proyecto ha sido construido utilizando tecnologías modernas y escalables, siguiendo patrones de diseño **MVC** (Modelo-Vista-Controlador) y principios de ingeniería de software.

| Área | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3 | Estructura y Estilos base. |
| **UI Framework** | Semantic UI | Biblioteca de diseño para una interfaz limpia, responsiva y profesional. |
| **Scripting** | JavaScript (ES6+) | Lógica del lado del cliente, manejo del DOM y consumo de APIs. |
| **Backend** | Node.js | Entorno de ejecución de alto rendimiento. |
| **Framework** | Express.js | Manejo de rutas, middlewares y lógica del servidor RESTful. |
| **Base de Datos** | MySQL | Sistema de gestión de bases de datos relacional. |
| **ORM** | Prisma | Mapeo objeto-relacional para consultas seguras y migraciones. |
| **Seguridad** | JWT & BCrypt | JSON Web Tokens para sesiones y Hashing para encriptación. |
| **Servicios** | Nodemailer | Integración SMTP (Gmail API) para notificaciones. |

---

## 🏗️ Arquitectura de la Base de Datos

El sistema se sustenta en un modelo relacional normalizado que garantiza la integridad de los datos:

1.  **Normalización:** Estructura optimizada para evitar redundancia de datos.
2.  **Relaciones:** Uso estricto de Claves Foráneas (FK) para vincular *Usuarios, Comunidades, Pagos y Actividades*.
3.  **Enumeraciones (Enums):** Control estricto de estados (ej: `PENDIENTE`, `APROBADO`, `RECHAZADO`) para mantener la consistencia lógica del negocio.
4.  **Logs de Auditoría:** Tablas dedicadas al registro de acciones críticas del sistema para seguridad forense.

---

## ⚙️ Instalación y Despliegue (Uso Interno)

> ⚠️ Estas instrucciones son exclusivas para el equipo de desarrollo y despliegue del proyecto.

### Prerrequisitos
* Node.js (v18 o superior).
* Servidor MySQL (XAMPP/WAMP o dedicado).
* Git.

### Pasos Generales

1.  **Clonado del Repositorio**
    ```bash
    git clone [https://github.com/usuario/oikos-project.git](https://github.com/usuario/oikos-project.git)
    cd oikos-project
    ```

2.  **Instalación de Dependencias**
    ```bash
    npm install
    ```

3.  **Configuración de Entorno**
    * Crear el archivo `.env` basado en la plantilla `.env.example`.
    * Configurar `DATABASE_URL` con las credenciales locales de MySQL.
    * Configurar `JWT_SECRET` para la firma de tokens.
    * Configurar credenciales SMTP para el servicio de correos.

4.  **Migración de Base de Datos**
    Ejecutar los comandos de Prisma para sincronizar el esquema (`schema.prisma`) con la base de datos local:
    ```bash
    npx prisma migrate dev --name init
    ```
    *Esto generará automáticamente las tablas, relaciones y enums necesarios.*

5.  **Inicialización**
    Al arrancar el servidor por primera vez, el sistema ejecutará scripts de *seeding* para crear los Roles base necesarios.

6.  **Ejecución**
    Iniciar el servidor Express:
    ```bash
    npm run dev
    ```

---

## 🔒 Privacidad y Licencia

**Copyright © 2025 Equipo de Desarrollo Oikos.**

Este proyecto es **PRIVADO**. El código fuente, diseño de base de datos y lógica de negocio son propiedad intelectual de sus autores.

* Queda estrictamente prohibida la copia, modificación, distribución o uso comercial de este software sin autorización expresa y por escrito.
* Este software ha sido desarrollado con fines académicos y profesionales como parte de la carrera de Ingeniería en Sistemas.

---

## 📞 Contacto y Soporte

Para reportar bugs, sugerir mejoras o solicitar acceso administrativo, por favor contactar al equipo de desarrollo a través de los canales internos establecidos.

*Hecho con ❤️ y mucho código.*
