from flask import Flask, render_template, url_for, request, redirect, send_from_directory, session, flash, jsonify, make_response
import os
import urllib.parse
import json
import datetime
from backend.controladores.home_controller import HomeController
from backend.controladores.servicios_controller import ServiciosController
from backend.controladores.carro_controller import CarroController
from backend.controladores.login_controller import LoginController
from backend.controladores.registro_controller import RegistroController
from backend.controladores.dashboardHome_controller import DashboardHomeController
from backend.controladores.productos_controller import ProductosController
from backend.controladores.categorias_controller import CategoriasController
from backend.controladores.configuracion_controller import ConfiguracionController

app = Flask(__name__,
            template_folder='visible/html',
            static_folder='visible')

# Configuración básica
app.secret_key = 'tu_clave_secreta_aqui'  

# Definir la carpeta de uploads
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# SOLUCIÓN 4: Función para limpiar datos de ejemplo al iniciar
def limpiar_datos_ejemplo_al_iniciar():
    """Limpia datos de ejemplo al iniciar la aplicación"""
    try:
        from backend.DB.db_manager import execute_query
        
        print("=== LIMPIANDO DATOS DE EJEMPLO AL INICIAR ===")
        
        # 1. Limpiar usuarios de ejemplo
        result = execute_query("""
            DELETE FROM usuarios 
            WHERE correo IN (
                'admin@talabarteriarodriguez.com',
                'ventas@talabarteriarodriguez.com',
                'cliente@ejemplo.com'
            )
        """, commit=True)
        print("Usuarios de ejemplo eliminados")
        
        # 2. Limpiar administradores relacionados
        execute_query("""
            DELETE FROM administradores 
            WHERE usuario_id NOT IN (SELECT id FROM usuarios)
        """, commit=True)
        print("Administradores huérfanos eliminados")
        
        # 3. Limpiar productos de ejemplo
        execute_query("""
            DELETE FROM productos 
            WHERE sku IN (
                'MONT-001', 'MONT-002', 'CINCH-001', 'CINCH-002',
                'BOOT-001', 'HAT-001', 'SPUR-001', 'ACC-001', 'ACC-002'
            )
            OR nombre IN (
                'Montura Charra Clásica',
                'Montura de Gala Premium',
                'Cincho Piteado Fino',
                'Cincho Liso Clásico',
                'Bota Charra de Piel',
                'Sombrero Charro de Gala',
                'Espuelas de Acero Inoxidable',
                'Riendas Trenzadas',
                'Chicote de Jineteo'
            )
        """, commit=True)
        print("Productos de ejemplo eliminados")
        
        # 4. Limpiar categorías de ejemplo si están vacías
        execute_query("""
            DELETE FROM categorias 
            WHERE nombre IN (
                'Monturas', 'Cinchos y Cinturones', 'Botas y Calzado',
                'Sombreros', 'Espuelas', 'Accesorios',
                'Monturas de Faena', 'Monturas de Gala',
                'Cinchos de Montura', 'Cinturones Charros'
            )
            AND id NOT IN (
                SELECT DISTINCT categoria_id FROM productos WHERE categoria_id IS NOT NULL
            )
            AND id NOT IN (
                SELECT DISTINCT categoria_padre_id FROM categorias WHERE categoria_padre_id IS NOT NULL
            )
        """, commit=True)
        print("Categorías de ejemplo vacías eliminadas")
        
        # 5. Limpiar pedidos de ejemplo
        execute_query("""
            DELETE FROM pedidos 
            WHERE usuario_id IS NULL 
            OR usuario_id NOT IN (SELECT id FROM usuarios)
            OR direccion_envio_id NOT IN (SELECT id FROM direcciones_envio)
        """, commit=True)
        print("Pedidos huérfanos eliminados")
        
        # 6. Limpiar información de tienda de ejemplo
        execute_query("""
            DELETE FROM informacion_tienda 
            WHERE email = 'contacto@talabarteriarodriguez.com'
            AND facebook = 'https://facebook.com/talabarteriarodriguez'
            AND instagram = 'https://instagram.com/talabarteriarodriguez'
        """, commit=True)
        print("Información de tienda de ejemplo eliminada")
        
        # 7. Limpiar imágenes con URLs de ejemplo
        execute_query("""
            DELETE FROM imagenes_productos 
            WHERE url_imagen LIKE '%ejemplo.com%'
        """, commit=True)
        print("Imágenes de ejemplo eliminadas")
        
        # 8. Limpiar reseñas de usuarios que ya no existen
        execute_query("""
            DELETE FROM resenas 
            WHERE usuario_id NOT IN (SELECT id FROM usuarios)
            OR producto_id NOT IN (SELECT id FROM productos)
        """, commit=True)
        print("Reseñas huérfanas eliminadas")
        
        # 9. Limpiar direcciones de envío huérfanas
        execute_query("""
            DELETE FROM direcciones_envio 
            WHERE usuario_id IS NOT NULL 
            AND usuario_id NOT IN (SELECT id FROM usuarios)
        """, commit=True)
        print("Direcciones de envío huérfanas eliminadas")
        
        # 10. Limpiar datos de carrito huérfanos
        execute_query("""
            DELETE FROM items_carrito 
            WHERE usuario_id NOT IN (SELECT id FROM usuarios)
            OR producto_id NOT IN (SELECT id FROM productos)
        """, commit=True)
        print("Items de carrito huérfanos eliminados")
        
        print("=== LIMPIEZA COMPLETADA ===\n")
        
    except Exception as e:
        print(f"Error durante la limpieza de datos de ejemplo: {e}")
        # No interrumpir el inicio de la aplicación
        pass

# Configurar ruta para los recursos públicos
@app.route('/publico/<path:filename>')
def public_files(filename):
    return send_from_directory('publico', filename)

# Configurar ruta para archivos subidos
@app.route('/uploads/<path:filename>')
def uploaded_files(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

# Configuración para evitar cache en páginas dinámicas
@app.after_request
def after_request(response):
    # Prevenir cache para páginas HTML
    if 'text/html' in response.headers.get('Content-Type', ''):
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

# Función para verificar si el usuario está autenticado
def login_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # Guardar la URL a la que intentaba acceder
            session['next_url'] = request.url
            return redirect(url_for('login', message='Debes iniciar sesión para acceder a esta página', type='info'))
        return f(*args, **kwargs)
    return decorated_function

# Función para verificar si el usuario es administrador
def admin_required(f):
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            session['next_url'] = request.url
            return redirect(url_for('login', message='Debes iniciar sesión para acceder a esta página', type='info'))
        
        if not session.get('is_admin'):
            return redirect(url_for('dashboard'))
        
        return f(*args, **kwargs)
    return decorated_function

# Ruta principal - página de inicio
@app.route('/')
def home():
    controller = HomeController()
    data = controller.get_home_data()
    return render_template('home/index.html', data=data)

# ----- RUTAS DEL DASHBOARD -----

# Ruta para el dashboard home (requiere autenticación)
@app.route('/dashboard')
@login_required
def dashboard():
    if session.get('is_admin'):
        controller = DashboardHomeController()
        user_id = session.get('user_id')
        data = controller.get_dashboard_data(user_id)
        return render_template('dashboard/dashboardHome.html', data=data)
    else:
        controller = DashboardHomeController()
        user_id = session.get('user_id')
        data = controller.get_dashboard_data(user_id)
        return render_template('dashboard/dashboardHome.html', data=data)

# Rutas para productos en el dashboard (solo admin)
@app.route('/dashboard/productos', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_required
def dashboard_productos():
    controller = ProductosController()
    
    # GET - Mostrar lista de productos
    if request.method == 'GET':
        page = int(request.args.get('page', 1))
        data = controller.get_productos_data(page=page)
        return render_template('dashboard/productos.html', data=data)
    
    # POST - Crear nuevo producto
    elif request.method == 'POST':
        data = {
            'nombre': request.form.get('nombre'),
            'categoria_id': request.form.get('categoria_id'),
            'descripcion': request.form.get('descripcion'),
            'descripcion_detallada': request.form.get('descripcion_detallada'),
            'precio': request.form.get('precio'),
            'precio_descuento': request.form.get('precio_descuento'),
            'cantidad_stock': request.form.get('cantidad_stock'),
            'sku': request.form.get('sku'),
            'peso': request.form.get('peso'),
            'dimensiones': request.form.get('dimensiones'),
            'material': request.form.get('material'),
            'destacado': 'destacado' in request.form,
            'nuevo': 'nuevo' in request.form,
            'activo': 'activo' in request.form
        }
        
        files = request.files.getlist('images')
        result = controller.crear_producto(data, files)
        return jsonify(result)

# CRUD de productos mediante AJAX
@app.route('/dashboard/productos/<int:producto_id>', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_required
def dashboard_producto_crud(producto_id):
    controller = ProductosController()
    
    # GET - Obtener producto específico
    if request.method == 'GET':
        producto = controller.get_producto_by_id(producto_id)
        if producto:
            return jsonify({'success': True, 'data': producto})
        else:
            return jsonify({'success': False, 'message': 'Producto no encontrado'}), 404
    
    # PUT - Actualizar producto (usando POST con _method=PUT para compatibilidad)
    elif request.method == 'PUT' or (request.method == 'POST' and request.form.get('_method') == 'PUT'):
        data = {
            'nombre': request.form.get('nombre'),
            'categoria_id': request.form.get('categoria_id'),
            'descripcion': request.form.get('descripcion'),
            'descripcion_detallada': request.form.get('descripcion_detallada'),
            'precio': request.form.get('precio'),
            'precio_descuento': request.form.get('precio_descuento'),
            'cantidad_stock': request.form.get('cantidad_stock'),
            'sku': request.form.get('sku'),
            'peso': request.form.get('peso'),
            'dimensiones': request.form.get('dimensiones'),
            'material': request.form.get('material'),
            'destacado': 'destacado' in request.form,
            'nuevo': 'nuevo' in request.form,
            'activo': 'activo' in request.form
        }
        
        files = request.files.getlist('images') if 'images' in request.files else None
        result = controller.actualizar_producto(producto_id, data, files)
        return jsonify(result)
    
    # DELETE - Eliminar producto
    elif request.method == 'DELETE':
        result = controller.eliminar_producto(producto_id)
        return jsonify(result)

# Estado del producto
@app.route('/dashboard/productos/<int:producto_id>/status', methods=['PUT'])
@admin_required
def dashboard_producto_status(producto_id):
    data = request.get_json()
    activo = data.get('activo', False)
    
    controller = ProductosController()
    result = controller.actualizar_estado_producto(producto_id, activo)
    return jsonify(result)

# Eliminar imagen de producto
@app.route('/dashboard/productos/imagen/<int:imagen_id>', methods=['DELETE'])
@admin_required
def dashboard_producto_imagen(imagen_id):
    controller = ProductosController()
    result = controller.eliminar_imagen_producto(imagen_id)
    return jsonify(result)

# ----- RUTAS DE CATEGORÍAS EN EL DASHBOARD -----

# Rutas para categorías en el dashboard (solo admin)
@app.route('/dashboard/categorias', methods=['GET', 'POST'])
@admin_required
def dashboard_categorias():
    controller = CategoriasController()
    
    # GET -Mostrar lista de categorías
    if request.method == 'GET':
        data = controller.get_categorias_data()
        return render_template('dashboard/categorias.html', data=data)
    
    # POST - Crear nueva categoría
    elif request.method == 'POST':
        data = {
            'nombre': request.form.get('nombre'),
            'descripcion': request.form.get('descripcion'),
            'categoria_padre_id': request.form.get('categoria_padre_id') or None,
            'activo': 'activo' in request.form,
            'orden_visualizacion': request.form.get('orden_visualizacion', 0)
        }
        
        file = request.files.get('imagen')
        result = controller.crear_categoria(data, file)
        return jsonify(result)

# CRUD de categorías mediante AJAX
@app.route('/dashboard/categorias/<int:categoria_id>', methods=['GET', 'POST', 'PUT', 'DELETE'])
@admin_required
def dashboard_categoria_crud(categoria_id):
    controller = CategoriasController()
    
    # GET - Obtener categoría específica
    if request.method == 'GET':
        categoria = controller.get_categoria_by_id(categoria_id)
        if categoria:
            return jsonify({'success': True, 'data': categoria})
        else:
            return jsonify({'success': False, 'message': 'Categoría no encontrada'}), 404
    
    # PUT - Actualizar categoría (usando POST con _method=PUT para compatibilidad)
    elif request.method == 'PUT' or (request.method == 'POST' and request.form.get('_method') == 'PUT'):
        data = {
            'nombre': request.form.get('nombre'),
            'descripcion': request.form.get('descripcion'),
            'categoria_padre_id': request.form.get('categoria_padre_id') or None,
            'activo': 'activo' in request.form,
            'orden_visualizacion': request.form.get('orden_visualizacion', 0)
        }
        
        file = request.files.get('imagen') if 'imagen' in request.files else None
        result = controller.actualizar_categoria(categoria_id, data, file)
        return jsonify(result)
    
    # DELETE - Eliminar categoría
    elif request.method == 'DELETE':
        result = controller.eliminar_categoria(categoria_id)
        return jsonify(result)

# Estado de la categoría
@app.route('/dashboard/categorias/<int:categoria_id>/status', methods=['PUT'])
@admin_required
def dashboard_categoria_status(categoria_id):
    data = request.get_json()
    activo = data.get('activo', False)
    
    controller = CategoriasController()
    result = controller.actualizar_estado_categoria(categoria_id, activo)
    return jsonify(result)

# ----- RUTAS DE CONFIGURACIÓN EN EL DASHBOARD -----

# Ruta para configuración en el dashboard (solo admin)
@app.route('/dashboard/configuracion', methods=['GET', 'POST'])
@admin_required
def dashboard_configuracion():
    controller = ConfiguracionController()
    
    # GET - Mostrar página de configuración
    if request.method == 'GET':
        data = controller.get_configuracion_data()
        return render_template('dashboard/configuracion.html', data=data)
    
    # POST - Actualizar configuración
    elif request.method == 'POST':
        data = {
            'nombre': request.form.get('nombre'),
            'slogan': request.form.get('slogan'),
            'descripcion': request.form.get('descripcion'),
            'telefono': request.form.get('telefono'),
            'email': request.form.get('email'),
            'direccion': request.form.get('direccion'),
            'horario': request.form.get('horario'),
            'facebook': request.form.get('facebook'),
            'instagram': request.form.get('instagram'),
            'whatsapp': request.form.get('whatsapp')
        }
        
        files = {
            'logo': request.files.get('logo'),
            'banner': request.files.get('banner')
        }
        
        result = controller.actualizar_configuracion(data, files)
        return jsonify(result)

# ----- RUTAS DE SERVICIOS/PRODUCTOS -----

# Rutas para la sección de servicios/productos
@app.route('/servicios')
def servicios():
    controller = ServiciosController()
    data = controller.get_servicios_data()
    return render_template('servicios/servicios.html', data=data)

# Ruta para ver detalles de un servicio/producto específico
@app.route('/servicios/<int:servicio_id>')
def detalle_servicio(servicio_id):
    controller = ServiciosController()
    data = controller.get_servicios_data()  # Datos generales
    detalle = controller.get_detalle_servicio(servicio_id)
    
    if not detalle:
        # Si el servicio no existe, redirigir a la página de servicios
        return redirect(url_for('servicios'))
    
    # Combinar datos generales con datos del servicio específico
    data['detalle_servicio'] = detalle
    
    return render_template('servicios/detalle_servicio.html', data=data)

# API para búsqueda de productos
@app.route('/api/servicios/buscar', methods=['GET', 'POST'])
def buscar_servicios():
    controller = ServiciosController()
    
    if request.method == 'POST':
        # Obtener datos del formulario JSON
        data = request.get_json()
        
        termino = data.get('termino', '')
        categoria_id = data.get('categoria_id')
        precio_max = data.get('precio_max')
        filtros = data.get('filtros', {})
        material = data.get('material')
        pagina = int(data.get('pagina', 1))
        items_por_pagina = int(data.get('items_por_pagina', 12))
        
        # Calcular offset para paginación
        offset = (pagina - 1) * items_por_pagina
        
        # Realizar búsqueda
        result = controller.buscar_productos(
            termino=termino,
            categoria_id=categoria_id,
            precio_max=precio_max,
            filtros=filtros,
            material=material,
            offset=offset,
            limit=items_por_pagina
        )
        
        return jsonify(result)
    else:
        # Para solicitudes GET, redirigir a la página de servicios
        return redirect(url_for('servicios'))

# ----- RUTAS DEL CARRITO DE COMPRAS -----

# Ruta para la página de carrito de compras
@app.route('/carrito')
def carrito():
    controller = CarroController()
    # Obtener ID de usuario si está autenticado
    usuario_id = session.get('user_id')
    data = controller.get_carro_data(usuario_id)
    return render_template('carro/carro.html', data=data)

# API para gestionar el carrito (para usuarios autenticados)
@app.route('/api/carrito/add', methods=['POST'])
def add_to_cart():
    data = request.json
    producto_id = data.get('producto_id')
    cantidad = data.get('cantidad', 1)
    
    if session.get('user_id'):
        # Usuario autenticado - guardar en base de datos
        controller = CarroController()
        result = controller.guardar_item_carrito(session['user_id'], producto_id, cantidad)
        return jsonify(result)
    else:
        # Usuario no autenticado - responder éxito (se maneja en localStorage)
        return jsonify({'success': True, 'message': 'Producto añadido al carrito'})

@app.route('/api/carrito/update', methods=['POST'])
def update_cart_item():
    data = request.json
    producto_id = data.get('producto_id')
    cantidad = data.get('cantidad', 1)
    
    if session.get('user_id'):
        # Usuario autenticado - actualizar en base de datos
        controller = CarroController()
        result = controller.actualizar_item_carrito(session['user_id'], producto_id, cantidad)
        return jsonify(result)
    else:
        # Usuario no autenticado - responder éxito (se maneja en localStorage)
        return jsonify({'success': True, 'message': 'Carrito actualizado'})

@app.route('/api/carrito/remove', methods=['POST'])
def remove_cart_item():
    data = request.json
    producto_id = data.get('producto_id')
    
    if session.get('user_id'):
        # Usuario autenticado - eliminar de base de datos
        controller = CarroController()
        result = controller.eliminar_item_carrito(session['user_id'], producto_id)
        return jsonify(result)
    else:
        # Usuario no autenticado - responder éxito (se maneja en localStorage)
        return jsonify({'success': True, 'message': 'Producto eliminado del carrito'})

@app.route('/api/carrito/clear', methods=['POST'])
def clear_cart():
    if session.get('user_id'):
        # Usuario autenticado - vaciar en base de datos
        controller = CarroController()
        result = controller.vaciar_carrito(session['user_id'])
        return jsonify(result)
    else:
        # Usuario no autenticado - responder éxito (se maneja en localStorage)
        return jsonify({'success': True, 'message': 'Carrito vaciado'})

# API para procesar pedidos
@app.route('/api/pedido/crear', methods=['POST'])
def crear_pedido():
    data = request.json
    
    # Permitir pedidos sin autenticación
    data['usuario_id'] = session.get('user_id')  # Puede ser None para invitados
    
    controller = CarroController()
    result = controller.procesar_pedido(data)
    
    return jsonify(result)

# API para verificar cupones
@app.route('/api/cupon/verificar', methods=['POST'])
def verificar_cupon():
    data = request.json
    codigo = data.get('codigo')
    
    if not codigo:
        return jsonify({'success': False, 'message': 'Código no proporcionado'})
    
    controller = CarroController()
    result = controller.verificar_cupon(codigo)
    
    return jsonify(result)

# API para guardar direcciones
@app.route('/api/direccion/guardar', methods=['POST'])
def guardar_direccion():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401
    
    data = request.json
    
    controller = CarroController()
    result = controller.guardar_direccion(session['user_id'], data)
    
    return jsonify(result)

# API para sincronizar carrito al iniciar sesión
@app.route('/api/carrito/sincronizar', methods=['POST'])
def sincronizar_carrito():
    if not session.get('user_id'):
        return jsonify({'success': False, 'message': 'Usuario no autenticado'}), 401
    
    # Obtener el carrito del localStorage enviado por el cliente
    data = request.json
    items_carrito = data.get('items', [])
    
    controller = CarroController()
    
    # Sincronizar cada item con la base de datos
    for item in items_carrito:
        producto_id = item.get('id')
        cantidad = item.get('cantidad', 1)
        
        # Actualizar o añadir item en la base de datos
        controller.guardar_item_carrito(session['user_id'], producto_id, cantidad)
    
    # Obtener el carrito actualizado de la base de datos
    carrito_actualizado = controller.get_items_carrito(session['user_id'])
    
    return jsonify({
        'success': True, 
        'message': 'Carrito sincronizado correctamente',
        'carrito': carrito_actualizado
    })

# ----- RUTAS DE AUTENTICACIÓN -----

# Ruta para la página de login
@app.route('/login')
def login():
    # Redireccionar a la página principal si ya hay sesión
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    
    controller = LoginController()
    data = controller.get_login_data()
    
    # Verificar si hay mensajes en los parámetros de URL
    if request.args.get('message'):
        data['message'] = request.args.get('message')
        data['message_type'] = request.args.get('type', 'info')
    
    return render_template('login/login.html', data=data)

# Ruta para procesar el login
@app.route('/login', methods=['POST'])
def login_post():
    email = request.form.get('email', '')
    password = request.form.get('password', '')
    remember = request.form.get('remember') == 'on'
    
    controller = LoginController()
    result = controller.login_user(email, password, remember)
    
    if result['success']:
        # Establecer sesión
        session['user_id'] = result['user_data']['id']
        session['user_name'] = result['user_data']['nombre']
        session['user_email'] = result['user_data']['email']
        session['is_admin'] = result['user_data']['is_admin']
        
        # Configurar la sesión permanente si se seleccionó "recordar"
        if remember:
            session.permanent = True
            app.permanent_session_lifetime = datetime.timedelta(days=30)
        
        # Redirigir al dashboard
        return redirect(url_for('dashboard'))
    else:
        # Redirigir a login con mensaje de error
        message = urllib.parse.quote(result['message'])
        return redirect(url_for('login', message=message, type='error'))

# Ruta para cerrar sesión
@app.route('/logout')
def logout():
    # Eliminar datos de sesión
    session.pop('user_id', None)
    session.pop('user_name', None)
    session.pop('user_email', None)
    session.pop('is_admin', None)
    
    # Redirigir a la página principal
    return redirect(url_for('home'))

# ----- RUTAS DE REGISTRO CON VERIFICACIÓN -----

# Ruta para la página de registro
@app.route('/registro')
def registro():
    # Redireccionar al dashboard si ya hay sesión
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    
    controller = RegistroController()
    data = controller.get_registro_data()
    
    # Verificar si hay mensajes o parámetros en la URL
    if request.args.get('message'):
        data['message'] = request.args.get('message')
        data['message_type'] = request.args.get('type', 'info')
    
    # Verificar si se solicita un paso específico
    if request.args.get('step'):
        data['step'] = request.args.get('step')
    
    # Verificar si hay email temporal para verificación
    if request.args.get('email'):
        data['email'] = request.args.get('email')
    
    # Verificar si hay ID de usuario temporal para verificación
    if request.args.get('temp_user_id'):
        data['temp_user_id'] = request.args.get('temp_user_id')
    
    return render_template('registro/registro.html', data=data)

# Ruta para crear usuario temporal
@app.route('/registro/create-temp-user', methods=['POST'])
def registro_create_temp_user():
    nombre = request.form.get('nombre', '')
    apellidos = request.form.get('apellidos', '')
    email = request.form.get('email', '')
    telefono = request.form.get('telefono', '')
    password = request.form.get('password', '')
    confirm_password = request.form.get('confirm_password', '')
    
    # Verificar si las contraseñas coinciden
    if password != confirm_password:
        return jsonify({
            'success': False,
            'message': 'Las contraseñas no coinciden'
        })
    
    controller = RegistroController()
    result = controller.create_temporary_user(nombre, apellidos, email, password, telefono)
    
    return jsonify(result)

# Ruta para verificar código
@app.route('/registro/verify-code', methods=['POST'])
def registro_verify_code():
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'message': 'Datos inválidos'
        })
    
    temp_user_id = data.get('temp_user_id')
    verification_code = data.get('verification_code')
    
    controller = RegistroController()
    result = controller.verify_code(temp_user_id, verification_code)
    
    return jsonify(result)

# Ruta para reenviar código de verificación
@app.route('/registro/resend-code', methods=['POST'])
def registro_resend_code():
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'message': 'Datos inválidos'
       })
    temp_user_id = data.get('temp_user_id')
    controller = RegistroController()
    result = controller.resend_verification_code(temp_user_id)
    return jsonify(result)

# ----- RUTAS DE RECUPERACIÓN DE CONTRASEÑA -----

@app.route('/forgot-password', methods=['POST'])
def forgot_password_post():
   email = request.form.get('email', '')
   
   controller = LoginController()
   result = controller.forgot_password(email)
   
   # Redirigir a login con mensaje
   message = urllib.parse.quote(result['message'])
   message_type = 'success' if result['success'] else 'error'
   
   return redirect(url_for('login', message=message, type=message_type))

# Ruta para la página de restablecimiento de contraseña
@app.route('/reset-password')
def reset_password():
   token = request.args.get('token', '')
   
   if not token:
       return redirect(url_for('login'))
   
   controller = LoginController()
   data = controller.get_login_data()
   data['token'] = token
   
   # Verificar si hay mensajes en los parámetros de URL
   if request.args.get('message'):
       data['message'] = request.args.get('message')
       data['message_type'] = request.args.get('type', 'info')
   
   return render_template('login/reset_password.html', data=data)

# Ruta para procesar el restablecimiento de contraseña
@app.route('/reset-password', methods=['POST'])
def reset_password_post():
   token = request.form.get('token', '')
   password = request.form.get('password', '')
   confirm_password = request.form.get('confirm_password', '')
   
   # Verificar si las contraseñas coinciden
   if password != confirm_password:
       message = urllib.parse.quote('Las contraseñas no coinciden')
       return redirect(url_for('reset_password', token=token, message=message, type='error'))
   
   controller = LoginController()
   result = controller.reset_password(token, password)
   
   if result['success']:
       # Redirigir a login con mensaje de éxito
       message = urllib.parse.quote(result['message'])
       return redirect(url_for('login', message=message, type='success'))
   else:
       # Redirigir a la página de reset con mensaje de error
       message = urllib.parse.quote(result['message'])
       return redirect(url_for('reset_password', token=token, message=message, type='error'))

# Página de 404 personalizada
@app.errorhandler(404)
def page_not_found(e):
   controller = HomeController()
   data = controller.get_home_data()
   return render_template('fijos/404.html', data=data), 404

# Punto de entrada de la aplicación
if __name__ == '__main__':
   # Ejecutar limpieza de datos de ejemplo ANTES de iniciar la app
   limpiar_datos_ejemplo_al_iniciar()
   
   # Crear carpeta de uploads si no existe
   if not os.path.exists(UPLOAD_FOLDER):
       os.makedirs(UPLOAD_FOLDER)
   
   # Crear subcarpeta de productos si no existe
   products_folder = os.path.join(UPLOAD_FOLDER, 'products')
   if not os.path.exists(products_folder):
       os.makedirs(products_folder)
   
   # Crear subcarpeta de categorías si no existe
   categories_folder = os.path.join(UPLOAD_FOLDER, 'categories')
   if not os.path.exists(categories_folder):
       os.makedirs(categories_folder)
   
   # Crear subcarpeta de configuración si no existe
   config_folder = os.path.join(UPLOAD_FOLDER, 'config')
   if not os.path.exists(config_folder):
       os.makedirs(config_folder)
   
   app.run(debug=True, host='0.0.0.0', port=5000)