import os
import sys
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query, check_database_exists, create_database

class HomeController:
    """Controlador para la página de inicio de Talabartería Rodríguez"""
    
    def __init__(self):
        self._ensure_db_exists()
    
    def _ensure_db_exists(self):
        """Asegura que la base de datos existe y tiene la estructura necesaria"""
        # Verificar si la base de datos existe
        if not check_database_exists():
            print("La base de datos no existe o está incompleta. Creando...")
            if create_database():
                print("Base de datos creada exitosamente")
            else:
                print("Error al crear la base de datos")
    
    def get_home_data(self):
        """Obtiene los datos para mostrar en la página de inicio"""
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Obtener productos destacados
        productos_destacados = execute_query("""
            SELECT p.*, c.nombre as categoria_nombre, 
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.destacado = 1 AND p.activo = 1
            LIMIT 6
        """) or []
        
        # Obtener productos nuevos
        productos_nuevos = execute_query("""
            SELECT p.*, c.nombre as categoria_nombre, 
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.nuevo = 1 AND p.activo = 1
            ORDER BY p.fecha_creacion DESC
            LIMIT 4
        """) or []
        
        # Obtener categorías principales
        categorias = execute_query("""
            SELECT c.id, c.nombre, c.descripcion, c.url_imagen,
                   (SELECT COUNT(*) FROM productos 
                    WHERE categoria_id = c.id OR 
                          categoria_id IN (SELECT id FROM categorias WHERE categoria_padre_id = c.id) 
                    AND activo = 1) as productos_count
            FROM categorias c
            WHERE c.categoria_padre_id IS NULL AND c.activo = 1
            ORDER BY c.orden_visualizacion
            LIMIT 6
        """) or []
        
        # Obtener estadísticas
        total_productos = execute_query(
            "SELECT COUNT(*) as total FROM productos WHERE activo = 1", 
            fetchone=True
        ) or {"total": 0}
        
        total_usuarios = execute_query(
            "SELECT COUNT(*) as total FROM usuarios", 
            fetchone=True
        ) or {"total": 0}
        
        total_pedidos = execute_query(
            "SELECT COUNT(*) as total FROM pedidos WHERE estado = 'entregado'", 
            fetchone=True
        ) or {"total": 0}
        
        # Obtener reseñas recientes
        resenas_recientes = execute_query("""
            SELECT r.*, p.nombre as producto_nombre, u.nombre as usuario_nombre, 
                   u.apellidos as usuario_apellidos,
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as producto_imagen
            FROM resenas r
            JOIN productos p ON r.producto_id = p.id
            JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.aprobada = 1
            ORDER BY r.fecha_publicacion DESC
            LIMIT 3
        """) or []
        
        # Datos para mostrar en la página de inicio
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'company_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'version': '1.0.0',
            'slogan': tienda_info.get('slogan', 'LAS MEJORES MONTURAS AL MEJOR PRECIO'),
            'descripcion': tienda_info.get('descripcion', ''),
            'direccion': tienda_info.get('direccion', 'INDEPENDENCIA #317 EN COCULA JALISCO'),
            'telefono': tienda_info.get('telefono', ''),
            'email': tienda_info.get('email', ''),
            'horario': tienda_info.get('horario', ''),
            'facebook': tienda_info.get('facebook', ''),
            'instagram': tienda_info.get('instagram', ''),
            'whatsapp': tienda_info.get('whatsapp', ''),
            'logo_url': tienda_info.get('logo_url', ''),
            'banner_principal_url': tienda_info.get('banner_principal_url', ''),
            'productos_destacados': productos_destacados,
            'productos_nuevos': productos_nuevos,
            'categorias': categorias,
            'resenas_recientes': resenas_recientes,
            'stats': {
                'productos': total_productos.get('total', 0),
                'clientes': total_usuarios.get('total', 0),
                'pedidos_completados': total_pedidos.get('total', 0)
            }
        }
        
        return data