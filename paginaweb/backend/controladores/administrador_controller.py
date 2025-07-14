import os
import datetime
import json
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query, check_database_exists, create_database

class AdministradorController:
    """Controlador para el panel de administración de Talabartería Rodríguez"""
    
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
    
    def get_admin_data(self, admin_id):
        """Obtiene los datos necesarios para el panel de administración
        
        Args:
            admin_id (int): ID del administrador que ha iniciado sesión
            
        Returns:
            dict: Datos para el panel de administración
        """
        # Obtener información del administrador
        admin_info = execute_query(
            """
            SELECT u.id, u.nombre, u.apellidos, u.correo, a.rol
            FROM administradores a
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.usuario_id = %s
            """,
            (admin_id,),
            fetchone=True
        )
        
        if not admin_info:
            return None
        
        # Obtener información general de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Obtener estadísticas generales
        stats = self.get_dashboard_stats()
        
        # Combinar todos los datos
        data = {
            'admin': admin_info,
            'tienda': tienda_info,
            'stats': stats,
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'company_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'version': '1.0.0',
            'logo_url': tienda_info.get('logo_url', '')
        }
        
        return data
    
    def get_dashboard_stats(self):
        """Obtiene estadísticas para el dashboard
        
        Returns:
            dict: Estadísticas para el dashboard
        """
        # Total de productos
        total_productos = execute_query(
            "SELECT COUNT(*) as total FROM productos", 
            fetchone=True
        )
        
        # Total de categorías
        total_categorias = execute_query(
            "SELECT COUNT(*) as total FROM categorias", 
            fetchone=True
        )
        
        # Total de usuarios
        total_usuarios = execute_query(
            "SELECT COUNT(*) as total FROM usuarios", 
            fetchone=True
        )
        
        # Total de pedidos
        total_pedidos = execute_query(
            "SELECT COUNT(*) as total FROM pedidos", 
            fetchone=True
        )
        
        # Pedidos recientes
        pedidos_recientes = execute_query(
            """
            SELECT p.id, p.fecha_pedido, p.monto_total, p.estado, p.estado_pago,
                   u.nombre, u.apellidos
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
            ORDER BY p.fecha_pedido DESC
            LIMIT 5
            """
        )
        
        # Ventas por día (últimos 7 días)
        ventas_por_dia = execute_query(
            """
            SELECT DATE(fecha_pedido) as fecha, SUM(monto_total) as total_ventas
            FROM pedidos
            WHERE fecha_pedido >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)
            GROUP BY DATE(fecha_pedido)
            ORDER BY fecha
            """
        )
        
        # Productos más vendidos
        productos_top = execute_query(
            """
            SELECT p.id, p.nombre, p.precio, SUM(ip.cantidad) as total_vendido
            FROM items_pedido ip
            JOIN productos p ON ip.producto_id = p.id
            JOIN pedidos pd ON ip.pedido_id = pd.id
            WHERE pd.estado != 'cancelado'
            GROUP BY p.id
            ORDER BY total_vendido DESC
            LIMIT 5
            """
        )
        
        # Productos con poco stock
        productos_bajo_stock = execute_query(
            """
            SELECT id, nombre, cantidad_stock
            FROM productos
            WHERE cantidad_stock <= 5 AND cantidad_stock > 0 AND activo = 1
            ORDER BY cantidad_stock ASC
            LIMIT 5
            """
        )
        
        # Productos sin stock
        productos_sin_stock = execute_query(
            """
            SELECT COUNT(*) as total
            FROM productos
            WHERE cantidad_stock = 0 AND activo = 1
            """
        )
        
        # Combinar todas las estadísticas
        stats = {
            'total_productos': total_productos['total'] if total_productos else 0,
            'total_categorias': total_categorias['total'] if total_categorias else 0,
            'total_usuarios': total_usuarios['total'] if total_usuarios else 0,
            'total_pedidos': total_pedidos['total'] if total_pedidos else 0,
            'pedidos_recientes': pedidos_recientes,
            'ventas_por_dia': ventas_por_dia,
            'productos_top': productos_top,
            'productos_bajo_stock': productos_bajo_stock,
            'productos_sin_stock': productos_sin_stock['total'] if productos_sin_stock else 0,
        }
        
        return stats
    
    def get_productos_admin(self, filtros=None, pagina=1, items_por_pagina=20):
        """Obtiene la lista de productos para administración
        
        Args:
            filtros (dict, optional): Filtros para la búsqueda
            pagina (int, optional): Número de página
            items_por_pagina (int, optional): Ítems por página
            
        Returns:
            dict: Datos de productos y paginación
        """
        # Calcular offset para paginación
        offset = (pagina - 1) * items_por_pagina
        
        # Construir cláusula WHERE
        where_clauses = []
        params = []
        
        if filtros:
            if filtros.get('nombre'):
                where_clauses.append("p.nombre LIKE %s")
                params.append(f"%{filtros['nombre']}%")
            
            if filtros.get('categoria_id'):
                where_clauses.append("p.categoria_id = %s")
                params.append(filtros['categoria_id'])
            
            if filtros.get('activo') is not None:
                where_clauses.append("p.activo = %s")
                params.append(filtros['activo'])
            
            if filtros.get('destacado') is not None:
                where_clauses.append("p.destacado = %s")
                params.append(filtros['destacado'])
            
            if filtros.get('nuevo') is not None:
                where_clauses.append("p.nuevo = %s")
                params.append(filtros['nuevo'])
        
        # Construir consulta base
        query = """
            SELECT p.id, p.nombre, p.precio, p.precio_descuento, p.cantidad_stock,
                   p.activo, p.destacado, p.nuevo, p.fecha_creacion,
                   c.nombre as categoria_nombre, 
                   (SELECT url_imagen FROM imagenes_productos WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
        """
        
        # Añadir cláusulas WHERE si existen
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Añadir ordenación
        query += " ORDER BY p.fecha_creacion DESC"
        
        # Añadir paginación
        query += " LIMIT %s OFFSET %s"
        params.extend([items_por_pagina, offset])
        
        # Ejecutar consulta
        productos = execute_query(query, params)
        
        # Obtener total de productos para paginación
        query_count = """
            SELECT COUNT(*) as total
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
        """
        
        if where_clauses:
            query_count += " WHERE " + " AND ".join(where_clauses)
        
        total = execute_query(query_count, params[:-2], fetchone=True)
        
        # Calcular datos de paginación
        total_productos = total['total'] if total else 0
        total_paginas = (total_productos + items_por_pagina - 1) // items_por_pagina
        
        # Devolver resultado
        return {
            'productos': productos,
            'paginacion': {
                'total': total_productos,
                'pagina_actual': pagina,
                'items_por_pagina': items_por_pagina,
                'total_paginas': total_paginas
            }
        }
    
    def get_categorias_admin(self):
        """Obtiene la lista de categorías para administración
        
        Returns:
            list: Lista de categorías
        """
        # Obtener todas las categorías
        categorias = execute_query(
            """
            SELECT c.id, c.nombre, c.descripcion, c.url_imagen, c.activo,
                   c.categoria_padre_id, p.nombre as categoria_padre_nombre,
                   (SELECT COUNT(*) FROM productos WHERE categoria_id = c.id) as productos_count
            FROM categorias c
            LEFT JOIN categorias p ON c.categoria_padre_id = p.id
            ORDER BY c.nombre ASC
            """
        )
        
        return categorias
    
    def get_pedidos_admin(self, filtros=None, pagina=1, items_por_pagina=20):
        """Obtiene la lista de pedidos para administración
        
        Args:
            filtros (dict, optional): Filtros para la búsqueda
            pagina (int, optional): Número de página
            items_por_pagina (int, optional): Ítems por página
            
        Returns:
            dict: Datos de pedidos y paginación
        """
        # Calcular offset para paginación
        offset = (pagina - 1) * items_por_pagina
        
        # Construir cláusula WHERE
        where_clauses = []
        params = []
        
        if filtros:
            if filtros.get('estado'):
                where_clauses.append("p.estado = %s")
                params.append(filtros['estado'])
            
            if filtros.get('estado_pago'):
                where_clauses.append("p.estado_pago = %s")
                params.append(filtros['estado_pago'])
            
            if filtros.get('fecha_desde'):
                where_clauses.append("p.fecha_pedido >= %s")
                params.append(filtros['fecha_desde'])
            
            if filtros.get('fecha_hasta'):
                where_clauses.append("p.fecha_pedido <= %s")
                params.append(filtros['fecha_hasta'])
            
            if filtros.get('cliente'):
                where_clauses.append("(u.nombre LIKE %s OR u.apellidos LIKE %s OR u.correo LIKE %s)")
                busqueda = f"%{filtros['cliente']}%"
                params.extend([busqueda, busqueda, busqueda])
        
        # Construir consulta base
        query = """
            SELECT p.id, p.fecha_pedido, p.monto_total, p.estado, p.estado_pago,
                   p.metodo_pago, p.metodo_envio, p.costo_envio, p.numero_seguimiento,
                   u.id as usuario_id, u.nombre, u.apellidos, u.correo
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
        """
        
        # Añadir cláusulas WHERE si existen
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Añadir ordenación
        query += " ORDER BY p.fecha_pedido DESC"
        
        # Añadir paginación
        query += " LIMIT %s OFFSET %s"
        params.extend([items_por_pagina, offset])
        
        # Ejecutar consulta
        pedidos = execute_query(query, params)
        
        # Obtener total de pedidos para paginación
        query_count = """
            SELECT COUNT(*) as total
            FROM pedidos p
            JOIN usuarios u ON p.usuario_id = u.id
        """
        
        if where_clauses:
            query_count += " WHERE " + " AND ".join(where_clauses)
        
        total = execute_query(query_count, params[:-2], fetchone=True)
        
        # Calcular datos de paginación
        total_pedidos = total['total'] if total else 0
        total_paginas = (total_pedidos + items_por_pagina - 1) // items_por_pagina
        
        # Devolver resultado
        return {
            'pedidos': pedidos,
            'paginacion': {
                'total': total_pedidos,
                'pagina_actual': pagina,
                'items_por_pagina': items_por_pagina,
                'total_paginas': total_paginas
            }
        }
    
    def get_usuarios_admin(self, filtros=None, pagina=1, items_por_pagina=20):
        """Obtiene la lista de usuarios para administración
        
        Args:
            filtros (dict, optional): Filtros para la búsqueda
            pagina (int, optional): Número de página
            items_por_pagina (int, optional): Ítems por página
            
        Returns:
            dict: Datos de usuarios y paginación
        """
        # Calcular offset para paginación
        offset = (pagina - 1) * items_por_pagina
        
        # Construir cláusula WHERE
        where_clauses = []
        params = []
        
        if filtros:
            if filtros.get('busqueda'):
                where_clauses.append("(u.nombre LIKE %s OR u.apellidos LIKE %s OR u.correo LIKE %s)")
                busqueda = f"%{filtros['busqueda']}%"
                params.extend([busqueda, busqueda, busqueda])
            
            if filtros.get('activo') is not None:
                where_clauses.append("u.activo = %s")
                params.append(filtros['activo'])
            
            if filtros.get('is_admin') is not None:
                if filtros['is_admin']:
                    where_clauses.append("a.id IS NOT NULL")
                else:
                    where_clauses.append("a.id IS NULL")
        
        # Construir consulta base
        query = """
            SELECT u.id, u.nombre, u.apellidos, u.correo, u.telefono, 
                   u.fecha_registro, u.ultimo_acceso, u.activo,
                   a.id as admin_id, a.rol as admin_rol,
                   (SELECT COUNT(*) FROM pedidos WHERE usuario_id = u.id) as total_pedidos
            FROM usuarios u
            LEFT JOIN administradores a ON u.id = a.usuario_id
        """
        
        # Añadir cláusulas WHERE si existen
        if where_clauses:
            query += " WHERE " + " AND ".join(where_clauses)
        
        # Añadir ordenación
        query += " ORDER BY u.fecha_registro DESC"
        
        # Añadir paginación
        query += " LIMIT %s OFFSET %s"
        params.extend([items_por_pagina, offset])
        
        # Ejecutar consulta
        usuarios = execute_query(query, params)
        
        # Obtener total de usuarios para paginación
        query_count = """
            SELECT COUNT(*) as total
            FROM usuarios u
            LEFT JOIN administradores a ON u.id = a.usuario_id
        """
        
        if where_clauses:
            query_count += " WHERE " + " AND ".join(where_clauses)
        
        total = execute_query(query_count, params[:-2], fetchone=True)
        
        # Calcular datos de paginación
        total_usuarios = total['total'] if total else 0
        total_paginas = (total_usuarios + items_por_pagina - 1) // items_por_pagina
        
        # Devolver resultado
        return {
            'usuarios': usuarios,
            'paginacion': {
                'total': total_usuarios,
                'pagina_actual': pagina,
                'items_por_pagina': items_por_pagina,
                'total_paginas': total_paginas
            }
        }
    
    def crear_actualizar_producto(self, datos, producto_id=None):
        """Crea o actualiza un producto
        
        Args:
            datos (dict): Datos del producto
            producto_id (int, optional): ID del producto a actualizar
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar datos básicos
            if not datos.get('nombre') or not datos.get('precio'):
                return {
                    'success': False,
                    'message': 'Falta información básica del producto (nombre, precio)'
                }
            
            # Preparar datos para inserción/actualización
            producto_data = {
                'nombre': datos.get('nombre'),
                'descripcion': datos.get('descripcion'),
                'descripcion_detallada': datos.get('descripcion_detallada'),
                'precio': float(datos.get('precio')),
                'categoria_id': datos.get('categoria_id') or None,
                'cantidad_stock': int(datos.get('cantidad_stock', 0)),
                'sku': datos.get('sku'),
                'material': datos.get('material'),
                'peso': float(datos.get('peso', 0)) if datos.get('peso') else None,
                'dimensiones': datos.get('dimensiones'),
                'destacado': 1 if datos.get('destacado') else 0,
                'nuevo': 1 if datos.get('nuevo') else 0,
                'activo': 1 if datos.get('activo') else 0,
            }
            
            # Calcular precio con descuento si aplica
            if datos.get('porcentaje_descuento') and float(datos.get('porcentaje_descuento')) > 0:
                porcentaje = float(datos.get('porcentaje_descuento'))
                producto_data['porcentaje_descuento'] = porcentaje
                producto_data['precio_descuento'] = round(producto_data['precio'] * (1 - porcentaje / 100), 2)
            else:
                producto_data['porcentaje_descuento'] = None
                producto_data['precio_descuento'] = None
            
            if producto_id:  # Actualizar producto existente
                # Construir consulta de actualización
                update_fields = []
                update_values = []
                
                for key, value in producto_data.items():
                    update_fields.append(f"{key} = %s")
                    update_values.append(value)
                
                # Añadir ID al final de los parámetros
                update_values.append(producto_id)
                
                # Ejecutar actualización
                execute_query(
                    f"UPDATE productos SET {', '.join(update_fields)} WHERE id = %s",
                    update_values
                )
                
                # Verificar resultado
                if execute_query("SELECT id FROM productos WHERE id = %s", (producto_id,), fetchone=True):
                    return {
                        'success': True,
                        'message': 'Producto actualizado exitosamente',
                        'producto_id': producto_id
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Error al actualizar el producto'
                    }
            else:  # Crear nuevo producto
                # Construir consulta de inserción
                fields = list(producto_data.keys())
                placeholders = ", ".join(["%s"] * len(fields))
                
                # Ejecutar inserción
                nuevo_id = execute_query(
                    f"INSERT INTO productos ({', '.join(fields)}) VALUES ({placeholders})",
                    list(producto_data.values()),
                    return_last_id=True
                )
                
                if nuevo_id:
                    return {
                        'success': True,
                        'message': 'Producto creado exitosamente',
                        'producto_id': nuevo_id
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Error al crear el producto'
                    }
        
        except Exception as e:
            print(f"Error al crear/actualizar producto: {str(e)}")
            return {
                'success': False,
                'message': f'Error al procesar el producto: {str(e)}'
            }
    
    def crear_actualizar_categoria(self, datos, categoria_id=None):
        """Crea o actualiza una categoría
        
        Args:
            datos (dict): Datos de la categoría
            categoria_id (int, optional): ID de la categoría a actualizar
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar datos básicos
            if not datos.get('nombre'):
                return {
                    'success': False,
                    'message': 'Falta el nombre de la categoría'
                }
            
            # Preparar datos para inserción/actualización
            categoria_data = {
                'nombre': datos.get('nombre'),
                'descripcion': datos.get('descripcion'),
                'url_imagen': datos.get('url_imagen'),
                'categoria_padre_id': datos.get('categoria_padre_id') if datos.get('categoria_padre_id') else None,
                'activo': 1 if datos.get('activo') else 0,
                'orden_visualizacion': datos.get('orden_visualizacion', 0)
            }
            
            if categoria_id:  # Actualizar categoría existente
                # Verificar que no esté seleccionando como padre a sí misma
                if categoria_data['categoria_padre_id'] == categoria_id:
                    return {
                        'success': False,
                        'message': 'Una categoría no puede ser padre de sí misma'
                    }
                
                # Construir consulta de actualización
                update_fields = []
                update_values = []
                
                for key, value in categoria_data.items():
                    update_fields.append(f"{key} = %s")
                    update_values.append(value)
                
                # Añadir ID al final de los parámetros
                update_values.append(categoria_id)
                
                # Ejecutar actualización
                execute_query(
                    f"UPDATE categorias SET {', '.join(update_fields)} WHERE id = %s",
                    update_values
                )
                
                # Verificar resultado
                if execute_query("SELECT id FROM categorias WHERE id = %s", (categoria_id,), fetchone=True):
                    return {
                        'success': True,
                        'message': 'Categoría actualizada exitosamente',
                        'categoria_id': categoria_id
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Error al actualizar la categoría'
                    }
            else:  # Crear nueva categoría
                # Construir consulta de inserción
                fields = list(categoria_data.keys())
                placeholders = ", ".join(["%s"] * len(fields))
                
                # Ejecutar inserción
                nuevo_id = execute_query(
                    f"INSERT INTO categorias ({', '.join(fields)}) VALUES ({placeholders})",
                    list(categoria_data.values()),
                    return_last_id=True
                )
                
                if nuevo_id:
                    return {
                        'success': True,
                        'message': 'Categoría creada exitosamente',
                        'categoria_id': nuevo_id
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Error al crear la categoría'
                    }
        
        except Exception as e:
            print(f"Error al crear/actualizar categoría: {str(e)}")
            return {
                'success': False,
                'message': f'Error al procesar la categoría: {str(e)}'
            }
    
    def actualizar_estado_pedido(self, pedido_id, nuevo_estado, numero_seguimiento=None, notas=None):
        """Actualiza el estado de un pedido
        
        Args:
            pedido_id (int): ID del pedido
            nuevo_estado (str): Nuevo estado del pedido
            numero_seguimiento (str, optional): Número de seguimiento
            notas (str, optional): Notas adicionales
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar que el pedido existe
            pedido = execute_query(
                "SELECT id, estado FROM pedidos WHERE id = %s",
                (pedido_id,),
                fetchone=True
            )
            
            if not pedido:
                return {
                    'success': False,
                    'message': 'El pedido no existe'
                }
            
            # Validar que el estado es válido
            estados_validos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado']
            if nuevo_estado not in estados_validos:
                return {
                    'success': False,
                    'message': 'Estado no válido'
                }
            
            # Preparar datos para actualización
            update_data = {
                'estado': nuevo_estado
            }
            
            if numero_seguimiento:
                update_data['numero_seguimiento'] = numero_seguimiento
            
            if notas:
                update_data['notas'] = notas
            
            # Construir consulta de actualización
            update_fields = []
            update_values = []
            
            for key, value in update_data.items():
                update_fields.append(f"{key} = %s")
                update_values.append(value)
            
            # Añadir ID al final de los parámetros
            update_values.append(pedido_id)
            
            # Ejecutar actualización
            execute_query(
                f"UPDATE pedidos SET {', '.join(update_fields)} WHERE id = %s",
                update_values
            )
            
            return {
                'success': True,
                'message': f'Estado del pedido actualizado a: {nuevo_estado}'
            }
            
        except Exception as e:
            print(f"Error al actualizar estado del pedido: {str(e)}")
            return {
                'success': False,
                'message': f'Error al actualizar el estado del pedido: {str(e)}'
            }
    
    def actualizar_estado_usuario(self, usuario_id, activo):
        """Activa o desactiva un usuario
        
        Args:
            usuario_id (int): ID del usuario
            activo (bool): Si el usuario debe estar activo
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar que el usuario existe
            usuario = execute_query(
                "SELECT id, activo FROM usuarios WHERE id = %s",
                (usuario_id,),
                fetchone=True
            )
            
            if not usuario:
                return {
                    'success': False,
                    'message': 'El usuario no existe'
                }
            
            # Convertir a 0 o 1
            nuevo_estado = 1 if activo else 0
            
            # Actualizar estado
            execute_query(
                "UPDATE usuarios SET activo = %s WHERE id = %s",
                (nuevo_estado, usuario_id)
            )
            
            return {
                'success': True,
                'message': 'Estado del usuario actualizado exitosamente'
            }
            
        except Exception as e:
            print(f"Error al actualizar estado del usuario: {str(e)}")
            return {
                'success': False,
                'message': f'Error al actualizar el estado del usuario: {str(e)}'
            }
    
    def crear_actualizar_administrador(self, usuario_id, rol='admin', admin_id=None):
        """Crea o actualiza un administrador
        
        Args:
            usuario_id (int): ID del usuario
            rol (str, optional): Rol del administrador ('admin' o 'super_admin')
            admin_id (int, optional): ID del administrador a actualizar
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar que el usuario existe
            usuario = execute_query(
                "SELECT id, activo FROM usuarios WHERE id = %s",
                (usuario_id,),
                fetchone=True
            )
            
            if not usuario:
                return {
                    'success': False,
                    'message': 'El usuario no existe'
                }
            
            # Validar que el usuario está activo
            if not usuario.get('activo'):
                return {
                    'success': False,
                    'message': 'No se puede asignar permisos de administrador a un usuario inactivo'
                }
            
            # Validar que el rol es válido
            roles_validos = ['admin', 'super_admin']
            if rol not in roles_validos:
                return {
                    'success': False,
                    'message': 'Rol no válido'
                }
            
            if admin_id:  # Actualizar rol de administrador existente
                # Verificar que el administrador existe
                admin = execute_query(
                    "SELECT id FROM administradores WHERE id = %s",
                    (admin_id,),
                    fetchone=True
                )
                
                if not admin:
                    return {
                        'success': False,
                        'message': 'El administrador no existe'
                    }
                
                # Actualizar rol
                execute_query(
                    "UPDATE administradores SET rol = %s WHERE id = %s",
                    (rol, admin_id)
                )
                
                return {
                    'success': True,
                    'message': 'Rol de administrador actualizado exitosamente'
                }
            else:  # Crear nuevo administrador
                # Verificar si el usuario ya es administrador
                admin_existente = execute_query(
                    "SELECT id FROM administradores WHERE usuario_id = %s",
                    (usuario_id,),
                    fetchone=True
                )
                
                if admin_existente:
                    return {
                        'success': False,
                        'message': 'Este usuario ya es administrador'
                    }
                
                # Crear administrador
                nuevo_id = execute_query(
                    "INSERT INTO administradores (usuario_id, rol) VALUES (%s, %s)",
                    (usuario_id, rol),
                    return_last_id=True
                )
                
                if nuevo_id:
                    return {
                        'success': True,
                        'message': 'Administrador creado exitosamente',
                        'admin_id': nuevo_id
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Error al crear el administrador'
                    }
                
        except Exception as e:
            print(f"Error al crear/actualizar administrador: {str(e)}")
            return {
                'success': False,
                'message': f'Error al procesar el administrador: {str(e)}'
            }
    
    def eliminar_administrador(self, admin_id):
        """Elimina un administrador
        
        Args:
            admin_id (int): ID del administrador
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Verificar que el administrador existe
            admin = execute_query(
                "SELECT id, usuario_id, rol FROM administradores WHERE id = %s",
                (admin_id,),
                fetchone=True
            )
            
            if not admin:
                return {
                    'success': False,
                    'message': 'El administrador no existe'
                }
            
            # No permitir eliminar el último super_admin
            if admin.get('rol') == 'super_admin':
                total_super_admins = execute_query(
                    "SELECT COUNT(*) as total FROM administradores WHERE rol = 'super_admin'",
                    fetchone=True
                )
                
                if total_super_admins and total_super_admins.get('total', 0) <= 1:
                    return {
                        'success': False,
                        'message': 'No se puede eliminar el último super administrador'
                    }
            
            # Eliminar administrador
            execute_query(
                "DELETE FROM administradores WHERE id = %s",
                (admin_id,)
            )
            
            return {
                'success': True,
                'message': 'Administrador eliminado exitosamente'
            }
            
        except Exception as e:
            print(f"Error al eliminar administrador: {str(e)}")
            return {
                'success': False,
                'message': f'Error al eliminar el administrador: {str(e)}'
            }
    
    def actualizar_informacion_tienda(self, datos):
        """Actualiza la información general de la tienda
        
        Args:
            datos (dict): Datos de la tienda
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            # Validar datos básicos
            if not datos.get('nombre'):
                return {
                    'success': False,
                    'message': 'El nombre de la tienda es obligatorio'
                }
            
            # Preparar datos para actualización
            tienda_data = {
                'nombre': datos.get('nombre'),
                'slogan': datos.get('slogan'),
                'descripcion': datos.get('descripcion'),
                'telefono': datos.get('telefono'),
                'email': datos.get('email'),
                'direccion': datos.get('direccion'),
                'horario': datos.get('horario'),
                'facebook': datos.get('facebook'),
                'instagram': datos.get('instagram'),
                'whatsapp': datos.get('whatsapp'),
                'logo_url': datos.get('logo_url'),
                'banner_principal_url': datos.get('banner_principal_url')
            }
            
            # Verificar si ya existe información
            info_actual = execute_query(
                "SELECT id FROM informacion_tienda LIMIT 1",
                fetchone=True
            )
            
            if info_actual:  # Actualizar
                # Construir consulta de actualización
                update_fields = []
                update_values = []
                
                for key, value in tienda_data.items():
                    update_fields.append(f"{key} = %s")
                    update_values.append(value)
                
                # Añadir ID al final de los parámetros
                update_values.append(info_actual.get('id'))
                
                # Ejecutar actualización
                execute_query(
                    f"UPDATE informacion_tienda SET {', '.join(update_fields)} WHERE id = %s",
                    update_values
                )
                
                return {
                    'success': True,
                    'message': 'Información de la tienda actualizada exitosamente'
                }
            else:  # Crear
                # Construir consulta de inserción
                fields = list(tienda_data.keys())
                placeholders = ", ".join(["%s"] * len(fields))
                
                # Ejecutar inserción
                nuevo_id = execute_query(
                    f"INSERT INTO informacion_tienda ({', '.join(fields)}) VALUES ({placeholders})",
                    list(tienda_data.values()),
                    return_last_id=True
                )
                
                if nuevo_id:
                    return {
                        'success': True,
                        'message': 'Información de la tienda guardada exitosamente'
                    }
                else:
                    return {
                        'success': False,
                        'message': 'Error al guardar la información de la tienda'
                    }
                
        except Exception as e:
            print(f"Error al actualizar información de tienda: {str(e)}")
            return {
                'success': False,
                'message': f'Error al procesar la información: {str(e)}'
            }