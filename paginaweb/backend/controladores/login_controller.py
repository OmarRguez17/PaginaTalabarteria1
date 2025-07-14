import os
import sys
import hashlib
import uuid
import datetime
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query, check_database_exists, create_database

class LoginController:
    """Controlador para la autenticación de usuarios de Talabartería Rodríguez"""
    
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
    
    def get_login_data(self):
        """Obtiene los datos para mostrar en la página de login"""
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Verificar si el login social está habilitado
        social_login_enabled = execute_query(
            "SELECT valor FROM configuracion WHERE clave = 'social_login_enabled'", 
            fetchone=True
        )
        
        # Datos para mostrar en la página de login
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'company_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'version': '1.0.0',
            'logo_url': tienda_info.get('logo_url', ''),
            'social_login_enabled': social_login_enabled.get('valor', '0') == '1' if social_login_enabled else False
        }
        
        return data
    
    def login_user(self, email, password, remember=False):
        """Autentica a un usuario con email y contraseña
        
        Args:
            email (str): Email del usuario
            password (str): Contraseña del usuario
            remember (bool): Recordar sesión
            
        Returns:
            dict: Resultado de la autenticación con los siguientes campos:
                - success (bool): Si la autenticación fue exitosa
                - message (str): Mensaje de éxito o error
                - user_data (dict): Datos del usuario si la autenticación fue exitosa
        """
        # Debug - imprimir valores recibidos
        print(f"Login attempt - Email: '{email}', Password length: {len(password) if password else 0}")
        
        # Validación básica
        if not email or not password:
            print("Validation failed - email or password is empty")
            return {
                'success': False,
                'message': 'Por favor, introduce email y contraseña'
            }
        
        # Buscar usuario por email
        user = execute_query(
            "SELECT id, correo, contrasena_hash, nombre, apellidos, activo FROM usuarios WHERE correo = %s", 
            (email,), 
            fetchone=True
        )
        
        print(f"User found: {user is not None}")
        
        # Verificar si el usuario existe
        if not user:
            return {
                'success': False,
                'message': 'Correo electrónico o contraseña incorrectos'
            }
        
        # Verificar si la cuenta está activa
        if not user.get('activo', 0):
            return {
                'success': False,
                'message': 'Tu cuenta está desactivada. Por favor, contacta con soporte.'
            }
        
        # Verificar la contraseña
        stored_hash = user.get('contrasena_hash', '')
        print(f"Stored hash: {stored_hash[:20]}...")
        print(f"Password to verify: {password}")
        
        # TEMPORAL: Para desarrollo, aceptar admin123 directamente
        if password == 'admin123' and email in ['admin@talabarteriarodriguez.com', 'ventas@talabarteriarodriguez.com', 'cliente@ejemplo.com']:
            print("DEV MODE: Accepting admin123 for known users")
            password_valid = True
        else:
            # Verificación normal
            password_valid = False
            
            # Si es formato bcrypt
            if stored_hash.startswith('$2'):
                try:
                    import bcrypt
                    # Manejar diferentes formatos de bcrypt
                    if stored_hash.startswith('$2y$'):
                        # Convertir de PHP bcrypt ($2y$) a Python bcrypt ($2b$)
                        test_hash = '$2b$' + stored_hash[4:]
                    else:
                        test_hash = stored_hash
                    
                    password_valid = bcrypt.checkpw(password.encode('utf-8'), test_hash.encode('utf-8'))
                    print(f"Bcrypt check result: {password_valid}")
                except Exception as e:
                    print(f"Bcrypt error: {str(e)}")
                    password_valid = False
        
        if not password_valid:
            return {
                'success': False,
                'message': 'Correo electrónico o contraseña incorrectos'
            }
        
        # Actualizar último acceso
        execute_query(
            "UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = %s", 
            (user.get('id'),)
        )
        
        # Verificar si es administrador
        admin_info = execute_query(
            "SELECT rol FROM administradores WHERE usuario_id = %s", 
            (user.get('id'),), 
            fetchone=True
        )
        
        # Preparar datos del usuario para la sesión
        user_data = {
            'id': user.get('id'),
            'email': user.get('correo'),
            'nombre': user.get('nombre'),
            'apellidos': user.get('apellidos'),
            'is_admin': bool(admin_info),
            'admin_role': admin_info.get('rol') if admin_info else None
        }
        
        print(f"Login successful for user: {user_data['email']}, is_admin: {user_data['is_admin']}")
        
        return {
            'success': True,
            'message': 'Inicio de sesión exitoso',
            'user_data': user_data
        }
    
    def register_user(self, nombre, apellidos, email, password, telefono=None):
        """Registra un nuevo usuario en el sistema
        
        Args:
            nombre (str): Nombre del usuario
            apellidos (str): Apellidos del usuario
            email (str): Email del usuario
            password (str): Contraseña del usuario
            telefono (str, optional): Teléfono del usuario
            
        Returns:
            dict: Resultado del registro con los siguientes campos:
                - success (bool): Si el registro fue exitoso
                - message (str): Mensaje de éxito o error
                - user_id (int): ID del usuario si el registro fue exitoso
        """
        # Validación básica
        if not nombre or not apellidos or not email or not password:
            return {
                'success': False,
                'message': 'Por favor, completa todos los campos requeridos'
            }
        
        # Verificar si el email ya está registrado
        existing_user = execute_query(
            "SELECT id FROM usuarios WHERE correo = %s", 
            (email,), 
            fetchone=True
        )
        
        if existing_user:
            return {
                'success': False,
                'message': 'Este correo electrónico ya está registrado'
            }
        
        # Validar formato de email
        if not self._validate_email(email):
            return {
                'success': False,
                'message': 'Por favor, introduce un correo electrónico válido'
            }
        
        # Validar contraseña
        if not self._validate_password(password):
            return {
                'success': False,
                'message': 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número'
            }
        
        # Hash de la contraseña
        password_hash = self._hash_password(password)
        
        try:
            # Insertar nuevo usuario
            user_id = execute_query(
                """
                INSERT INTO usuarios (nombre, apellidos, correo, contrasena_hash, telefono, activo, fecha_registro)
                VALUES (%s, %s, %s, %s, %s, 1, CURRENT_TIMESTAMP)
                """,
                (nombre, apellidos, email, password_hash, telefono),
                return_last_id=True
            )
            
            if not user_id:
                return {
                    'success': False,
                    'message': 'Error al registrar el usuario, por favor intenta nuevamente'
                }
            
            return {
                'success': True,
                'message': 'Registro exitoso. Ya puedes iniciar sesión con tu cuenta.',
                'user_id': user_id
            }
            
        except Exception as e:
            print(f"Error al registrar usuario: {str(e)}")
            return {
                'success': False,
                'message': 'Error al registrar el usuario, por favor intenta nuevamente'
            }
    
    def forgot_password(self, email):
        """Inicia el proceso de recuperación de contraseña
        
        Args:
            email (str): Email del usuario
            
        Returns:
            dict: Resultado del proceso con los siguientes campos:
                - success (bool): Si el proceso fue iniciado exitosamente
                - message (str): Mensaje de éxito o error
        """
        # Validación básica
        if not email:
            return {
                'success': False,
                'message': 'Por favor, introduce tu correo electrónico'
            }
        
        # Verificar si el usuario existe
        user = execute_query(
            "SELECT id, correo, nombre, activo FROM usuarios WHERE correo = %s", 
            (email,), 
            fetchone=True
        )
        
        # Siempre mostrar éxito por seguridad, incluso si el usuario no existe
        if not user:
            return {
                'success': True,
                'message': 'Si tu cuenta existe, recibirás un correo con instrucciones para restablecer tu contraseña'
            }
        
        # Verificar si la cuenta está activa
        if not user.get('activo', 0):
            return {
                'success': True,
                'message': 'Si tu cuenta existe, recibirás un correo con instrucciones para restablecer tu contraseña'
            }
        
        # Generar token único
        token = str(uuid.uuid4())
        
        # Establecer fecha de expiración (24 horas)
        expira_en = datetime.datetime.now() + datetime.timedelta(hours=24)
        
        try:
            # Eliminar tokens antiguos para este usuario
            execute_query(
                "DELETE FROM tokens_recuperacion WHERE usuario_id = %s", 
                (user.get('id'),)
            )
            
            # Insertar nuevo token
            execute_query(
                """
                INSERT INTO tokens_recuperacion (usuario_id, token, creado_en, expira_en, usado)
                VALUES (%s, %s, CURRENT_TIMESTAMP, %s, 0)
                """,
                (user.get('id'), token, expira_en)
            )
            
            # Aquí se enviaría el correo electrónico con el enlace de recuperación
            # Por simplicidad, no implementamos el envío real de correo en este ejemplo
            # En producción, usa una biblioteca como smtplib o un servicio como SendGrid
            
            recuperacion_url = f"/reset-password?token={token}"
            print(f"[ENVÍO DE CORREO] Link de recuperación: {recuperacion_url}")
            
            return {
                'success': True,
                'message': 'Si tu cuenta existe, recibirás un correo con instrucciones para restablecer tu contraseña'
            }
            
        except Exception as e:
            print(f"Error en recuperación de contraseña: {str(e)}")
            return {
                'success': False,
                'message': 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.'
            }
    
    def reset_password(self, token, new_password):
        """Restablece la contraseña de un usuario usando un token
        
        Args:
            token (str): Token de recuperación
            new_password (str): Nueva contraseña
            
        Returns:
            dict: Resultado del proceso con los siguientes campos:
                - success (bool): Si la contraseña fue restablecida exitosamente
                - message (str): Mensaje de éxito o error
        """
        # Validación básica
        if not token or not new_password:
            return {
                'success': False,
                'message': 'Parámetros inválidos'
            }
        
        # Validar contraseña
        if not self._validate_password(new_password):
            return {
                'success': False,
                'message': 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número'
            }
        
        # Verificar token
        token_info = execute_query(
            """
            SELECT t.id, t.usuario_id, t.usado, t.expira_en, u.activo
            FROM tokens_recuperacion t
            JOIN usuarios u ON t.usuario_id = u.id
            WHERE t.token = %s
            """,
            (token,),
            fetchone=True
        )
        
        # Verificar si el token existe y es válido
        if not token_info:
            return {
                'success': False,
                'message': 'El enlace de recuperación es inválido o ha expirado'
            }
        
        # Verificar si el token ya fue usado
        if token_info.get('usado', 1):
            return {
                'success': False,
                'message': 'Este enlace de recuperación ya ha sido utilizado'
            }
        
        # Verificar si el token ha expirado
        expira_en = token_info.get('expira_en')
        if expira_en and datetime.datetime.now() > expira_en:
            return {
                'success': False,
                'message': 'El enlace de recuperación ha expirado'
            }
        
        # Verificar si la cuenta está activa
        if not token_info.get('activo', 0):
            return {
                'success': False,
                'message': 'Tu cuenta está desactivada. Por favor, contacta con soporte.'
            }
        
        try:
            # Hash de la nueva contraseña
            password_hash = self._hash_password(new_password)
            
            # Actualizar contraseña
            execute_query(
                "UPDATE usuarios SET contrasena_hash = %s WHERE id = %s", 
                (password_hash, token_info.get('usuario_id'))
            )
            
            # Marcar token como usado
            execute_query(
                "UPDATE tokens_recuperacion SET usado = 1 WHERE id = %s", 
                (token_info.get('id'),)
            )
            
            return {
                'success': True,
                'message': 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
            }
            
        except Exception as e:
            print(f"Error al restablecer contraseña: {str(e)}")
            return {
                'success': False,
                'message': 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.'
            }
    
    def _hash_password(self, password):
        """Genera un hash seguro para una contraseña usando bcrypt
        
        Args:
            password (str): Contraseña a hashear
            
        Returns:
            str: Hash de la contraseña
        """
        import bcrypt
        # Usar bcrypt que es más seguro y estándar
        salt = bcrypt.gensalt()
        hash_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hash_bytes.decode('utf-8')
    
    def _verify_password(self, password, stored_hash):
        """Verifica si una contraseña coincide con un hash almacenado
        
        Args:
            password (str): Contraseña a verificar
            stored_hash (str): Hash almacenado
            
        Returns:
            bool: True si la contraseña es correcta, False en caso contrario
        """
        import bcrypt
        try:
            # Verificar con bcrypt
            return bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        except Exception:
            return False
    
    def _validate_email(self, email):
        """Valida el formato de un email
        
        Args:
            email (str): Email a validar
            
        Returns:
            bool: True si el formato es válido, False en caso contrario
        """
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _validate_password(self, password):
        """Valida que una contraseña cumpla requisitos mínimos
        
        Args:
            password (str): Contraseña a validar
            
        Returns:
            bool: True si la contraseña cumple los requisitos, False en caso contrario
        """
        # Al menos 8 caracteres, una mayúscula, una minúscula y un número
        if len(password) < 8:
            return False
        
        if not any(c.isupper() for c in password):
            return False
        
        if not any(c.islower() for c in password):
            return False
        
        if not any(c.isdigit() for c in password):
            return False
        
        return True