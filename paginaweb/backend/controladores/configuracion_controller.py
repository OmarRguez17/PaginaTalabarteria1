import os
from datetime import datetime
from werkzeug.utils import secure_filename
from backend.DB.db_manager import execute_query

class ConfiguracionController:
    """Controlador para gestión de configuración de la tienda"""
    
    def __init__(self):
        self.allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        # Configurar la ruta de uploads relativa al proyecto
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.upload_folder = os.path.join(self.base_dir, 'uploads')
        
        # Crear carpeta de uploads si no existe
        if not os.path.exists(self.upload_folder):
            os.makedirs(self.upload_folder)
        
        # Crear subcarpeta de configuración si no existe
        config_folder = os.path.join(self.upload_folder, 'config')
        if not os.path.exists(config_folder):
            os.makedirs(config_folder)
    
    def get_configuracion_data(self):
        """Obtiene datos de configuración para el dashboard
        
        Returns:
            dict: Datos para la vista de configuración
        """
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        )
        
        # Si no existe, crear registro vacío
        if not tienda_info:
            execute_query("""
                INSERT INTO informacion_tienda (nombre, slogan) 
                VALUES (%s, %s)
                """, 
                ('Talabartería Rodríguez', 'Artesanía en cuero de calidad'),
                commit=True
            )
            
            tienda_info = execute_query(
                "SELECT * FROM informacion_tienda LIMIT 1", 
                fetchone=True
            )
        
        # Preparar datos para la vista
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'tienda_info': tienda_info or {}
        }
        
        return data
    
    def actualizar_configuracion(self, data, files):
        """Actualiza la configuración de la tienda
        
        Args:
            data (dict): Datos del formulario
            files (dict): Archivos subidos
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Obtener configuración actual
            current_config = execute_query(
                "SELECT * FROM informacion_tienda LIMIT 1",
                fetchone=True
            ) or {}
            
            # Preparar datos para actualizar
            update_data = {
                'nombre': data.get('nombre', '').strip(),
                'slogan': data.get('slogan', '').strip(),
                'descripcion': data.get('descripcion', '').strip(),
                'telefono': data.get('telefono', '').strip(),
                'email': data.get('email', '').strip(),
                'direccion': data.get('direccion', '').strip(),
                'horario': data.get('horario', '').strip(),
                'facebook': data.get('facebook', '').strip(),
                'instagram': data.get('instagram', '').strip(),
                'whatsapp': data.get('whatsapp', '').strip()
            }
            
            # Validar nombre requerido
            if not update_data['nombre']:
                return {'success': False, 'message': 'El nombre de la tienda es requerido'}
            
            # Procesar logo si se subió
            if 'logo' in files and files['logo'] and files['logo'].filename:
                if self._allowed_file(files['logo'].filename):
                    # Eliminar logo anterior si existe
                    if current_config.get('logo_url'):
                        self._eliminar_archivo_imagen(current_config.get('logo_url'))
                    # Guardar nuevo logo
                    update_data['logo_url'] = self._procesar_imagen(files['logo'], 'logo')
                else:
                    return {'success': False, 'message': 'Formato de logo no permitido'}
            
            # Procesar banner si se subió
            if 'banner' in files and files['banner'] and files['banner'].filename:
                if self._allowed_file(files['banner'].filename):
                    # Eliminar banner anterior si existe
                    if current_config.get('banner_principal_url'):
                        self._eliminar_archivo_imagen(current_config.get('banner_principal_url'))
                    # Guardar nuevo banner
                    update_data['banner_principal_url'] = self._procesar_imagen(files['banner'], 'banner')
                else:
                    return {'success': False, 'message': 'Formato de banner no permitido'}
            
            # Actualizar o insertar configuración
            if current_config:
                # Actualizar registro existente
                set_clause = ', '.join([f"{k} = %s" for k in update_data.keys()])
                values = list(update_data.values()) + [current_config['id']]
                
                execute_query(
                    f"UPDATE informacion_tienda SET {set_clause} WHERE id = %s",
                    values,
                    commit=True
                )
            else:
                # Insertar nuevo registro
                columns = ', '.join(update_data.keys())
                placeholders = ', '.join(['%s'] * len(update_data))
                values = tuple(update_data.values())
                
                execute_query(
                    f"INSERT INTO informacion_tienda ({columns}) VALUES ({placeholders})",
                    values,
                    commit=True
                )
            
            # Obtener datos actualizados
            updated_config = execute_query(
                "SELECT * FROM informacion_tienda LIMIT 1",
                fetchone=True
            )
            
            return {
                'success': True,
                'message': 'Configuración actualizada exitosamente',
                'data': updated_config
            }
            
        except Exception as e:
            print(f"Error actualizando configuración: {str(e)}")
            return {'success': False, 'message': f'Error: {str(e)}'}
    
    def _procesar_imagen(self, file, tipo='imagen'):
        """Procesa y guarda una imagen
        
        Args:
            file: Archivo de imagen
            tipo: Tipo de imagen (logo, banner, etc)
            
        Returns:
            str: URL de la imagen guardada
        """
        config_folder = os.path.join(self.upload_folder, 'config')
        
        # Generar nombre seguro para el archivo
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        new_filename = f"{tipo}_{timestamp}{ext}"
        
        # Guardar archivo
        file_path = os.path.join(config_folder, new_filename)
        file.save(file_path)
        
        # Retornar URL relativa
        return f"/uploads/config/{new_filename}"
    
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