// JavaScript para el Dashboard Home

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar indicador de carga
    const pageLoader = document.querySelector('.page-loader');
    
    // Inicializar componentes cuando la página esté cargada
    window.addEventListener('load', function() {
        // Ocultar indicador de carga
        if (pageLoader) {
            setTimeout(() => {
                pageLoader.classList.add('hidden');
                setTimeout(() => {
                    pageLoader.style.display = 'none';
                }, 500);
            }, 500);
        }
        
        // Inicializar todos los componentes
        initSidebarNavigation();
        initActionCards();
        initProductCards();
        initOrdersTable();
        initStatCards();
        initNotifications();
        
        // Animar elementos al cargar
        animateElements();
    });
});

/**
 * Inicializa la navegación del sidebar
 */
function initSidebarNavigation() {
    const navLinks = document.querySelectorAll('.dashboard-nav a');
    const currentPath = window.location.pathname;
    
    navLinks.forEach(link => {
        // Marcar el enlace activo según la URL actual
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        }
        
        // Agregar efecto hover con retraso
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
        });
    });
}

/**
 * Inicializa las tarjetas de acción
 */
function initActionCards() {
    const actionCards = document.querySelectorAll('.action-card');
    
    actionCards.forEach(card => {
        // Efecto de clic
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Efecto ripple
            createRipple(e, this);
            
            // Navegar después de un breve retraso
            setTimeout(() => {
                window.location.href = this.getAttribute('href');
            }, 300);
        });
    });
}

/**
 * Inicializa las tarjetas de productos
 */
function initProductCards() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        // Efecto hover 3D sutil
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

/**
 * Inicializa la tabla de órdenes
 */
function initOrdersTable() {
    const orderRows = document.querySelectorAll('.orders-table tbody tr');
    
    orderRows.forEach(row => {
        // Efecto hover en las filas
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f9f9f9';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        
        // Click en la fila completa
        row.addEventListener('click', function(e) {
            // Evitar que el click en el botón active este evento
            if (e.target.tagName !== 'A') {
                const viewButton = this.querySelector('.btn-view');
                if (viewButton) {
                    viewButton.click();
                }
            }
        });
    });
}

/**
 * Inicializa las tarjetas de estadísticas
 */
function initStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach((card, index) => {
        // Animación de números
        const numberElement = card.querySelector('h3');
        if (numberElement) {
            const finalNumber = parseInt(numberElement.textContent);
            animateNumber(numberElement, 0, finalNumber, 1000 + (index * 100));
        }
    });
}

/**
 * Anima un número desde un valor inicial hasta uno final
 * @param {HTMLElement} element - Elemento a animar
 * @param {number} start - Valor inicial
 * @param {number} end - Valor final
 * @param {number} duration - Duración en milisegundos
 */
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Función easing
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const currentNumber = Math.floor(start + (end - start) * easeOutQuart);
        element.textContent = currentNumber;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

/**
 * Crea un efecto ripple en el elemento clickeado
 * @param {Event} e - Evento de click
 * @param {HTMLElement} element - Elemento donde crear el ripple
 */
function createRipple(e, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    element.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

/**
 * Inicializa las notificaciones
 */
function initNotifications() {
    // Revisar si hay mensajes de bienvenida o notificaciones pendientes
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';
    
    if (message) {
        showNotification('Notificación', decodeURIComponent(message), type);
    }
    
    // Mostrar mensaje de bienvenida la primera vez
    if (sessionStorage.getItem('showWelcome') === 'true') {
        showNotification(
            '¡Bienvenido!', 
            'Has iniciado sesión correctamente', 
            'success'
        );
        sessionStorage.removeItem('showWelcome');
    }
}

/**
 * Muestra una notificación en la pantalla
 * @param {string} title - Título de la notificación
 * @param {string} message - Mensaje de la notificación
 * @param {string} type - Tipo: 'success', 'error', 'info'
 */
function showNotification(title, message, type = 'info') {
    const container = document.querySelector('.notification-container');
    
    if (!container) return;
    
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
    
    // Auto cerrar después de un tiempo
    setTimeout(() => {
        closeNotification(notification, container);
    }, 6000);
}

/**
 * Cierra una notificación
 * @param {HTMLElement} notification - Elemento de notificación
 * @param {HTMLElement} container - Contenedor de notificaciones
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

/**
 * Anima elementos al cargar la página
 */
function animateElements() {
    // Elementos a animar
    const elements = [
        ...document.querySelectorAll('.stat-card'),
        ...document.querySelectorAll('.action-card'),
        ...document.querySelectorAll('.product-card'),
        ...document.querySelectorAll('.orders-table tbody tr')
    ];
    
    // Animar con retraso escalonado
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

/**
 * Maneja la carga dinámica de más productos
 */
function loadMoreProducts() {
    // Esta función podría implementarse si se desea cargar más productos dinámicamente
    const loadMoreButton = document.querySelector('.load-more-products');
    
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', async function() {
            try {
                // Simulación de carga
                this.innerHTML = '<span class="spinner"></span> Cargando...';
                this.disabled = true;
                
                // Aquí iría la llamada AJAX real
                // const response = await fetch('/api/productos/recomendados');
                // const data = await response.json();
                
                // Por ahora, solo simulamos el comportamiento
                setTimeout(() => {
                    this.innerHTML = 'Cargar más productos';
                    this.disabled = false;
                    
                    showNotification(
                        'Información', 
                        'No hay más productos para mostrar', 
                        'info'
                    );
                }, 1500);
                
            } catch (error) {
                console.error('Error cargando productos:', error);
                showNotification(
                    'Error', 
                    'No se pudieron cargar más productos', 
                    'error'
                );
            }
        });
    }
}

/**
 * Maneja el responsive del sidebar
 */
function handleSidebarResponsive() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sidebar-toggle';
    toggleButton.innerHTML = '<ion-icon name="menu-outline"></ion-icon>';
    
    // Solo agregar el botón en móviles
    if (window.innerWidth <= 768) {
        document.body.appendChild(toggleButton);
        
        toggleButton.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
        
        // Cerrar sidebar al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!sidebar.contains(e.target) && !toggleButton.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
    
    // Manejar cambios de tamaño de ventana
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            if (document.body.contains(toggleButton)) {
                document.body.removeChild(toggleButton);
            }
        } else if (!document.body.contains(toggleButton)) {
            document.body.appendChild(toggleButton);
        }
    });
}

// Llamar función para manejar responsive del sidebar
document.addEventListener('DOMContentLoaded', handleSidebarResponsive);

// Agregar estilos CSS dinámicamente para el efecto ripple
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .sidebar-toggle {
        display: none;
        position: fixed;
        top: 1em;
        left: 1em;
        z-index: 1000;
        background: #8B572A;
        color: white;
        border: none;
        border-radius: 0.5em;
        padding: 0.8em;
        font-size: 1.5em;
        cursor: pointer;
        box-shadow: 0 0.3em 1em rgba(0, 0, 0, 0.2);
    }
    
    @media (max-width: 768px) {
        .sidebar-toggle {
            display: block;
        }
        
        .dashboard-sidebar {
            position: fixed;
            left: -100%;
            top: 0;
            height: 100vh;
            z-index: 999;
            transition: left 0.3s ease;
        }
        
        .dashboard-sidebar.active {
            left: 0;
        }
    }
`;

document.head.appendChild(style);


 // Toggle sidebar en móvil
        function toggleSidebar() {
            document.querySelector('.admin-sidebar').classList.toggle('active');
        }
        
        // Toggle dropdown
        function toggleDropdown(button) {
            const dropdown = button.nextElementSibling;
            dropdown.classList.toggle('show');
            
            // Cerrar otros dropdowns
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdown) {
                    menu.classList.remove('show');
                }
            });
        }
        
        // Cerrar dropdowns al hacer click fuera
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
        
        // Animación de entrada para las tarjetas
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.stat-card, .dashboard-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(30px)';
                card.style.transition = 'all 0.6s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        });// Añadir estas funciones al archivo home.js

/**
 * Inicializa la sección de pedidos
 */
function initPedidosSection() {
    cargarPedidosRealizados();
}

/**
 * Carga los pedidos realizados desde localStorage
 */
function cargarPedidosRealizados() {
    const pedidosVacio = document.getElementById('pedidos-vacio');
    const pedidosLista = document.getElementById('pedidos-lista');
    
    if (!pedidosVacio || !pedidosLista) return;
    
    // Obtener pedidos del localStorage
    const pedidosGuardados = localStorage.getItem('pedidos');
    let pedidos = [];
    
    if (pedidosGuardados) {
        try {
            pedidos = JSON.parse(pedidosGuardados);
        } catch (e) {
            console.error('Error al parsear pedidos:', e);
            pedidos = [];
        }
    }
    
    if (pedidos.length === 0) {
        // Mostrar vista vacía
        pedidosVacio.classList.remove('hidden');
        pedidosLista.classList.add('hidden');
    } else {
        // Mostrar lista de pedidos
        pedidosVacio.classList.add('hidden');
        pedidosLista.classList.remove('hidden');
        
        // Ordenar pedidos por fecha (más recientes primero)
        pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        // Limpiar lista
        pedidosLista.innerHTML = '';
        
        // Crear cards para cada pedido
        pedidos.forEach(pedido => {
            const pedidoCard = crearPedidoCard(pedido);
            pedidosLista.appendChild(pedidoCard);
        });
    }
}

/**
 * Crea una card para mostrar un pedido
 */
function crearPedidoCard(pedido) {
    const card = document.createElement('div');
    card.className = 'pedido-card';
    
    // Formatear fecha
    const fecha = new Date(pedido.fecha);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Calcular total de items
    const totalItems = pedido.items.reduce((total, item) => total + item.cantidad, 0);
    
    // Determinar estado (en este caso siempre será pendiente)
    const estado = pedido.estado || 'pendiente';
    
    card.innerHTML = `
        <div class="pedido-icon">
            <ion-icon name="bag-handle-outline"></ion-icon>
        </div>
        <div class="pedido-info">
            <div class="pedido-id">#${pedido.id}</div>
            <div class="pedido-fecha">${fechaFormateada}</div>
            <div class="pedido-items">${totalItems} producto${totalItems > 1 ? 's' : ''}</div>
        </div>
        <div class="pedido-precio">
            <div class="pedido-total">$${pedido.total.toFixed(2)}</div>
            <span class="pedido-status ${estado}">
                <ion-icon name="${estado === 'completado' ? 'checkmark-circle' : 'time'}-outline"></ion-icon>
                ${estado === 'completado' ? 'Completado' : 'Pendiente'}
            </span>
            <a href="#" class="pedido-detalle-btn" onclick="verDetallePedido('${pedido.id}')">
                Ver detalles
                <ion-icon name="arrow-forward-outline"></ion-icon>
            </a>
        </div>
    `;
    
    return card;
}

/**
 * Muestra el detalle de un pedido (puedes expandir esta función)
 */
function verDetallePedido(pedidoId) {
    // Obtener pedidos del localStorage
    const pedidosGuardados = localStorage.getItem('pedidos');
    if (!pedidosGuardados) return;
    
    const pedidos = JSON.parse(pedidosGuardados);
    const pedido = pedidos.find(p => p.id === pedidoId);
    
    if (!pedido) return;
    
    // Aquí puedes crear un modal o expandir los detalles
    // Por ahora solo mostramos una notificación con los detalles
    const detalles = pedido.items.map(item => 
        `${item.nombre || item.name} x${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}`
    ).join('\n');
    
    showNotification(
        `Pedido #${pedido.id}`,
        `Productos:\n${detalles}\n\nTotal: $${pedido.total.toFixed(2)}`,
        'info'
    );
}

// Añadir a la función DOMContentLoaded existente
document.addEventListener('DOMContentLoaded', function() {
    // ... código existente ...
    
    window.addEventListener('load', function() {
        // ... código existente ...
        
        // Añadir inicialización de pedidos
        initPedidosSection();
        
        // ... resto del código ...
    });
});