class Config:
    """Configuración de la aplicación"""
    
    # Configuración básica
    DEBUG = True
    SECRET_KEY = 'mi_clave_secreta_super_segura'
    HOST = '0.0.0.0'
    PORT = 5000
    
    # Configuración de base de datos MySQL
    DB_CONFIG = {
        'host': 'localhost',
        'port': 3306,
        'user': 'root',
        'password': '123456',
        'database': 'talabarteria_rodriguez'
    }
    
    # Configuración de rutas
    PUBLIC_FOLDER = 'publico'
    
    # Paginación
    PRODUCTS_PER_PAGE = 12