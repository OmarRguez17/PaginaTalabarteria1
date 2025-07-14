-- Datos iniciales para la base de datos de Talabartería Rodríguez
-- Incluye datos básicos para: información de tienda y usuarios
USE talabarteria_rodriguez;

-- Insertar información de la tienda
INSERT INTO informacion_tienda (
    nombre, slogan, descripcion, telefono, email, direccion, horario, facebook, instagram, whatsapp, logo_url, banner_principal_url
) VALUES (
    'Talabartería Rodríguez',
    'LAS MEJORES MONTURAS AL MEJOR PRECIO',
    'TALABARTERIA RODRIGUEZ LE OFRECE ARTICULOS DE CHARRERIA, SU PRINCIPAL LAS MONTURAS DE LA MEJOR CALIDAD Y EL MEJOR PRECIO.',
    '3751182715',
    'contacto@talabarteriarodriguez.com',
    'INDEPENDENCIA #317 EN COCULA JALISCO',
    'Lunes a Sábado: 9:00 AM - 7:00 PM, Domingo: 9:00 AM - 2:00 PM',
    'https://facebook.com/talabarteriarodriguez',
    'https://instagram.com/talabarteriarodriguez',
    '3751182715',
    'https://ejemplo.com/imagenes/logo_talabarteria.png',
    'https://ejemplo.com/imagenes/banner_principal.jpg'
);

-- Insertar usuarios
-- Contraseña: admin123 (hash ficticio para demostración)
INSERT INTO usuarios (correo, contrasena_hash, nombre, apellidos, telefono, activo, verified)
VALUES 
('admin@talabarteriarodriguez.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'Rodríguez', '3751182715', 1, 1),
('ventas@talabarteriarodriguez.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ventas', 'Rodríguez', '3751182715', 1, 1),
('cliente@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Cliente', 'Ejemplo', '3377987654', 1, 1);

-- Insertar administradores
INSERT INTO administradores (usuario_id, rol)
VALUES 
(1, 'super_admin'),
(2, 'admin');

-- Insertar direcciones de envío para el cliente de ejemplo
INSERT INTO direcciones_envio (
    usuario_id, direccion_linea1, direccion_linea2, ciudad, 
    estado, codigo_postal, pais, es_principal
)
VALUES 
(3, 'Calle Principal 123', 'Colonia Centro', 'Guadalajara', 'Jalisco', '44100', 'México', 1),
(3, 'Avenida Revolución 456', 'Departamento 2B', 'Guadalajara', 'Jalisco', '44200', 'México', 0);

-- Insertar token de recuperación (solo para demo)
INSERT INTO tokens_recuperacion (
    usuario_id, token, creado_en, expira_en, usado
)
VALUES 
(3, 'abcdef123456', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 0);