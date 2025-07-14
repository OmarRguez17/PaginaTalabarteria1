import mysql.connector
from mysql.connector import Error

class DatabaseConfig:
    """Configuración de la base de datos MySQL"""
    HOST = 'localhost'
    PORT = 3306
    USER = 'root'
    PASSWORD = '123456'
    DATABASE = 'talabarteria_rodriguez'

def get_db_connection():
    """Crea una conexión a la base de datos MySQL"""
    try:
        connection = mysql.connector.connect(
            host=DatabaseConfig.HOST,
            port=DatabaseConfig.PORT,
            user=DatabaseConfig.USER,
            password=DatabaseConfig.PASSWORD,
            database=DatabaseConfig.DATABASE
        )
        return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def execute_query(query, params=(), fetchone=False, commit=False, return_last_id=False):
    """Ejecuta una consulta SQL y devuelve los resultados"""
    connection = get_db_connection()
    if not connection:
        if commit:
            return {"success": False, "error": "No se pudo conectar a la base de datos"}
        return None
    
    cursor = connection.cursor(dictionary=True)
    result = None
    
    try:
        cursor.execute(query, params)
        
        if commit:
            connection.commit()
            if return_last_id:
                return cursor.lastrowid
            return {"success": True, "lastrowid": cursor.lastrowid}
        
        if fetchone:
            result = cursor.fetchone()
        else:
            result = cursor.fetchall()
    except Error as e:
        print(f"Error al ejecutar consulta: {e}")
        if commit:
            return {"success": False, "error": str(e)}
        result = None
    finally:
        cursor.close()
        connection.close()
    
    return result

def execute_many(query, params_list, commit=True):
    """Ejecuta una consulta SQL múltiples veces con diferentes parámetros"""
    connection = get_db_connection()
    if not connection:
        return {"success": False, "error": "No se pudo conectar a la base de datos"}
    
    cursor = connection.cursor()
    
    try:
        cursor.executemany(query, params_list)
        
        if commit:
            connection.commit()
            return {"success": True, "rowcount": cursor.rowcount}
        
    except Error as e:
        print(f"Error al ejecutar consulta múltiple: {e}")
        return {"success": False, "error": str(e)}
    finally:
        cursor.close()
        connection.close()
    
    return {"success": True}

def execute_script(script_content):
    """Ejecuta un script SQL completo"""
    connection = get_db_connection()
    if not connection:
        return False
    
    cursor = connection.cursor()
    
    try:
        # Dividir el script en comandos individuales
        commands = script_content.split(';')
        
        for command in commands:
            command = command.strip()
            if command:
                cursor.execute(command)
        
        connection.commit()
        return True
    except Error as e:
        print(f"Error al ejecutar script: {e}")
        return False
    finally:
        cursor.close()
        connection.close()

def check_database_exists():
    """Verifica si la base de datos existe y tiene las tablas necesarias"""
    try:
        # Intentar conectar a la base de datos
        connection = mysql.connector.connect(
            host=DatabaseConfig.HOST,
            port=DatabaseConfig.PORT,
            user=DatabaseConfig.USER,
            password=DatabaseConfig.PASSWORD
        )
        
        cursor = connection.cursor()
        
        # Verificar si la base de datos existe
        cursor.execute(f"SHOW DATABASES LIKE '{DatabaseConfig.DATABASE}'")
        database_exists = cursor.fetchone() is not None
        
        if not database_exists:
            return False
        
        # Cambiar a la base de datos
        cursor.execute(f"USE {DatabaseConfig.DATABASE}")
        
        # Verificar si existen las tablas principales
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        required_tables = ['productos', 'categorias', 'usuarios', 'pedidos', 'items_carrito']
        
        for table in required_tables:
            if table not in tables:
                return False
        
        return True
    except Error as e:
        print(f"Error al verificar la base de datos: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def create_database():
    """Crea SOLO la estructura de la base de datos sin datos de ejemplo"""
    try:
        # Conectar al servidor MySQL sin seleccionar una base de datos
        connection = mysql.connector.connect(
            host=DatabaseConfig.HOST,
            port=DatabaseConfig.PORT,
            user=DatabaseConfig.USER,
            password=DatabaseConfig.PASSWORD
        )
        
        cursor = connection.cursor()
        
        # Crear la base de datos si no existe
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DatabaseConfig.DATABASE} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Base de datos '{DatabaseConfig.DATABASE}' creada o ya existente")
        
        # Usar la base de datos
        cursor.execute(f"USE {DatabaseConfig.DATABASE}")
        
        # Verificar si ya hay datos antes de insertar
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = %s", (DatabaseConfig.DATABASE,))
        tables_count = cursor.fetchone()[0]
        
        # Si no hay tablas, crear SOLO el esquema
        if tables_count == 0:
            print("Creando estructura de base de datos...")
            import os
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Ejecutar SOLO el esquema
            esquema_file = os.path.join(script_dir, 'esquema.sql')
            if os.path.exists(esquema_file):
                print(f"Ejecutando script: esquema.sql")
                with open(esquema_file, 'r', encoding='utf-8') as f:
                    script_content = f.read()
                
                # Eliminar líneas específicas que no son compatibles
                script_content = script_content.replace('USE talabarteria_rodriguez;', '')
                
                # Dividir el script en comandos individuales
                commands = script_content.split(';')
                
                for command in commands:
                    command = command.strip()
                    if command and not command.startswith('--'):
                        try:
                            cursor.execute(command)
                        except Error as e:
                            print(f"Error al ejecutar comando: {e}")
                            print(f"Comando problemático: {command[:100]}...")
                
                connection.commit()
                print("Estructura de base de datos creada exitosamente")
            else:
                print(f"Archivo esquema.sql no encontrado: {esquema_file}")
        else:
            print(f"La base de datos ya tiene {tables_count} tablas")
        
        # NO EJECUTAR NINGÚN SCRIPT DE INSERCIÓN DE DATOS
        print("Base de datos lista. No se insertaron datos de ejemplo.")
        
        return True
    except Error as e:
        print(f"Error al crear la base de datos: {e}")
        return False
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()