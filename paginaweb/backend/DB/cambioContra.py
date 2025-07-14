import bcrypt

# Generar hash bcrypt para 'admin123'
password = 'admin123'
salt = bcrypt.gensalt()
hash_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
hash_string = hash_bytes.decode('utf-8')

print("Hash bcrypt generado para 'admin123':")
print(hash_string)
print("\n")

# SQL para actualizar las contraseñas
print("-- SQL para actualizar las contraseñas en la base de datos:")
print(f"UPDATE usuarios SET contrasena_hash = '{hash_string}' WHERE correo IN ('admin@talabarteriarodriguez.com', 'ventas@talabarteriarodriguez.com', 'cliente@ejemplo.com');")

# Verificar que el hash funciona
test_password = 'admin123'
print("\n-- Verificando que el hash funciona correctamente:")
if bcrypt.checkpw(test_password.encode('utf-8'), hash_string.encode('utf-8')):
    print("✓ Verificación exitosa: el hash es correcto para 'admin123'")
else:
    print("✗ Error: el hash no coincide con 'admin123'")