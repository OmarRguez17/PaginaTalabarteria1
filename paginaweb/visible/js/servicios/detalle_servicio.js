// JavaScript para la página de detalle de producto

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes
    initGaleriaProducto();
    initCantidadSelector();
    initTabs();
    initCompartir();
    initBackToTop();
    initProductosRelacionados();
    
    // Actualizar contador del carrito
    actualizarContadorCarrito();
});

/**
 * Función para regresar a la página anterior
 */
function goBack() {
    // Si hay historial, regresar
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Si no hay historial, ir a la página de productos
        window.location.href = '/servicios';
    }
}

/**
 * Inicializa la galería de producto
 */
function initGaleriaProducto() {
    const imagenPrincipal = document.getElementById('imagen-principal');
    const modalOverlay = document.getElementById('imagen-modal');
    const modalContent = document.getElementById('imagen-modal-content');
    
    if (imagenPrincipal) {
        // Click en imagen principal para abrir modal
        imagenPrincipal.addEventListener('click', function() {
            if (modalOverlay && modalContent) {
                modalContent.src = this.src;
                modalContent.alt = this.alt;
                modalOverlay.classList.add('active');
            }
        });
    }
    
    // Cerrar modal al hacer click fuera
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                cerrarModalImagen();
            }
        });
    }
    
    // Tecla ESC para cerrar modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            cerrarModalImagen();
        }
    });
}

/**
 * Cambia la imagen principal
 */
function cambiarImagenPrincipal(url, elemento) {
    const imagenPrincipal = document.getElementById('imagen-principal');
    if (imagenPrincipal) {
        imagenPrincipal.src = url;
    }
    
    // Actualizar clase activa en thumbnails
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    thumbnails.forEach(thumb => thumb.classList.remove('active'));
    elemento.classList.add('active');
}

/**
 * Cierra el modal de imagen
 */
function cerrarModalImagen() {
    const modalOverlay = document.getElementById('imagen-modal');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
}

/**
 * Inicializa el selector de cantidad
 */
function initCantidadSelector() {
    const cantidadInput = document.getElementById('cantidad-input');
    
    if (cantidadInput) {
        // Validar input manual
        cantidadInput.addEventListener('change', function() {
            const min = parseInt(this.min) || 1;
            const max = parseInt(this.max) || 999;
            let value = parseInt(this.value) || 1;
            
            if (value < min) value = min;
            if (value > max) value = max;
            
            this.value = value;
        });
    }
}

/**
 * Incrementa la cantidad
 */
function incrementarCantidad() {
    const cantidadInput = document.getElementById('cantidad-input');
    if (cantidadInput) {
        const max = parseInt(cantidadInput.max) || 999;
        let value = parseInt(cantidadInput.value) || 1;
        
        if (value < max) {
            cantidadInput.value = value + 1;
        }
    }
}

/**
 * Decrementa la cantidad
 */
function decrementarCantidad() {
    const cantidadInput = document.getElementById('cantidad-input');
    if (cantidadInput) {
        const min = parseInt(cantidadInput.min) || 1;
        let value = parseInt(cantidadInput.value) || 1;
        
        if (value > min) {
            cantidadInput.value = value - 1;
        }
    }
}

/**
 * Inicializa las tabs de información
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remover clase activa de todos los botones y paneles
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Activar botón y panel seleccionado
            this.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });
}

/**
 * Inicializa funciones de compartir
 */
function initCompartir() {
    // No se necesita inicialización adicional
}

/**
 * Comparte en Facebook
 */
function compartirFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    
    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${url}&t=${title}`,
        '_blank',
        'width=600,height=400'
    );
}

/**
 * Comparte en WhatsApp
 */
function compartirWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Mira este producto: ${document.title}`);
    
    window.open(
        `https://wa.me/?text=${text}%20${url}`,
        '_blank'
    );
}

/**
 * Copia el enlace al portapapeles
 */
function copiarEnlace() {
    const url = window.location.href;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Enlace copiado', 'El enlace ha sido copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error al copiar: ', err);
            showNotification('Error', 'No se pudo copiar el enlace', 'error');
        });
    } else {
        // Fallback para navegadores antiguos
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('Enlace copiado', 'El enlace ha sido copiado al portapapeles', 'success');
        } catch (err) {
            console.error('Error al copiar: ', err);
            showNotification('Error', 'No se pudo copiar el enlace', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

/**
 * Agrega un producto al carrito
 */
function agregarAlCarrito(productId) {
    const cantidadInput = document.getElementById('cantidad-input');
    const cantidad = cantidadInput ? parseInt(cantidadInput.value) : 1;
    
    // Obtener información del producto del DOM
    const productInfo = {
        id: productId.toString(),
        nombre: document.querySelector('.producto-info h1').textContent,
        categoria: document.querySelector('.producto-categoria').textContent.replace('Categoría: ', ''),
        precio: obtenerPrecioProducto(),
        imagen: document.getElementById('imagen-principal').src,
        cantidad: cantidad
    };
    
    // Añadir al carrito
    addItemToCarritoStorage(productInfo);
    
    // Actualizar contador
    actualizarContadorCarrito();
    
    // Mostrar notificación
    showNotification(
        'Producto añadido al carrito',
        `${productInfo.nombre} (${cantidad} unidad${cantidad > 1 ? 'es' : ''}) ha sido añadido a tu carrito de compras.`,
        'success'
    );
    
    // Actualizar texto del botón
    const botonAgregar = document.getElementById('btn-agregar-carrito');
    if (botonAgregar) {
        const textoOriginal = botonAgregar.innerHTML;
        const unidades = cantidad > 1 ? 'unidades' : 'unidad';
        
        // Cambiar el texto del botón
        botonAgregar.innerHTML = `
            <ion-icon name="checkmark-circle-outline"></ion-icon>
            Producto agregado (${cantidad} ${unidades})
        `;
        botonAgregar.classList.add('added');
        
        // Restaurar el texto original después de 3 segundos
        setTimeout(() => {
            botonAgregar.innerHTML = textoOriginal;
            botonAgregar.classList.remove('added');
        }, 3000);
    }
    
    // Animar el botón de carrito flotante si existe
    const carritoFlotante = document.querySelector('.carrito-flotante .carrito-btn');
    if (carritoFlotante) {
        carritoFlotante.classList.add('pulse');
        setTimeout(() => {
            carritoFlotante.classList.remove('pulse');
        }, 1000);
    }
}

/**
 * Obtiene el precio del producto actual
 */
function obtenerPrecioProducto() {
    const precioDescuento = document.querySelector('.precio-descuento');
    const precioNormal = document.querySelector('.precio-normal');
    
    let precio = 0;
    
    if (precioDescuento) {
        precio = precioDescuento.textContent.replace('$', '').trim();
    } else if (precioNormal) {
        precio = precioNormal.textContent.replace('$', '').trim();
    }
    
    return parseFloat(precio) || 0;
}

/**
 * Añade un producto al carrito (localStorage)
 */
function addItemToCarritoStorage(productInfo) {
    let carritoItems = [];
    
    try {
        // Obtener items actuales
        const storedItems = localStorage.getItem('carritoItems');
        if (storedItems) {
            carritoItems = JSON.parse(storedItems);
        }
        
        // Verificar si el producto ya está en el carrito
        const existingItemIndex = carritoItems.findIndex(item => item.id === productInfo.id);
        
        if (existingItemIndex >= 0) {
            // Incrementar cantidad si ya existe
            carritoItems[existingItemIndex].cantidad += productInfo.cantidad;
        } else {
            // Añadir nuevo item si no existe
            carritoItems.push(productInfo);
        }
        
        // Guardar en localStorage
        localStorage.setItem('carritoItems', JSON.stringify(carritoItems));
        
    } catch (e) {
        console.error('Error al añadir al carrito en localStorage:', e);
    }
}

/**
 * Actualiza el contador del carrito
 */
function actualizarContadorCarrito() {
    // Buscar todos los elementos de contador de carrito
    const contadores = document.querySelectorAll('.carrito-contador');
    
    try {
        // Obtener items actuales
        const storedItems = localStorage.getItem('carritoItems');
        if (storedItems) {
            const carritoItems = JSON.parse(storedItems);
            const totalItems = carritoItems.reduce((total, item) => total + item.cantidad, 0);
            
            // Actualizar todos los contadores
            contadores.forEach(contador => {
                contador.textContent = totalItems;
            });
        } else {
            // Si no hay items, mostrar 0
            contadores.forEach(contador => {
                contador.textContent = '0';
            });
        }
    } catch (e) {
        console.error('Error al actualizar contador del carrito:', e);
        contadores.forEach(contador => {
            contador.textContent = '0';
        });
    }
}

/**
 * Inicializa el botón de volver arriba
 */
function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    if (!backToTopButton) return;
    
    // Mostrar/ocultar botón según posición de scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });
    
    // Volver arriba al hacer clic
    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Inicializa los botones de productos relacionados
 */
function initProductosRelacionados() {
    const addToCartButtons = document.querySelectorAll('.productos-relacionados-section .btn-add-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            
            // Obtener información del producto
            const productCard = this.closest('.producto-card');
            if (productCard) {
                const productInfo = {
                    id: productId,
                    nombre: productCard.querySelector('h3').textContent.trim(),
                    categoria: productCard.querySelector('.producto-categoria').textContent,
                    precio: getPrecioFromCard(productCard),
                    imagen: productCard.querySelector('.producto-imagen img').src,
                    cantidad: 1
                };
                
                // Añadir al carrito
                addItemToCarritoStorage(productInfo);
                
                // Actualizar contador
                actualizarContadorCarrito();
                
                // Mostrar notificación
                showNotification(
                    'Producto añadido al carrito',
                    `${productInfo.nombre} ha sido añadido a tu carrito de compras.`,
                    'success'
                );
                
                // Animar el botón
                this.classList.add('added');
                const originalHTML = this.innerHTML;
                this.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Añadido';
                
                setTimeout(() => {
                    this.classList.remove('added');
                    this.innerHTML = originalHTML;
                }, 1500);
            }
        });
    });
}

/**
 * Obtiene el precio de una tarjeta de producto
 */
function getPrecioFromCard(card) {
    const priceDiscount = card.querySelector('.price-discount');
    const priceNormal = card.querySelector('.price-normal');
    
    let price = '';
    if (priceDiscount) {
        price = priceDiscount.textContent.replace('$', '').trim();
    } else if (priceNormal) {
        price = priceNormal.textContent.replace('$', '').trim();
    }
    
    return parseFloat(price) || 0;
}

/**
 * Muestra una notificación en la pantalla
 */
function showNotification(title, message, type = 'info') {
    let container = document.querySelector('.notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Crear la notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Icono según el tipo
    let icon = 'information-circle-outline';
    if (type === 'success') icon = 'checkmark-circle-outline';
    if (type === 'error') icon = 'alert-circle-outline';
    
    // Estructura de la notificación
    notification.innerHTML = `
        <div class="notification-icon">
            <ion-icon name="${icon}"></ion-icon>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <ion-icon name="close-outline"></ion-icon>
        </button>
    `;
    
    // Añadir al contenedor
    container.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar el botón de cerrar
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        closeNotification(notification, container);
    });
    
    // Auto cerrar después de 10 segundos (aumentado de 6)
    setTimeout(() => {
        closeNotification(notification, container);
    }, 10000);
}

/**
 * Cierra una notificación
 */
function closeNotification(notification, container) {
    if (!notification || !container) return;
    
    // Solo cerrar si sigue en el DOM
    if (notification.parentNode === container) {
        notification.classList.remove('show');
        
        // Eliminar después de la transición
        setTimeout(() => {
            if (notification.parentNode === container) {
                container.removeChild(notification);
            }
        }, 300);
    }
}

// Añadir animación de pulso para el botón de carrito flotante
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% {
            transform: scale(1);
            box-shadow: 0 0.3em 1em rgba(0, 0, 0, 0.2);
        }
        50% {
            transform: scale(1.1);
            box-shadow: 0 0.5em 1.5em rgba(0, 0, 0, 0.3);
        }
        100% {
            transform: scale(1);
            box-shadow: 0 0.3em 1em rgba(0, 0, 0, 0.2);
        }
    }
    
    .carrito-flotante .carrito-btn.pulse {
        animation: pulse 0.6s ease-out;
    }
`;
document.head.appendChild(style);