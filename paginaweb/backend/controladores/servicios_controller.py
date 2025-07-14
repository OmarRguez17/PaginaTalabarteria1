
import os
import sys
import math
from datetime import datetime
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query, check_database_exists, create_database

class ServiciosController:
    """Controlador para la página de servicios/productos de Talabartería Rodríguez"""
    
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
    
    def get_servicios_data(self):
        """Obtiene los datos para mostrar en la página de servicios/productos"""
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Obtener todos los productos activos
        productos = execute_query("""
            SELECT p.*, c.nombre as categoria_nombre, 
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
            ORDER BY p.destacado DESC, p.contador_ventas DESC
        """) or []
        
        # Calcular el precio máximo para el filtro
        precio_max = 10000  # Valor predeterminado
        if productos:
            precios = [float(p['precio_descuento'] if p['precio_descuento'] else p['precio']) for p in productos]
            precio_max = math.ceil(max(precios) / 100) * 100  # Redondear al 100 superior
        
        # Obtener todas las categorías activas
        categorias = execute_query("""
            SELECT c.id, c.nombre, c.descripcion, c.url_imagen,
                   (SELECT COUNT(*) FROM productos 
                    WHERE categoria_id = c.id 
                    AND activo = 1) as productos_count
            FROM categorias c
            WHERE c.activo = 1
            ORDER BY c.orden_visualizacion
        """) or []
        
        # Obtener todos los materiales únicos utilizados en productos
        materiales = execute_query("""
            SELECT DISTINCT material 
            FROM productos 
            WHERE material IS NOT NULL AND material != ''
            ORDER BY material
        """) or []
        
        # Formatear materiales como lista
        materiales_lista = [m['material'] for m in materiales]
        
        # Estadísticas
        total_productos = execute_query(
            "SELECT COUNT(*) as total FROM productos WHERE activo = 1", 
            fetchone=True
        ) or {"total": 0}
        
        total_usuarios = execute_query(
            "SELECT COUNT(*) as total FROM usuarios", 
            fetchone=True
        ) or {"total": 0}
        
        # Datos para mostrar en la página de servicios
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
            'productos': productos,
            'categorias': categorias,
            'materiales': materiales_lista,
            'precio_max': precio_max,
            'stats': {
                'productos': total_productos.get('total', 0),
                'clientes': total_usuarios.get('total', 0),
                'años_experiencia': 30  # Dato fijo para ejemplo, podría ser dinámico
            }
        }
        
        return data
    
    def get_detalle_servicio(self, servicio_id):
        """Obtiene los detalles de un servicio/producto específico"""
        # Verificar parámetro
        if not servicio_id:
            return None
        
        # Obtener detalles del producto
        producto = execute_query("""
            SELECT p.*, c.nombre as categoria_nombre
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id = %s AND p.activo = 1
        """, (servicio_id,), fetchone=True)
        
        if not producto:
            return None
        
        # Obtener imágenes del producto
        imagenes = execute_query("""
            SELECT * FROM imagenes_productos
            WHERE producto_id = %s
            ORDER BY es_principal DESC, orden_visualizacion
        """, (servicio_id,)) or []
        
        # Obtener etiquetas del producto
        etiquetas = execute_query("""
            SELECT e.* FROM productos_etiquetas pe
            JOIN etiquetas e ON pe.etiqueta_id = e.id
            WHERE pe.producto_id = %s
        """, (servicio_id,)) or []
        
        # Obtener reseñas del producto
        resenas = execute_query("""
            SELECT r.*, u.nombre as usuario_nombre, u.apellidos as usuario_apellidos
            FROM resenas r
            JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.producto_id = %s AND r.aprobada = 1
            ORDER BY r.fecha_publicacion DESC
        """, (servicio_id,)) or []
        
        # Calcular promedio de calificaciones
        promedio_calificacion = 0
        if resenas:
            suma_calificaciones = sum(r['calificacion'] for r in resenas)
            promedio_calificacion = round(suma_calificaciones / len(resenas), 1)
        
        # Obtener productos relacionados (misma categoría o etiquetas similares)
        productos_relacionados = execute_query("""
            SELECT p.*, c.nombre as categoria_nombre, 
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.id != %s 
            AND p.activo = 1
            AND (p.categoria_id = %s OR p.id IN (
                SELECT DISTINCT pe1.producto_id
                FROM productos_etiquetas pe1
                JOIN productos_etiquetas pe2 ON pe1.etiqueta_id = pe2.etiqueta_id
                WHERE pe2.producto_id = %s AND pe1.producto_id != %s
            ))
            ORDER BY p.destacado DESC, p.contador_ventas DESC
            LIMIT 4
        """, (servicio_id, producto['categoria_id'], servicio_id, servicio_id)) or []
        
        # Incrementar contador de vistas
        execute_query("""
            UPDATE productos 
            SET contador_vistas = contador_vistas + 1 
            WHERE id = %s
        """, (servicio_id,))
        
        # Datos del producto
        detalle = {
            'producto': producto,
            'imagenes': imagenes,
            'etiquetas': etiquetas,
            'resenas': resenas,
            'promedio_calificacion': promedio_calificacion,
            'productos_relacionados': productos_relacionados
        }
        
        return detalle
    
    def buscar_productos(self, termino, categoria_id=None, precio_max=None, filtros=None, material=None, offset=0, limit=12):
        """Busca productos según criterios"""
        # Construir consulta base
        query = """
            SELECT p.*, c.nombre as categoria_nombre, 
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.activo = 1
        """
        
        params = []
        
        # Añadir condiciones según parámetros
        if termino:
            query += " AND (p.nombre LIKE %s OR p.descripcion LIKE %s)"
            params.extend([f"%{termino}%", f"%{termino}%"])
        
        if categoria_id and categoria_id != 'todas':
            query += " AND p.categoria_id = %s"
            params.append(categoria_id)
        
        if precio_max:
            query += " AND (COALESCE(p.precio_descuento, p.precio) <= %s)"
            params.append(precio_max)
        
        if filtros:
            if filtros.get('descuento'):
                query += " AND p.precio_descuento IS NOT NULL"
            
            if filtros.get('nuevo'):
                query += " AND p.nuevo = 1"
            
            if filtros.get('destacado'):
                query += " AND p.destacado = 1"
        
        if material:
            query += " AND p.material = %s"
            params.append(material)
        
        # Ordenar según criterio
        query += " ORDER BY p.destacado DESC, p.contador_ventas DESC"
        
        # Añadir límite y offset para paginación
        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Ejecutar la consulta
        productos = execute_query(query, params) or []
        
        # Obtener total de resultados (sin límite para paginación)
        count_query = query.split(" ORDER BY ")[0].replace("SELECT p.*, c.nombre", "SELECT COUNT(*)")
        count_query = count_query.split(" LIMIT ")[0]
        
        total_results = execute_query(count_query, params[:-2], fetchone=True)
        total = 0 if not total_results else total_results.get('COUNT(*)', 0)
        
        return {
            'productos': productos,
            'total': total,
            'paginas': math.ceil(total / limit) if limit > 0 else 1
        }
