import os
import sys
import json
from datetime import datetime
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query, check_database_exists, create_database

class CarroController:
    """Controlador para la página de carrito de compras de Talabartería Rodríguez"""
    
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
    
    def get_carro_data(self, usuario_id=None):
        """Obtiene los datos para mostrar en la página del carrito"""
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Productos relacionados/recomendados (destacados aleatorios)
        productos_relacionados = execute_query("""
            SELECT p.*, c.nombre as categoria_nombre, 
                    (SELECT url_imagen FROM imagenes_productos 
                    WHERE producto_id = p.id AND es_principal = 1 
                    LIMIT 1) as imagen_principal
            FROM productos p
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE p.destacado = 1 AND p.activo = 1
            ORDER BY RAND()
            LIMIT 4
        """) or []
        
        # Preparar datos base para la vista
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
            'productos_relacionados': productos_relacionados,
        }
        
        # Si el usuario está autenticado, obtener sus datos específicos
        if usuario_id:
            # Obtener direcciones de envío
            direcciones_envio = execute_query("""
                SELECT * FROM direcciones_envio
                WHERE usuario_id = %s
                ORDER BY es_principal DESC, id DESC
            """, (usuario_id,)) or []
            
            # Obtener items del carrito del usuario desde la base de datos
            items_carrito = execute_query("""
                SELECT ic.*, p.nombre, p.precio, p.precio_descuento, c.nombre as categoria_nombre,
                        (SELECT url_imagen FROM imagenes_productos WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) as imagen
                FROM items_carrito ic
                JOIN productos p ON ic.producto_id = p.id
                LEFT JOIN categorias c ON p.categoria_id = c.id
                WHERE ic.usuario_id = %s
            """, (usuario_id,)) or []
            
            # Formatear datos de items del carrito para la interfaz
            items_formateados = []
            for item in items_carrito:
                precio = item['precio_descuento'] if item['precio_descuento'] else item['precio']
                items_formateados.append({
                    'id': str(item['producto_id']),
                    'nombre': item['nombre'],
                    'categoria': item['categoria_nombre'] or 'Sin categoría',
                    'precio': float(precio),
                    'imagen': item['imagen'] or '/publico/imagenes/fijos/logo.png',
                    'cantidad': item['cantidad']
                })
            
            # Añadir datos del usuario a la respuesta
            data['direcciones'] = direcciones_envio
            data['items_carrito'] = items_formateados
            
            # Incluir estos datos en formato JSON para que JavaScript los pueda usar
            data['carrito_data'] = json.dumps(items_formateados)
            
            # Obtener información del usuario
            usuario_info = execute_query(
                "SELECT * FROM usuarios WHERE id = %s", 
                (usuario_id,), 
                fetchone=True
            ) or {}
            
            if usuario_info:
                data['user'] = {
                    'id': usuario_info['id'],
                    'nombre': usuario_info['nombre'],
                    'apellidos': usuario_info['apellidos'],
                    'correo': usuario_info['correo']
                }
        
        return data
    
    def get_items_carrito(self, usuario_id):
        """Obtiene los items del carrito para un usuario específico"""
        if not usuario_id:
            return []
        
        items_carrito = execute_query("""
            SELECT ic.*, p.nombre, p.precio, p.precio_descuento, c.nombre as categoria_nombre,
                    (SELECT url_imagen FROM imagenes_productos WHERE producto_id = p.id AND es_principal = 1 LIMIT 1) as imagen
            FROM items_carrito ic
            JOIN productos p ON ic.producto_id = p.id
            LEFT JOIN categorias c ON p.categoria_id = c.id
            WHERE ic.usuario_id = %s
        """, (usuario_id,)) or []
        
        # Formatear datos para enviar al cliente
        items_formateados = []
        for item in items_carrito:
            precio = item['precio_descuento'] if item['precio_descuento'] else item['precio']
            items_formateados.append({
                'id': str(item['producto_id']),
                'nombre': item['nombre'],
                'categoria': item['categoria_nombre'] or 'Sin categoría',
                'precio': float(precio),
                'imagen': item['imagen'] or '/publico/imagenes/fijos/logo.png',
                'cantidad': item['cantidad']
            })
        
        return items_formateados
    
    def guardar_item_carrito(self, usuario_id, producto_id, cantidad):
        """Guarda un item en el carrito de un usuario autenticado"""
        if not usuario_id or not producto_id:
            return {'success': False, 'message': 'Datos incompletos'}
        
        try:
            # Verificar si el producto existe
            producto = execute_query(
                "SELECT id, precio, precio_descuento, cantidad_stock FROM productos WHERE id = %s AND activo = 1", 
                (producto_id,), 
                fetchone=True
            )
            
            if not producto:
                return {'success': False, 'message': 'Producto no encontrado o no disponible'}
            
            # Verificar stock disponible
            if producto['cantidad_stock'] < cantidad:
                return {'success': False, 'message': 'No hay suficiente stock disponible'}
            
            # Verificar si ya existe en el carrito
            item_existente = execute_query(
                "SELECT * FROM items_carrito WHERE usuario_id = %s AND producto_id = %s", 
                (usuario_id, producto_id), 
                fetchone=True
            )
            
            if item_existente:
                # Actualizar cantidad
                nueva_cantidad = item_existente['cantidad'] + cantidad
                execute_query(
                    "UPDATE items_carrito SET cantidad = %s, fecha_agregado = NOW() WHERE usuario_id = %s AND producto_id = %s", 
                    (nueva_cantidad, usuario_id, producto_id)
                )
            else:
                # Insertar nuevo item
                execute_query(
                    "INSERT INTO items_carrito (usuario_id, producto_id, cantidad) VALUES (%s, %s, %s)", 
                    (usuario_id, producto_id, cantidad)
                )
            
            return {'success': True, 'message': 'Producto añadido al carrito'}
            
        except Exception as e:
            print(f"Error al guardar item en carrito: {str(e)}")
            return {'success': False, 'message': 'Error al guardar en el carrito'}
    
    def actualizar_item_carrito(self, usuario_id, producto_id, cantidad):
        """Actualiza la cantidad de un item en el carrito"""
        if not usuario_id or not producto_id:
            return {'success': False, 'message': 'Datos incompletos'}
        
        try:
            # Verificar stock disponible
            producto = execute_query(
                "SELECT cantidad_stock FROM productos WHERE id = %s AND activo = 1", 
                (producto_id,), 
                fetchone=True
            )
            
            if not producto:
                return {'success': False, 'message': 'Producto no encontrado o no disponible'}
            
            if producto['cantidad_stock'] < cantidad:
                return {'success': False, 'message': 'No hay suficiente stock disponible'}
            
            # Actualizar cantidad
            execute_query(
                "UPDATE items_carrito SET cantidad = %s WHERE usuario_id = %s AND producto_id = %s", 
                (cantidad, usuario_id, producto_id)
            )
            
            return {'success': True, 'message': 'Carrito actualizado'}
            
        except Exception as e:
            print(f"Error al actualizar item en carrito: {str(e)}")
            return {'success': False, 'message': 'Error al actualizar el carrito'}
    
    def eliminar_item_carrito(self, usuario_id, producto_id):
        """Elimina un item del carrito"""
        if not usuario_id or not producto_id:
            return {'success': False, 'message': 'Datos incompletos'}
        
        try:
            execute_query(
                "DELETE FROM items_carrito WHERE usuario_id = %s AND producto_id = %s", 
                (usuario_id, producto_id)
            )
            
            return {'success': True, 'message': 'Producto eliminado del carrito'}
            
        except Exception as e:
            print(f"Error al eliminar item del carrito: {str(e)}")
            return {'success': False, 'message': 'Error al eliminar del carrito'}
    
    def vaciar_carrito(self, usuario_id):
        """Elimina todos los items del carrito de un usuario"""
        if not usuario_id:
            return {'success': False, 'message': 'Usuario no identificado'}
        
        try:
            execute_query(
                "DELETE FROM items_carrito WHERE usuario_id = %s", 
                (usuario_id,)
            )
            
            return {'success': True, 'message': 'Carrito vaciado correctamente'}
            
        except Exception as e:
            print(f"Error al vaciar carrito: {str(e)}")
            return {'success': False, 'message': 'Error al vaciar el carrito'}
    
    def guardar_direccion(self, usuario_id, datos_direccion):
        """Guarda una nueva dirección de envío"""
        if not usuario_id or not datos_direccion:
            return {'success': False, 'message': 'Datos incompletos'}
        
        try:
            # Si es dirección principal, quitar marca de principal de otras direcciones
            if datos_direccion.get('es_principal'):
                execute_query(
                    "UPDATE direcciones_envio SET es_principal = 0 WHERE usuario_id = %s", 
                    (usuario_id,)
                )
            
            # Insertar nueva dirección
            id_direccion = execute_query(
                """
                INSERT INTO direcciones_envio 
                (usuario_id, direccion_linea1, direccion_linea2, ciudad, estado, codigo_postal, pais, es_principal) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, 
                (
                    usuario_id, 
                    datos_direccion['direccion_linea1'], 
                    datos_direccion.get('direccion_linea2', ''), 
                    datos_direccion['ciudad'], 
                    datos_direccion['estado'], 
                    datos_direccion['codigo_postal'], 
                    datos_direccion.get('pais', 'México'), 
                    1 if datos_direccion.get('es_principal') else 0
                ),
                return_last_id=True
            )
            
            return {'success': True, 'message': 'Dirección guardada correctamente', 'id': id_direccion}
            
        except Exception as e:
            print(f"Error al guardar dirección: {str(e)}")
            return {'success': False, 'message': 'Error al guardar la dirección'}
    
    def procesar_pedido(self, datos_pedido):
        """Procesa un nuevo pedido con costos de envío dinámicos"""
        usuario_id = datos_pedido.get('usuario_id')
        direccion_id = datos_pedido.get('direccion_id')
        metodo_envio = datos_pedido.get('metodo_envio')
        items = datos_pedido.get('items', [])
        
        # Si no hay usuario autenticado, permitir compra como invitado
        if not direccion_id and not usuario_id:
            # Guardar dirección temporal para usuarios no autenticados
            direccion_nueva = datos_pedido.get('direccion_nueva')
            if direccion_nueva:
                direccion_id = execute_query(
                    """
                    INSERT INTO direcciones_envio 
                    (usuario_id, direccion_linea1, direccion_linea2, ciudad, estado, codigo_postal, pais) 
                    VALUES (NULL, %s, %s, %s, %s, %s, %s)
                    """, 
                    (
                        direccion_nueva['direccion_linea1'],
                        direccion_nueva.get('direccion_linea2', ''),
                        direccion_nueva['ciudad'],
                        direccion_nueva['estado'],
                        direccion_nueva['codigo_postal'],
                        direccion_nueva.get('pais', 'México')
                    ),
                    return_last_id=True
                )
        
        try:
            # Calcular montos
            subtotal = sum(float(item['precio']) * int(item['cantidad']) for item in items)
            impuestos = subtotal * 0.16
            
            # Calcular costo de envío dinámico
            costo_envio = self._calcular_costo_envio(subtotal, metodo_envio)
            
            # Aplicar cupón si existe
            cupon = datos_pedido.get('cupon')
            if cupon and cupon['tipo'] == 'envio_gratis':
                costo_envio = 0
            
            # Calcular total
            monto_total = subtotal + impuestos + costo_envio
            
            # Insertar el pedido (usuario_id puede ser NULL para invitados)
            pedido_id = execute_query(
                """
                INSERT INTO pedidos 
                (usuario_id, estado, monto_total, direccion_envio_id, metodo_envio, costo_envio, metodo_pago, estado_pago, notas) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, 
                (
                    usuario_id or None,  # NULL si no hay usuario
                    'pendiente', 
                    monto_total, 
                    direccion_id, 
                    metodo_envio, 
                    costo_envio,
                    'tarjeta', 
                    'pendiente',
                    f'Costo de envío: ${costo_envio:.2f}'
                ),
                return_last_id=True
            )
            
            # Insertar items del pedido
            for item in items:
                execute_query(
                    """
                    INSERT INTO items_pedido 
                    (pedido_id, producto_id, cantidad, precio_unitario, precio_total) 
                    VALUES (%s, %s, %s, %s, %s)
                    """, 
                    (
                        pedido_id, 
                        item['id'], 
                        item['cantidad'], 
                        item['precio'], 
                        float(item['precio']) * int(item['cantidad'])
                    )
                )
            
            # Si hay usuario autenticado, vaciar su carrito
            if usuario_id:
                execute_query("DELETE FROM items_carrito WHERE usuario_id = %s", (usuario_id,))
            
            return {
                'success': True, 
                'message': 'Pedido procesado correctamente',
                'pedido_id': pedido_id,
                'costo_envio': costo_envio
            }
            
        except Exception as e:
            print(f"Error al procesar pedido: {str(e)}")
            return {'success': False, 'message': 'Error al procesar el pedido'}
    
    def _calcular_costo_envio(self, subtotal, metodo_envio):
        """Calcula el costo de envío dinámico basado en el subtotal"""
        # Tabla de costos base según rango de subtotal
        costo_base = 0
        
        if subtotal <= 500:
            costo_base = 80
        elif subtotal <= 1000:
            costo_base = 120
        elif subtotal <= 2000:
            costo_base = 150
        elif subtotal <= 5000:
            costo_base = 200
        else:
            # Para compras mayores a $5000, el envío base es gratuito
            costo_base = 0
        
        # Multiplicar por factor según método de envío
        if metodo_envio == 'express':
            costo_base = costo_base * 1.5  # 50% más para envío express
        
        return costo_base
    
    def verificar_cupon(self, codigo_cupon):
        """Verifica si un cupón es válido y devuelve sus detalles"""
        # En una implementación real, esto buscaría en una tabla de cupones
        # Por ahora, simularemos algunos cupones estáticos
        cupones_validos = {
            'PROMO10': {
                'tipo': 'porcentaje',
                'valor': 10,  # 10% de descuento
                'valido': True
            },
            'ENVIOGRATIS': {
                'tipo': 'envio_gratis',
                'valor': 0,
                'valido': True
            }
        }
        
        if codigo_cupon.upper() in cupones_validos:
            return {'success': True, 'data': cupones_validos[codigo_cupon.upper()]}
        
        return {'success': False, 'message': 'Cupón no válido'}