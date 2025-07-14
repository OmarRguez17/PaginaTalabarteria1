# encontrar_problema.py
import os
import mysql.connector
from backend.DB.db_manager import DatabaseConfig

def encontrar_origen_datos():
    print("=== DIAGNÓSTICO COMPLETO ===\n")
    
    # 1. Buscar TODOS los archivos SQL
    print("1. Buscando archivos SQL con INSERT...")
    sql_files_with_insert = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.sql'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'INSERT INTO' in content.upper():
                            sql_files_with_insert.append(filepath)
                            print(f"   ENCONTRADO: {filepath}")
                except:
                    pass
    
    # 2. Buscar en TODOS los archivos Python
    print("\n2. Buscando archivos Python que ejecuten SQL...")
    suspicious_py_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if any(pattern in content for pattern in [
                            'execute_script', 'INSERT INTO', 'datos.sql', 
                            'data.sql', 'insert_sample_data', 'initialize_data'
                        ]):
                            suspicious_py_files.append(filepath)
                            print(f"   SOSPECHOSO: {filepath}")
                except:
                    pass
    
    # 3. Revisar triggers en la BD
    print("\n3. Verificando triggers en la base de datos...")
    try:
        conn = mysql.connector.connect(
            host=DatabaseConfig.HOST,
            port=DatabaseConfig.PORT,
            user=DatabaseConfig.USER,
            password=DatabaseConfig.PASSWORD,
            database=DatabaseConfig.DATABASE
        )
        cursor = conn.cursor()
        
        cursor.execute("SHOW TRIGGERS")
        triggers = cursor.fetchall()
        
        if triggers:
            print("   TRIGGERS ENCONTRADOS:")
            for trigger in triggers:
                print(f"   - {trigger[0]} on {trigger[2]}")
        else:
            print("   No hay triggers")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"   Error: {e}")
    
    # 4. Mostrar resumen
    print("\n=== RESUMEN ===")
    print(f"Archivos SQL con INSERT: {len(sql_files_with_insert)}")
    for file in sql_files_with_insert:
        print(f"  - {file}")
    
    print(f"\nArchivos Python sospechosos: {len(suspicious_py_files)}")
    for file in suspicious_py_files:
        print(f"  - {file}")
    
    print("\n=== ACCIÓN REQUERIDA ===")
    if sql_files_with_insert:
        print("1. ELIMINA estos archivos SQL con INSERT:")
        for file in sql_files_with_insert:
            print(f"   rm {file}")
    
    if suspicious_py_files:
        print("\n2. REVISA estos archivos Python y elimina cualquier código que ejecute INSERT:")
        for file in suspicious_py_files:
            print(f"   - {file}")
    
    print("\n3. Ejecuta el script de limpieza final")

if __name__ == "__main__":
    encontrar_origen_datos()