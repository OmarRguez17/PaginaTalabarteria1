-- Esquema de base de datos para Talabartería Rodríguez
-- Incluye tablas para: usuarios, administradores, categorías, productos, 
-- pedidos, items de pedido, carrito, reseñas, direcciones, tokens de recuperación y pagos PayPal

-- Eliminar base de datos si existe para evitar conflictos
DROP DATABASE IF EXISTS talabarteria_rodriguez;
CREATE DATABASE talabarteria_rodriguez DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE talabarteria_rodriguez;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    verification_token VARCHAR(255) NULL,
    verified BOOLEAN DEFAULT 0,
    verification_token_expires TIMESTAMP NULL,
    activo BOOLEAN DEFAULT 1,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL
) ENGINE=InnoDB;

-- Tabla de administradores
CREATE TABLE administradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    rol ENUM('admin', 'super_admin') NOT NULL DEFAULT 'admin',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de categorías de productos
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    url_imagen VARCHAR(255),
    categoria_padre_id INT NULL,
    activo BOOLEAN DEFAULT 1,
    orden_visualizacion INT DEFAULT 0,
    FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla de etiquetas para productos
CREATE TABLE etiquetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Tabla de productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    descripcion_detallada TEXT,
    precio DECIMAL(10,2) NOT NULL,
    precio_descuento DECIMAL(10,2) NULL,
    porcentaje_descuento INT NULL,
    cantidad_stock INT DEFAULT 0,
    sku VARCHAR(50) NULL,
    peso DECIMAL(10,2) NULL,
    dimensiones VARCHAR(100) NULL, -- formato: "largo x ancho x alto"
    material VARCHAR(100) NULL,
    destacado BOOLEAN DEFAULT 0,
    nuevo BOOLEAN DEFAULT 0,
    activo BOOLEAN DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    contador_vistas INT DEFAULT 0,
    contador_ventas INT DEFAULT 0,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Tabla de relación entre productos y etiquetas
CREATE TABLE productos_etiquetas (
    producto_id INT,
    etiqueta_id INT,
    PRIMARY KEY (producto_id, etiqueta_id),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (etiqueta_id) REFERENCES etiquetas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de imágenes de productos
CREATE TABLE imagenes_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    es_principal BOOLEAN DEFAULT 0,
    orden_visualizacion INT DEFAULT 0,
    texto_alternativo VARCHAR(100),
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de direcciones de envío
CREATE TABLE direcciones_envio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,  -- PERMITIR NULL PARA USUARIOS INVITADOS
    direccion_linea1 VARCHAR(100) NOT NULL,
    direccion_linea2 VARCHAR(100),
    ciudad VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    codigo_postal VARCHAR(10) NOT NULL,
    pais VARCHAR(50) NOT NULL DEFAULT 'México',
    es_principal BOOLEAN DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,  -- PERMITIR NULL PARA USUARIOS INVITADOS
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    monto_total DECIMAL(10,2) NOT NULL,
    direccion_envio_id INT NOT NULL,
    metodo_envio VARCHAR(50),
    costo_envio DECIMAL(10,2) DEFAULT 0,
    metodo_pago VARCHAR(50),
    estado_pago ENUM('pendiente', 'pagado', 'reembolsado') DEFAULT 'pendiente',
    notas TEXT,
    numero_seguimiento VARCHAR(100),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (direccion_envio_id) REFERENCES direcciones_envio(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabla de ítems de pedido
CREATE TABLE items_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    precio_total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Tabla de carrito de compras
CREATE TABLE items_carrito (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    UNIQUE(usuario_id, producto_id)
) ENGINE=InnoDB;

-- Tabla de reseñas/valoraciones
CREATE TABLE resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    calificacion INT NOT NULL CHECK(calificacion BETWEEN 1 AND 5),
    titulo VARCHAR(100),
    comentario TEXT,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    es_compra_verificada BOOLEAN DEFAULT 0,
    aprobada BOOLEAN DEFAULT 0,
    votos_utiles INT DEFAULT 0,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de imágenes de reseñas
CREATE TABLE imagenes_resenas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resena_id INT NOT NULL,
    url_imagen VARCHAR(255) NOT NULL,
    FOREIGN KEY (resena_id) REFERENCES resenas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla para tokens de recuperación de contraseña
CREATE TABLE tokens_recuperacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMP NOT NULL,
    usado BOOLEAN DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla para guardar los pagos de PayPal
CREATE TABLE pagos_paypal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    paypal_order_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(50),
    payer_email VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla de información de la tienda
CREATE TABLE informacion_tienda (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slogan TEXT,
    descripcion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    horario TEXT,
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    whatsapp VARCHAR(20),
    logo_url VARCHAR(255),
    banner_principal_url VARCHAR(255)
) ENGINE=InnoDB;

-- Índices para mejorar el rendimiento
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_destacado ON productos(destacado);
CREATE INDEX idx_items_carrito_usuario ON items_carrito(usuario_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_resenas_producto ON resenas(producto_id);
CREATE INDEX idx_imagenes_productos ON imagenes_productos(producto_id);
CREATE INDEX idx_direcciones_usuario ON direcciones_envio(usuario_id);
CREATE INDEX idx_paypal_order_id ON pagos_paypal(paypal_order_id);
CREATE INDEX idx_paypal_pedido_id ON pagos_paypal(pedido_id);