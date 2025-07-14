
import os
import sys
import hashlib
import uuid
import datetime
import random
import json
from backend.configuracion.config import Config
from backend.DB.db_manager import execute_query, check_database_exists, create_database

class RegistroController:
    """Controlador para el registro de usuarios con verificación por email"""
    
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
    
    def get_registro_data(self):
        """Obtiene los datos para mostrar en la página de registro"""
        # Obtener información de la tienda
        tienda_info = execute_query(
            "SELECT * FROM informacion_tienda LIMIT 1", 
            fetchone=True
        ) or {}
        
        # Datos para mostrar en la página de registro
        data = {
            'app_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'company_name': tienda_info.get('nombre', 'Talabartería Rodríguez'),
            'version': '1.0.0',
            'logo_url': tienda_info.get('logo_url', '')
        }
        
        return data
    
    def create_temporary_user(self, nombre, apellidos, email, password, telefono=None):
        """Crea un usuario temporal pendiente de verificación
        
        Args:
            nombre (str): Nombre del usuario
            apellidos (str): Apellidos del usuario
            email (str): Email del usuario
            password (str): Contraseña del usuario
            telefono (str, optional): Teléfono del usuario
            
        Returns:
            dict: Resultado del proceso con los siguientes campos:
                - success (bool): Si el usuario temporal fue creado exitosamente
                - message (str): Mensaje de éxito o error
                - temp_user_id (str): ID del usuario temporal si fue creado exitosamente
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
        
        try:
            # Generar ID único para el usuario temporal
            temp_user_id = str(uuid.uuid4())
            
            # Generar código de verificación (6 dígitos)
            verification_code = ''.join(random.choices('0123456789', k=6))
            
            # Hash de la contraseña
            password_hash = self._hash_password(password)
            
            # Establecer fecha de expiración (24 horas)
            expira_en = datetime.datetime.now() + datetime.timedelta(hours=24)
            
            # Datos del usuario temporal
            user_data = {
                'nombre': nombre,
                'apellidos': apellidos,
                'correo': email,
                'contrasena_hash': password_hash,
                'telefono': telefono,
                'verification_code': verification_code,
                'expira_en': expira_en.isoformat()
            }
            
            # Almacenar datos del usuario temporal
            # En un sistema real, esto se guardaría en una tabla específica
            # Por simplicidad en este ejemplo, usamos insert en temp_users
            execute_query(
                """
                INSERT INTO temp_users (id, data, created_at, expires_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP, %s)
                """,
                (temp_user_id, json.dumps(user_data), expira_en)
            )
            
            # Enviar correo con código de verificación
            self._send_verification_email(email, nombre, verification_code)
            
            return {
                'success': True,
                'message': 'Usuario temporal creado exitosamente. Revisa tu correo para verificar.',
                'temp_user_id': temp_user_id
            }
            
        except Exception as e:
            print(f"Error al crear usuario temporal: {str(e)}")
            return {
                'success': False,
                'message': 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.'
            }
    
    def verify_code(self, temp_user_id, verification_code):
        """Verifica el código enviado por email y crea el usuario definitivo
        
        Args:
            temp_user_id (str): ID del usuario temporal
            verification_code (str): Código de verificación
            
        Returns:
            dict: Resultado del proceso con los siguientes campos:
                - success (bool): Si la verificación fue exitosa
                - message (str): Mensaje de éxito o error
                - user_id (int): ID del usuario si la verificación fue exitosa
        """
        try:
            # Obtener datos del usuario temporal
            temp_user = execute_query(
                "SELECT data, expires_at FROM temp_users WHERE id = %s",
                (temp_user_id,),
                fetchone=True
            )
            
            if not temp_user:
                return {
                    'success': False,
                    'message': 'No se encontró la solicitud de registro o ha expirado. Por favor, inténtalo nuevamente.'
                }
            
            # Verificar si ha expirado
            expira_en = temp_user.get('expires_at')
            if expira_en and datetime.datetime.now() > expira_en:
                # Eliminar usuario temporal expirado
                execute_query(
                    "DELETE FROM temp_users WHERE id = %s",
                    (temp_user_id,)
                )
                
                return {
                    'success': False,
                    'message': 'La solicitud de registro ha expirado. Por favor, inténtalo nuevamente.'
                }
            
            # Obtener datos del usuario temporal
            user_data = json.loads(temp_user.get('data', '{}'))
            
            # Verificar código
            stored_code = user_data.get('verification_code')
            if not stored_code or stored_code != verification_code:
                return {
                    'success': False,
                    'message': 'El código de verificación es incorrecto. Por favor, revisa e inténtalo nuevamente.'
                }
            
            # Extraer datos del usuario
            nombre = user_data.get('nombre')
            apellidos = user_data.get('apellidos')
            email = user_data.get('correo')
            password_hash = user_data.get('contrasena_hash')
            telefono = user_data.get('telefono')
            
            # Crear usuario definitivo
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
                    'message': 'Error al crear el usuario, por favor intenta nuevamente'
                }
            
            # Eliminar usuario temporal
            execute_query(
                "DELETE FROM temp_users WHERE id = %s",
                (temp_user_id,)
            )
            
            # Enviar correo de bienvenida
            self._send_welcome_email(email, nombre)
            
            return {
                'success': True,
                'message': 'Verificación exitosa. Tu cuenta ha sido creada correctamente.',
                'user_id': user_id
            }
            
        except Exception as e:
            print(f"Error al verificar código: {str(e)}")
            return {
                'success': False,
                'message': 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.'
            }
    
    def resend_verification_code(self, temp_user_id):
        """Reenvía el código de verificación
        
        Args:
            temp_user_id (str): ID del usuario temporal
            
        Returns:
            dict: Resultado del proceso con los siguientes campos:
                - success (bool): Si el reenvío fue exitoso
                - message (str): Mensaje de éxito o error
        """
        try:
            # Obtener datos del usuario temporal
            temp_user = execute_query(
                "SELECT data, expires_at FROM temp_users WHERE id = %s",
                (temp_user_id,),
                fetchone=True
            )
            
            if not temp_user:
                return {
                    'success': False,
                    'message': 'No se encontró la solicitud de registro o ha expirado. Por favor, inténtalo nuevamente.'
                }
            
            # Verificar si ha expirado
            expira_en = temp_user.get('expires_at')
            if expira_en and datetime.datetime.now() > expira_en:
                # Eliminar usuario temporal expirado
                execute_query(
                    "DELETE FROM temp_users WHERE id = %s",
                    (temp_user_id,)
                )
                
                return {
                    'success': False,
                    'message': 'La solicitud de registro ha expirado. Por favor, inténtalo nuevamente.'
                }
            
            # Obtener datos del usuario temporal
            user_data = json.loads(temp_user.get('data', '{}'))
            
            # Generar nuevo código de verificación
            verification_code = ''.join(random.choices('0123456789', k=6))
            
            # Actualizar código
            user_data['verification_code'] = verification_code
            
            # Actualizar fecha de expiración (24 horas adicionales)
            expira_en = datetime.datetime.now() + datetime.timedelta(hours=24)
            user_data['expira_en'] = expira_en.isoformat()
            
            # Actualizar datos en la base de datos
            execute_query(
                "UPDATE temp_users SET data = %s, expires_at = %s WHERE id = %s",
                (json.dumps(user_data), expira_en, temp_user_id)
            )
            
            # Enviar nuevo código por email
            self._send_verification_email(user_data.get('correo'), user_data.get('nombre'), verification_code)
            
            return {
                'success': True,
                'message': 'Se ha enviado un nuevo código de verificación a tu correo electrónico.'
            }
            
        except Exception as e:
            print(f"Error al reenviar código: {str(e)}")
            return {
                'success': False,
                'message': 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.'
            }
    
    def _hash_password(self, password):
        """Genera un hash seguro para una contraseña
        
        Args:
            password (str): Contraseña a hashear
            
        Returns:
            str: Hash de la contraseña
        """
        # En un entorno de producción real, usar una biblioteca como bcrypt o Argon2
        # Por simplicidad, usamos sha256 con salt
        salt = os.urandom(32)
        hash_obj = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            salt, 
            100000
        )
        
        return salt.hex() + '|' + hash_obj.hex()
    
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
    
    def _send_verification_email(self, email, nombre, code):
        """Envía un correo con el código de verificación
        
        Args:
            email (str): Correo electrónico del destinatario
            nombre (str): Nombre del destinatario
            code (str): Código de verificación
        """
        # En un entorno de producción real, usar una biblioteca como smtplib o un servicio como SendGrid
        # Por simplicidad, solo simulamos el envío de correo
        
        subject = "Verifica tu cuenta de Talabartería Rodríguez"
        message = f"""
        Hola {nombre},
        
        Gracias por registrarte en Talabartería Rodríguez. Para completar tu registro, por favor introduce el siguiente código de verificación:
        
        {code}
        
        Este código expirará en 24 horas.
        
        Si no has solicitado este registro, puedes ignorar este correo.
        
        Saludos,
        El equipo de Talabartería Rodríguez
        """
        
        print(f"[SIMULACIÓN DE ENVÍO DE CORREO]\nPara: {email}\nAsunto: {subject}\nCuerpo: {message}")
    
    def _send_welcome_email(self, email, nombre):
        """Envía un correo de bienvenida
        
        Args:
            email (str): Correo electrónico del destinatario
            nombre (str): Nombre del destinatario
        """
        # En un entorno de producción real, usar una biblioteca como smtplib o un servicio como SendGrid
        # Por simplicidad, solo simulamos el envío de correo
        
        subject = "¡Bienvenido a Talabartería Rodríguez!"
        message = f"""
        Hola {nombre},
        
        ¡Bienvenido a Talabartería Rodríguez! Tu cuenta ha sido creada y verificada correctamente.
        
        Ahora puedes iniciar sesión y disfrutar de todos nuestros productos y servicios.
        
        Si tienes alguna pregunta, no dudes en contactarnos.
        
        Saludos,
        El equipo de Talabartería Rodríguez
        """
        
        print(f"[SIMULACIÓN DE ENVÍO DE CORREO]\nPara: {email}\nAsunto: {subject}\nCuerpo: {message}")
