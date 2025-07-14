import os
import sys
from datetime import datetime, timedelta
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query

class DashboardHomeController:
    """Controlador para el dashboard home de Talabartería Rodríguez"""
    
    def __init__(self):
        pass
    
    def get_dashboard_data(self, user_id):
        """Obtiene todos los datos necesarios para mostrar en el dashboard
        
        Args:
            user_id (int): ID del usuario actual
            
        Returns:
            dict: Datos para el dashboard
        """
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Obtener datos del usuario
        user_data = self._get_user_data(user_id)
        
        # Obtener estadísticas del usuario
        stats = self._get_user_stats(user_id)
        
        # Obtener pedidos recientes
        recent_orders = self._get_recent_orders(user_id)
        
        # Obtener productos recomendados
        recommended_products = self._get_recommended_products(user_id)
        
        # Contar items en el carrito
        cart_count = self._get_cart_count(user_id)
        
        # Preparar datos para la vista
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'company_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'user_data': user_data,
            'stats': stats,
            'recent_orders': recent_orders,
            'recommended_products': recommended_products,
            'cart_count': cart_count
        }
        
        return data
    
    def _get_user_data(self, user_id):
        """Obtiene los datos del usuario
        
        Args:
            user_id (int): ID del usuario
            
        Returns:
            dict: Datos del usuario
        """
        user = execute_query(
            """
            SELECT u.id, u.nombre, u.apellidos, u.correo as email, 
                   u.telefono, u.fecha_registro, u.ultimo_acceso,
                   CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END as is_admin,
                   a.rol as admin_role
            FROM usuarios u
            LEFT JOIN administradores a ON u.id = a.usuario_id
            WHERE u.id = %s
            """,
            (user_id,),
            fetchone=True
        )
        
        return user or {}
    
    def _get_user_stats(self, user_id):
        """Obtiene estadísticas del usuario
        
        Args:
            user_id (int): ID del usuario
            
        Returns:
            dict: Estadísticas del usuario
        """
        stats = {}
        
        # Total de pedidos
        total_orders = execute_query(
            "SELECT COUNT(*) as total FROM pedidos WHERE usuario_id = %s",
            (user_id,),
            fetchone=True
        )
        stats['total_orders'] = total_orders.get('total', 0) if total_orders else 0
        
        # Pedidos pendientes
        pending_orders = execute_query(
            """
            SELECT COUNT(*) as total FROM pedidos 
            WHERE usuario_id = %s AND estado IN ('pendiente', 'procesando', 'enviado')
            """,
            (user_id,),
            fetchone=True
        )
        stats['pending_orders'] = pending_orders.get('total', 0) if pending_orders else 0
        
        # Pedidos completados
        completed_orders = execute_query(
            """
            SELECT COUNT(*) as total FROM pedidos 
            WHERE usuario_id = %s AND estado = 'entregado'
            """,
            (user_id,),
            fetchone=True
        )
        stats['completed_orders'] = completed_orders.get('total', 0) if completed_orders else 0
        
        # Total gastado
        total_spent = execute_query(
            """
            SELECT SUM(monto_total) as total FROM pedidos 
            WHERE usuario_id = %s AND estado != 'cancelado'
            """,
            (user_id,),
            fetchone=True
        )
        stats['total_spent'] = float(total_spent.get('total', 0)) if total_spent and total_spent.get('total') else 0
        
        return stats
    
    def _get_recent_orders(self, user_id, limit=5):
        """Obtiene los pedidos más recientes del usuario
        
        Args:
            user_id (int): ID del usuario
            limit (int): Número máximo de pedidos a retornar
            
        Returns:
            list: Lista de pedidos recientes
        """
        orders = execute_query(
            """
            SELECT p.id, p.fecha_pedido, p.estado, p.monto_total,
                   p.estado_pago, p.numero_seguimiento,
                   COUNT(ip.id) as total_items
            FROM pedidos p
            LEFT JOIN items_pedido ip ON p.id = ip.pedido_id
            WHERE p.usuario_id = %s
            GROUP BY p.id
            ORDER BY p.fecha_pedido DESC
            LIMIT %s
            """,
            (user_id, limit)
        )
        
        return orders or []
    
    def _get_recommended_products(self, user_id, limit=4):
        """Obtiene productos recomendados para el usuario
        
        Args:
            user_id (int): ID del usuario
            limit (int): Número máximo de productos a retornar
            
        Returns:
            list: Lista de productos recomendados
        """
        # Primero, intentar obtener productos basados en compras anteriores
        recommended = execute_query(
            """
            SELECT DISTINCT p.*, img.url_imagen as imagen_principal
            FROM productos p
            LEFT JOIN imagenes_productos img ON p.id = img.producto_id AND img.es_principal = 1
            WHERE p.activo = 1 AND p.cantidad_stock > 0
            AND p.categoria_id IN (
                SELECT DISTINCT p2.categoria_id
                FROM pedidos ped
                JOIN items_pedido ip ON ped.id = ip.pedido_id
                JOIN productos p2 ON ip.producto_id = p2.id
                WHERE ped.usuario_id = %s
            )
            AND p.id NOT IN (
                SELECT ip.producto_id
                FROM pedidos ped
                JOIN items_pedido ip ON ped.id = ip.pedido_id
                WHERE ped.usuario_id = %s
            )
            ORDER BY p.contador_ventas DESC, p.destacado DESC
            LIMIT %s
            """,
            (user_id, user_id, limit)
        )
        
        # Si no hay suficientes recomendaciones basadas en compras, completar con productos destacados
        if not recommended or len(recommended) < limit:
            additional_limit = limit - (len(recommended) if recommended else 0)
            
            # Excluir IDs de productos ya recomendados
            exclude_ids = [p.get('id') for p in recommended] if recommended else []
            exclude_clause = f"AND p.id NOT IN ({','.join(map(str, exclude_ids))})" if exclude_ids else ""
            
            additional_products = execute_query(
                f"""
                SELECT p.*, img.url_imagen as imagen_principal
                FROM productos p
                LEFT JOIN imagenes_productos img ON p.id = img.producto_id AND img.es_principal = 1
                WHERE p.activo = 1 AND p.cantidad_stock > 0
                {exclude_clause}
                ORDER BY p.destacado DESC, p.contador_ventas DESC, p.nuevo DESC
                LIMIT %s
                """,
                (additional_limit,)
            )
            
            if additional_products:
                if recommended:
                    recommended.extend(additional_products)
                else:
                    recommended = additional_products
        
        # Procesar los productos para incluir información adicional
        if recommended:
            for product in recommended:
                # Calcular si tiene descuento
                if product.get('precio_descuento'):
                    product['descuento'] = True
                    product['porcentaje_descuento'] = int(
                        ((product.get('precio', 0) - product.get('precio_descuento', 0)) / 
                         product.get('precio', 1)) * 100
                    )
                else:
                    product['descuento'] = False
                    product['porcentaje_descuento'] = 0
                
                # Asegurar que la descripción no sea demasiado larga
                if product.get('descripcion') and len(product['descripcion']) > 100:
                    product['descripcion'] = product['descripcion'][:100]
        
        return recommended or []
    
    def _get_cart_count(self, user_id):
        """Obtiene el número de items en el carrito del usuario
        
        Args:
            user_id (int): ID del usuario
            
        Returns:
            int: Número de items en el carrito
        """
        cart_count = execute_query(
            """
            SELECT COALESCE(SUM(cantidad), 0) as total
            FROM items_carrito
            WHERE usuario_id = %s
            """,
            (user_id,),
            fetchone=True
        )
        
        return int(cart_count.get('total', 0)) if cart_count else 0
    
    def get_user_notifications(self, user_id):
        """Obtiene notificaciones pendientes para el usuario
        
        Args:
            user_id (int): ID del usuario
            
        Returns:
            list: Lista de notificaciones
        """
        # Por ahora, retornar notificaciones básicas
        # En una implementación completa, esto vendría de una tabla de notificaciones
        notifications = []
        
        # Verificar pedidos con cambios de estado recientes
        recent_status_changes = execute_query(
            """
            SELECT id, estado, fecha_pedido
            FROM pedidos
            WHERE usuario_id = %s 
            AND fecha_pedido >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND estado IN ('enviado', 'entregado')
            ORDER BY fecha_pedido DESC
            LIMIT 3
            """,
            (user_id,)
        )
        
        if recent_status_changes:
            for order in recent_status_changes:
                if order.get('estado') == 'enviado':
                    notifications.append({
                        'type': 'info',
                        'title': 'Pedido enviado',
                        'message': f'Tu pedido #{order.get("id")} ha sido enviado',
                        'date': order.get('fecha_pedido')
                    })
                elif order.get('estado') == 'entregado':
                    notifications.append({
                        'type': 'success',
                        'title': 'Pedido entregado',
                        'message': f'Tu pedido #{order.get("id")} ha sido entregado',
                        'date': order.get('fecha_pedido')
                    })
        
        # Verificar si hay items en el carrito
        cart_count = self._get_cart_count(user_id)
        if cart_count > 0:
            notifications.append({
                'type': 'info',
                'title': 'Carrito pendiente',
                'message': f'Tienes {cart_count} items en tu carrito',
                'date': datetime.now()
            })
        
        return notifications
    
    def get_user_activity(self, user_id, days=30):
        """Obtiene la actividad reciente del usuario
        
        Args:
            user_id (int): ID del usuario
            days (int): Número de días hacia atrás para buscar actividad
            
        Returns:
            dict: Actividad del usuario
        """
        activity = {
            'total_orders': 0,
            'total_spent': 0,
            'products_viewed': 0,
            'last_order_date': None
        }
        
        # Obtener estadísticas de pedidos en el período
        order_stats = execute_query(
            """
            SELECT 
                COUNT(*) as total_orders,
                SUM(monto_total) as total_spent,
                MAX(fecha_pedido) as last_order_date
            FROM pedidos
            WHERE usuario_id = %s 
            AND fecha_pedido >= DATE_SUB(NOW(), INTERVAL %s DAY)
            AND estado != 'cancelado'
            """,
            (user_id, days),
            fetchone=True
        )
        
        if order_stats:
            activity['total_orders'] = order_stats.get('total_orders', 0)
            activity['total_spent'] = float(order_stats.get('total_spent', 0)) if order_stats.get('total_spent') else 0
            activity['last_order_date'] = order_stats.get('last_order_date')
        
        return activity
    
    def get_special_offers(self, user_id):
        """Obtiene ofertas especiales para el usuario
        
        Args:
            user_id (int): ID del usuario
            
        Returns:
            list: Lista de ofertas especiales
        """
        # Obtener productos con descuento
        offers = execute_query(
            """
            SELECT p.*, img.url_imagen as imagen_principal
            FROM productos p
            LEFT JOIN imagenes_productos img ON p.id = img.producto_id AND img.es_principal = 1
            WHERE p.activo = 1 
            AND p.cantidad_stock > 0
            AND p.precio_descuento IS NOT NULL
            AND p.precio_descuento < p.precio
            ORDER BY (p.precio - p.precio_descuento) DESC
            LIMIT 6
            """
        )
        
        if offers:
            for offer in offers:
                # Calcular porcentaje de descuento
                offer['porcentaje_descuento'] = int(
                    ((offer.get('precio', 0) - offer.get('precio_descuento', 0)) / 
                     offer.get('precio', 1)) * 100
                )
        
        return offers or []