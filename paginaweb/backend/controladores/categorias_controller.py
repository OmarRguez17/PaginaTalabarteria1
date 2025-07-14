import os
from datetime import datetime
from werkzeug.utils import secure_filename
from backend.DB.db_manager import execute_query

class CategoriasController:
    """Controlador para gestión de categorías en el dashboard admin"""
    
    def __init__(self):
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        # Configurar la ruta de uploads relativa al proyecto
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.upload_folder = os.path.join(self.base_dir, 'uploads')
        
        # Crear carpeta de uploads si no existe
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
        
        # Crear subcarpeta de categorías si no existe
        categories_folder = os.path.join(self.upload_folder, 'categories')
        if not os.path.exists(categories_folder):
            os.makedirs(categories_folder)
    
    def get_categorias_data(self):
        """Obtiene datos de categorías para el dashboard
        
        Returns:
            dict: Datos para la vista de categorías
        """
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Obtener todas las categorías con sus relaciones
        categorias = execute_query(
            """
            SELECT c1.*, c2.nombre as categoria_padre_nombre,
                   (SELECT COUNT(*) FROM productos WHERE categoria_id = c1.id) as total_productos
            FROM categorias c1
            LEFT JOIN categorias c2 ON c1.categoria_padre_id = c2.id
            ORDER BY c1.orden_visualizacion, c1.nombre
            """
        ) or []
        
        # Organizar categorías en estructura jerárquica
        categorias_organizadas = self._organizar_categorias_jerarquicas(categorias)
        
        # Obtener categorías para el selector de categoría padre
        categorias_selector = execute_query(
            "SELECT id, nombre FROM categorias WHERE activo = 1 ORDER BY nombre"
        ) or []
        
        # Preparar datos para la vista
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'categorias': categorias_organizadas,
            'categorias_planas': categorias,
            'categorias_selector': categorias_selector,
            'total_categorias': len(categorias)
        }
        
        return data
    
    def _organizar_categorias_jerarquicas(self, categorias):
        """Organiza las categorías en estructura jerárquica
        
        Args:
            categorias (list): Lista plana de categorías
            
        Returns:
            list: Categorías organizadas jerárquicamente
        """
        # Inicializar subcategorías para todas las categorías
        for categoria in categorias:
            categoria['subcategorias'] = []
        
        # Crear diccionario para acceso rápido
        categorias_dict = {cat['id']: cat for cat in categorias}
        
        # Inicializar la lista de categorías de nivel superior
        categorias_jerarquicas = []
        
        # Agregar subcategorías a sus padres
        for categoria in categorias:
            if categoria['categoria_padre_id'] is None:
                categorias_jerarquicas.append(categoria)
            else:
                padre_id = categoria['categoria_padre_id']
                if padre_id in categorias_dict:
                    categorias_dict[padre_id]['subcategorias'].append(categoria)
        
        return categorias_jerarquicas
    
    def get_categoria_by_id(self, categoria_id):
        """Obtiene una categoría por su ID
        
        Args:
            categoria_id (int): ID de la categoría
            
        Returns:
            dict: Datos de la categoría
        """
        categoria = execute_query(
            """
            SELECT c1.*, c2.nombre as categoria_padre_nombre
            FROM categorias c1
            LEFT JOIN categorias c2 ON c1.categoria_padre_id = c2.id
            WHERE c1.id = %s
            """,
            (categoria_id,),
            fetchone=True
        )
        
        if categoria:
            # Obtener subcategorías
            subcategorias = execute_query(
                "SELECT id, nombre FROM categorias WHERE categoria_padre_id = %s",
                (categoria_id,)
            ) or []
            
            categoria['subcategorias'] = subcategorias
            
            # Convertir valores booleanos
            categoria['activo'] = bool(categoria.get('activo', 0))
        
        return categoria
    
    def crear_categoria(self, data, file):
        """Crea una nueva categoría
        
        Args:
            data (dict): Datos de la categoría
            file: Archivo de imagen (opcional)
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar datos requeridos
            if not data.get('nombre'):
                return {'success': False, 'message': 'El nombre es requerido'}
            
            # Procesar imagen si se proporciona
            url_imagen = None
            if file and self._allowed_file(file.filename):
                url_imagen = self._procesar_imagen(file)
            
            # Preparar datos para insertar
            categoria_data = {
                'nombre': data.get('nombre'),
                'descripcion': data.get('descripcion', ''),
                'categoria_padre_id': data.get('categoria_padre_id') or None,
                'activo': bool(data.get('activo', True)),
                'orden_visualizacion': int(data.get('orden_visualizacion', 0)),
                'url_imagen': url_imagen
            }
            
            # Insertar categoría
            columns = ', '.join(categoria_data.keys())
            placeholders = ', '.join(['%s'] * len(categoria_data))
            values = tuple(categoria_data.values())
            
            result = execute_query(
                f"INSERT INTO categorias ({columns}) VALUES ({placeholders})",
                values,
                commit=True
            )
            
            if not result:
                return {'success': False, 'message': 'Error al crear la categoría'}
            
            return {'success': True, 'message': 'Categoría creada exitosamente'}
            
        except Exception as e:
            print(f"Error creando categoría: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def actualizar_categoria(self, categoria_id, data, file=None):
        """Actualiza una categoría existente
        
        Args:
            categoria_id (int): ID de la categoría
            data (dict): Datos actualizados
            file: Nueva imagen (opcional)
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Verificar si la categoría existe
            exists = execute_query(
                "SELECT id, url_imagen FROM categorias WHERE id = %s",
                (categoria_id,),
                fetchone=True
            )
            
            if not exists:
                return {'success': False, 'message': 'Categoría no encontrada'}
            
            # Validar que no se asigne como padre a sí misma
            if data.get('categoria_padre_id') and int(data.get('categoria_padre_id')) == categoria_id:
                return {'success': False, 'message': 'Una categoría no puede ser su propia categoría padre'}
            
            # Procesar nueva imagen si se proporciona
            url_imagen = exists.get('url_imagen')
            if file and self._allowed_file(file.filename):
                # Eliminar imagen anterior si existe
                if url_imagen:
                    self._eliminar_archivo_imagen(url_imagen)
                url_imagen = self._procesar_imagen(file)
            
            # Preparar datos para actualizar
            update_data = {
                'nombre': data.get('nombre'),
                'descripcion': data.get('descripcion', ''),
                'categoria_padre_id': data.get('categoria_padre_id') or None,
                'activo': bool(data.get('activo', True)),
                'orden_visualizacion': int(data.get('orden_visualizacion', 0)),
                'url_imagen': url_imagen
            }
            
            # Construir query de actualización
            set_clause = ', '.join([f"{k} = %s" for k in update_data.keys()])
            values = list(update_data.values()) + [categoria_id]
            
            execute_query(
                f"UPDATE categorias SET {set_clause} WHERE id = %s",
                values,
                commit=True
            )
            
            return {'success': True, 'message': 'Categoría actualizada exitosamente'}
            
        except Exception as e:
            print(f"Error actualizando categoría: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def eliminar_categoria(self, categoria_id):
        """Elimina una categoría
        
        Args:
            categoria_id (int): ID de la categoría
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Verificar si la categoría existe
            categoria = execute_query(
                "SELECT id, url_imagen FROM categorias WHERE id = %s",
                (categoria_id,),
                fetchone=True
            )
            
            if not categoria:
                return {'success': False, 'message': 'Categoría no encontrada'}
            
            # Verificar si tiene subcategorías
            subcategorias = execute_query(
                "SELECT COUNT(*) as total FROM categorias WHERE categoria_padre_id = %s",
                (categoria_id,),
                fetchone=True
            )
            
            if subcategorias and subcategorias.get('total', 0) > 0:
                return {'success': False, 'message': 'No se puede eliminar una categoría que tiene subcategorías'}
            
            # Verificar si tiene productos asociados
            productos = execute_query(
                "SELECT COUNT(*) as total FROM productos WHERE categoria_id = %s",
                (categoria_id,),
                fetchone=True
            )
            
            if productos and productos.get('total', 0) > 0:
                return {'success': False, 'message': 'No se puede eliminar una categoría que tiene productos asociados'}
            
            # Eliminar imagen si existe
            if categoria.get('url_imagen'):
                self._eliminar_archivo_imagen(categoria.get('url_imagen'))
            
            # Eliminar la categoría
            execute_query(
                "DELETE FROM categorias WHERE id = %s",
                (categoria_id,),
                commit=True
            )
            
            return {'success': True, 'message': 'Categoría eliminada exitosamente'}
            
        except Exception as e:
            print(f"Error eliminando categoría: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def actualizar_estado_categoria(self, categoria_id, activo):
        """Actualiza el estado activo/inactivo de una categoría
        
        Args:
            categoria_id (int): ID de la categoría
            activo (bool): Nuevo estado
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            execute_query(
                "UPDATE categorias SET activo = %s WHERE id = %s",
                (activo, categoria_id),
                commit=True
            )
            
            return {'success': True, 'message': 'Estado actualizado correctamente'}
            
        except Exception as e:
            print(f"Error actualizando estado: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def _procesar_imagen(self, file):
        """Procesa y guarda la imagen de una categoría
        
        Args:
            file: Archivo de imagen
            
        Returns:
            str: URL de la imagen guardada
        """
        categories_folder = os.path.join(self.upload_folder, 'categories')
        
        # Generar nombre seguro para el archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        new_filename = f"{name}_{timestamp}{ext}"
        
        # Guardar archivo
        file_path = os.path.join(categories_folder, new_filename)
        file.save(file_path)
        
        # Retornar URL relativa
        return f"/uploads/categories/{new_filename}"
    
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