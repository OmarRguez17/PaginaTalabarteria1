import os
import json
from datetime import datetime
from werkzeug.utils import secure_filename
from backend.DB.db_manager import execute_query

class ProductosController:
    """Controlador para gestión de productos en el dashboard admin"""
    
    def __init__(self):
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        # Configurar la ruta de uploads relativa al proyecto
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.upload_folder = os.path.join(self.base_dir, 'uploads')
        
        # Crear carpeta de uploads si no existe
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
        
        # Crear subcarpeta de productos si no existe
        products_folder = os.path.join(self.upload_folder, 'products')
        if not os.path.exists(products_folder):
            os.makedirs(products_folder)
    
    def get_productos_data(self, page=1, per_page=10):
        """Obtiene datos de productos para el dashboard
        
        Args:
            page (int): Página actual
            per_page (int): Productos por página
            
        Returns:
            dict: Datos para la vista de productos
        """
        # Offset para paginación
        offset = (page - 1) * per_page
        
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Obtener categorías para filtros
        categorias = execute_query(
            "SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre"
        ) or []
        
        # Contar total de productos
        total_count = execute_query(
            "SELECT COUNT(*) as total FROM productos",
            fetchone=True
        )
        total_productos = total_count.get('total', 0) if total_count else 0
        
        # Calcular páginas totales
        total_pages = (total_productos + per_page - 1) // per_page
        
        # Obtener productos con paginación
        productos = execute_query(
            """
            SELECT p.*, c.nombre as categoria_nombre, p.categoria_id,
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) as imagen_principal,
                   CASE 
                       WHEN p.precio_descuento IS NOT NULL THEN 
                           ROUND(((p.precio - p.precio_descuento) / p.precio) * 100)
                       ELSE 0 
                   END as porcentaje_descuento
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            ORDER BY p.id DESC
            LIMIT %s OFFSET %s
            """,
            (per_page, offset)
        ) or []
        
        # Preparar datos para la vista
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'productos': productos,
            'categorias': categorias,
            'total_productos': total_productos,
            'current_page': page,
            'total_pages': total_pages,
            'per_page': per_page
        }
        
        return data
    
    def get_producto_by_id(self, producto_id):
        """Obtiene un producto por su ID
        
        Args:
            producto_id (int): ID del producto
            
        Returns:
            dict: Datos del producto
        """
        try:
            # Obtener producto
            producto = execute_query(
                """
                SELECT p.*, c.nombre as categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE p.id = %s
                """,
                (producto_id,),
                fetchone=True
            )
            
            if not producto:
                return None
            
            # Obtener imágenes del producto - OPCIONAL, no bloqueante
            try:
                imagenes = execute_query(
                    """
                    SELECT id, url_imagen, es_principal, orden_visualizacion
                    FROM imagenes_productos
                    WHERE producto_id = %s
                    ORDER BY es_principal DESC, orden_visualizacion
                    """,
                    (producto_id,)
                ) or []
                
                # Verificar que cada imagen tenga datos válidos
                if imagenes:
                    for img in imagenes:
                        if not isinstance(img, dict) or 'url_imagen' not in img:
                            # Si hay algún problema con las imágenes, simplemente usamos una lista vacía
                            imagenes = []
                            break
                
                producto['imagenes'] = imagenes
            except Exception as e:
                print(f"Error obteniendo imágenes del producto (no crítico): {str(e)}")
                # Si hay error con las imágenes, no bloqueamos el resto
                producto['imagenes'] = []
            
            # Convertir valores numéricos según sea necesario
            # Asegurar que los campos numéricos sean del tipo correcto para la serialización
            for key in ['precio', 'precio_descuento', 'cantidad_stock', 'peso']:
                if key in producto and producto[key] is not None:
                    try:
                        producto[key] = float(producto[key])
                    except (ValueError, TypeError):
                        if key in ['cantidad_stock']:
                            producto[key] = 0
                        else:
                            producto[key] = 0.0
            
            # Asegurar que porcentaje_descuento exista
            if 'porcentaje_descuento' not in producto:
                if producto.get('precio') and producto.get('precio_descuento'):
                    try:
                        precio = float(producto['precio'])
                        precio_descuento = float(producto['precio_descuento'])
                        if precio > 0:
                            producto['porcentaje_descuento'] = int(((precio - precio_descuento) / precio) * 100)
                        else:
                            producto['porcentaje_descuento'] = 0
                    except:
                        producto['porcentaje_descuento'] = 0
                else:
                    producto['porcentaje_descuento'] = 0
            
            # Convertir valores booleanos
            for key in ['destacado', 'nuevo', 'activo']:
                if key in producto:
                    producto[key] = bool(producto[key])
            
            return producto
            
        except Exception as e:
            print(f"Error obteniendo producto: {str(e)}")
            # Retornamos un diccionario básico con valores por defecto para evitar errores en el cliente
            return {
                'id': int(producto_id),
                'nombre': 'Error al cargar producto',
                'categoria_id': None,
                'categoria_nombre': 'No disponible',
                'descripcion': 'No se pudo cargar la información del producto',
                'descripcion_detallada': '',
                'precio': 0.0,
                'precio_descuento': None,
                'cantidad_stock': 0,
                'sku': '',
                'destacado': False,
                'nuevo': False,
                'activo': False,
                'imagenes': [],
                'porcentaje_descuento': 0
            }
    
    def crear_producto(self, data, files):
        """Crea un nuevo producto
        
        Args:
            data (dict): Datos del producto
            files (list): Archivos de imágenes
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar datos requeridos
            if not data.get('nombre') or not data.get('precio'):
                return {'success': False, 'message': 'Nombre y precio son requeridos'}
            
            # Preparar datos para insertar
            producto_data = {
                'nombre': data.get('nombre'),
                'categoria_id': data.get('categoria_id') or None,
                'descripcion': data.get('descripcion', ''),
                'descripcion_detallada': data.get('descripcion_detallada', ''),
                'precio': float(data.get('precio', 0)),
                'precio_descuento': float(data.get('precio_descuento')) if data.get('precio_descuento') else None,
                'cantidad_stock': int(data.get('cantidad_stock', 0)),
                'sku': data.get('sku', ''),
                'peso': float(data.get('peso')) if data.get('peso') else None,
                'dimensiones': data.get('dimensiones', ''),
                'material': data.get('material', ''),
                'destacado': bool(data.get('destacado', False)),
                'nuevo': bool(data.get('nuevo', False)),
                'activo': bool(data.get('activo', True))
            }
            
            # Calcular porcentaje de descuento si hay precio de descuento
            if producto_data['precio_descuento'] and producto_data['precio'] > 0:
                producto_data['porcentaje_descuento'] = int(
                    ((producto_data['precio'] - producto_data['precio_descuento']) / 
                     producto_data['precio']) * 100
                )
            
            # Insertar producto
            columns = ', '.join(producto_data.keys())
            placeholders = ', '.join(['%s'] * len(producto_data))
            values = tuple(producto_data.values())
            
            # Usar return_last_id=True para obtener el ID insertado
            producto_id = execute_query(
                f"INSERT INTO productos ({columns}) VALUES ({placeholders})",
                values,
                commit=True,
                return_last_id=True
            )
            
            # Verificar si se obtuvo un ID válido
            if not producto_id or (isinstance(producto_id, dict) and not producto_id.get('success')):
                return {'success': False, 'message': 'Error al crear el producto'}
            
            # Si producto_id es un dict (debido al formato de tu función), extraer el ID
            if isinstance(producto_id, dict):
                producto_id = producto_id.get('lastrowid')
            
            if not producto_id:
                return {'success': False, 'message': 'Error al obtener ID del producto'}
            
            # Procesar imágenes si las hay
            if files:
                self._procesar_imagenes(producto_id, files)
            
            return {
                'success': True, 
                'message': 'Producto creado exitosamente',
                'product_id': producto_id
            }
            
        except Exception as e:
            print(f"Error creando producto: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def actualizar_producto(self, producto_id, data, files=None):
        """Actualiza un producto existente
        
        Args:
            producto_id (int): ID del producto
            data (dict): Datos actualizados
            files (list): Nuevas imágenes (opcional)
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Verificar si el producto existe
            exists = execute_query(
                "SELECT id FROM productos WHERE id = %s",
                (producto_id,),
                fetchone=True
            )
            
            if not exists:
                return {'success': False, 'message': 'Producto no encontrado'}
            
            # Preparar datos para actualizar
            update_data = {
                'nombre': data.get('nombre'),
                'categoria_id': data.get('categoria_id') or None,
                'descripcion': data.get('descripcion', ''),
                'descripcion_detallada': data.get('descripcion_detallada', ''),
                'precio': float(data.get('precio', 0)),
                'precio_descuento': float(data.get('precio_descuento')) if data.get('precio_descuento') else None,
                'cantidad_stock': int(data.get('cantidad_stock', 0)),
                'sku': data.get('sku', ''),
                'peso': float(data.get('peso')) if data.get('peso') else None,
                'dimensiones': data.get('dimensiones', ''),
                'material': data.get('material', ''),
                'destacado': bool(data.get('destacado', False)),
                'nuevo': bool(data.get('nuevo', False)),
                'activo': bool(data.get('activo', True))
            }
            
            # Calcular porcentaje de descuento
            if update_data['precio_descuento'] and update_data['precio'] > 0:
                update_data['porcentaje_descuento'] = int(
                    ((update_data['precio'] - update_data['precio_descuento']) / 
                     update_data['precio']) * 100
                )
            else:
                update_data['porcentaje_descuento'] = None
            
            # Construir query de actualización
            set_clause = ', '.join([f"{k} = %s" for k in update_data.keys()])
            values = list(update_data.values()) + [producto_id]
            
            execute_query(
                f"UPDATE productos SET {set_clause} WHERE id = %s",
                values,
                commit=True
            )
            
            # Procesar nuevas imágenes si las hay
            if files:
                self._procesar_imagenes(producto_id, files)
            
            return {'success': True, 'message': 'Producto actualizado exitosamente'}
            
        except Exception as e:
            print(f"Error actualizando producto: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def eliminar_producto(self, producto_id):
        """Elimina un producto
        
        Args:
            producto_id (int): ID del producto
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Verificar si el producto existe
            producto = execute_query(
                "SELECT id FROM productos WHERE id = %s",
                (producto_id,),
                fetchone=True
            )
            
            if not producto:
                return {'success': False, 'message': 'Producto no encontrado'}
            
            # Verificar si el producto tiene pedidos asociados
            pedidos = execute_query(
                "SELECT COUNT(*) as total FROM items_pedido WHERE producto_id = %s",
                (producto_id,),
                fetchone=True
            )
            
            if pedidos and pedidos.get('total', 0) > 0:
                # En lugar de eliminar, solo desactivar
                execute_query(
                    "UPDATE productos SET activo = 0 WHERE id = %s",
                    (producto_id,),
                    commit=True
                )
                return {'success': True, 'message': 'Producto desactivado (tiene pedidos asociados)'}
            
            # Obtener imágenes para eliminar archivos
            imagenes = execute_query(
                "SELECT url_imagen FROM imagenes_productos WHERE producto_id = %s",
                (producto_id,)
            )
            
            # Eliminar archivos de imágenes
            if imagenes:
                for imagen in imagenes:
                    self._eliminar_archivo_imagen(imagen.get('url_imagen'))
            
            # Eliminar el producto (cascade eliminará las imágenes y relaciones)
            execute_query(
                "DELETE FROM productos WHERE id = %s",
                (producto_id,),
                commit=True
            )
            
            return {'success': True, 'message': 'Producto eliminado exitosamente'}
            
        except Exception as e:
            print(f"Error eliminando producto: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def actualizar_estado_producto(self, producto_id, activo):
        """Actualiza el estado activo/inactivo de un producto
        
        Args:
            producto_id (int): ID del producto
            activo (bool): Nuevo estado
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            execute_query(
                "UPDATE productos SET activo = %s WHERE id = %s",
                (activo, producto_id),
                commit=True
            )
            
            return {'success': True, 'message': 'Estado actualizado correctamente'}
            
        except Exception as e:
            print(f"Error actualizando estado: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def _procesar_imagenes(self, producto_id, files):
        """Procesa y guarda las imágenes de un producto
        
        Args:
            producto_id (int): ID del producto
            files (list): Lista de archivos de imagen
        """
        # Crear carpeta de uploads si no existe
        product_folder = os.path.join(self.upload_folder, 'products', str(producto_id))
        os.makedirs(product_folder, exist_ok=True)
        
        # Verificar si ya hay imágenes principales
        main_image_exists = execute_query(
            "SELECT id FROM imagenes_productos WHERE producto_id = %s AND es_principal = 1",
            (producto_id,),
            fetchone=True
        )
        
        for index, file in enumerate(files):
            if file and self._allowed_file(file.filename):
                # Generar nombre seguro para el archivo
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = secure_filename(file.filename)
                name, ext = os.path.splitext(filename)
                new_filename = f"{name}_{timestamp}{ext}"
                
                # Guardar archivo
                file_path = os.path.join(product_folder, new_filename)
                file.save(file_path)
                
                # URL relativa para la base de datos
                url_imagen = f"/uploads/products/{producto_id}/{new_filename}"
                
                # Primera imagen es principal si no hay ninguna
                es_principal = index == 0 and not main_image_exists
                
                # Insertar en base de datos
                execute_query(
                    """
                    INSERT INTO imagenes_productos 
                    (producto_id, url_imagen, es_principal, orden_visualizacion)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (producto_id, url_imagen, es_principal, index),
                    commit=True
                )
    
    def eliminar_imagen_producto(self, imagen_id):
        """Elimina una imagen específica de un producto
        
        Args:
            imagen_id (int): ID de la imagen
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Obtener información de la imagen
            imagen = execute_query(
                "SELECT url_imagen, producto_id FROM imagenes_productos WHERE id = %s",
                (imagen_id,),
                fetchone=True
            )
            
            if not imagen:
                return {'success': False, 'message': 'Imagen no encontrada'}
            
            # Eliminar archivo físico
            self._eliminar_archivo_imagen(imagen.get('url_imagen'))
            
            # Eliminar de la base de datos
            execute_query(
                "DELETE FROM imagenes_productos WHERE id = %s",
                (imagen_id,),
                commit=True
            )
            
            return {'success': True, 'message': 'Imagen eliminada correctamente'}
            
        except Exception as e:
            print(f"Error eliminando imagen: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def _allowed_file(self, filename):
        """Verifica si el archivo tiene una extensión permitida"""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.allowed_extensions
    
    def _eliminar_archivo_imagen(self, url_imagen):
        """Elimina un archivo de imagen del servidor"""
        if url_imagen:
            # Convertir URL a ruta de archivo
            file_path = url_imagen.replace('/uploads/', '')
            full_path = os.path.join(self.upload_folder, file_path)
            
            if os.path.exists(full_path):
                try:
                    os.remove(full_path)
                except Exception as e:
                    print(f"Error eliminando archivo: {str(e)}")
    
    def buscar_productos(self, query):
        """Busca productos por nombre o SKU
        
        Args:
            query (str): Término de búsqueda
            
        Returns:
            list: Lista de productos encontrados
        """
        search_term = f"%{query}%"
        
        productos = execute_query(
            """
            SELECT p.*, c.nombre as categoria_nombre,
                   (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.nombre LIKE %s OR p.sku LIKE %s
            ORDER BY p.nombre
            LIMIT 20
            """,
            (search_term, search_term)
        )
        
        return productos or []