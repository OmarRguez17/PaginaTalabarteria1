document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const menuOverlay = document.getElementById('menuOverlay');
    const notificationContainer = document.querySelector('.notification-container');
    
    // Función para mostrar/ocultar el menú móvil
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            mainNav.classList.toggle('active');
            menuOverlay.classList.toggle('active');
            
            // Bloquear scroll en el body cuando el menú está abierto
            if (mainNav.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
    
    // Función para cerrar el menú al hacer clic en el overlay
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function() {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Cerrar menú al hacer clic en enlaces
    const navLinks = document.querySelectorAll('#mainNav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Solo si estamos en versión móvil
            if (window.innerWidth <= 768) {
                menuToggle.classList.remove('active');
                mainNav.classList.remove('active');
                menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Sistema de notificaciones para el administrador
    window.showAdminNotification = function(message, type = 'default', duration = 5000) {
        // Crear la notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Agregar contenido
        const notificationContent = document.createElement('div');
        notificationContent.className = 'notification-content';
        
        // Añadir icono según tipo
        const icon = document.createElement('ion-icon');
        switch (type) {
            case 'success':
                icon.setAttribute('name', 'checkmark-circle-outline');
                break;
            case 'error':
                icon.setAttribute('name', 'alert-circle-outline');
                break;
            case 'warning':
                icon.setAttribute('name', 'warning-outline');
                break;
            case 'info':
                icon.setAttribute('name', 'information-circle-outline');
                break;
            default:
                icon.setAttribute('name', 'notifications-outline');
        }
        
        notificationContent.appendChild(icon);
        
        // Añadir texto
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        notificationContent.appendChild(messageSpan);
        
        // Añadir botón cerrar
        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', function() {
            closeNotification(notification);
        });
        
        // Ensamblar todo
        notification.appendChild(notificationContent);
        notification.appendChild(closeButton);
        
        // Añadir al contenedor
        notificationContainer.appendChild(notification);
        
        // Forzar repintado
        notification.offsetHeight;
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Configurar autoclose
        const timeout = setTimeout(() => {
            closeNotification(notification);
        }, duration);
        
        // Almacenar timeout para poder cancelarlo
        notification.dataset.timeout = timeout;
        
        return notification;
    };
    
    // Función para cerrar notificación con animación
    function closeNotification(notification) {
        // Cancelar el timeout si existe
        if (notification.dataset.timeout) {
            clearTimeout(parseInt(notification.dataset.timeout));
        }
        
        // Remover clase show para iniciar animación de salida
        notification.classList.remove('show');
        
        // Esperar a que termine la animación antes de remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    // Gestión de scroll para efectos
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Iniciar comprobando el scroll
    if (window.scrollY > 20) {
        header.classList.add('scrolled');
    }
    
    // Cerrar menú al cambiar tamaño de ventana
    window.addEventListener('resize', function() {
        // Si pasamos a tamaño grande, cerrar el menú móvil
        if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
            menuToggle.classList.remove('active');
            mainNav.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Mostrar tiempo de sesión activa en el panel de administrador
    function iniciarRelojSesion() {
        const sessionStartTime = localStorage.getItem('adminSessionStartTime') || Date.now();
        localStorage.setItem('adminSessionStartTime', sessionStartTime);
        
        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            setInterval(() => {
                const currentTime = Date.now();
                const elapsedTime = Math.floor((currentTime - sessionStartTime) / 1000);
                
                const hours = Math.floor(elapsedTime / 3600);
                const minutes = Math.floor((elapsedTime % 3600) / 60);
                const seconds = elapsedTime % 60;
                
                timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        }
    }
    
    // Si estamos en una página de administrador, iniciar el reloj de sesión
    if (window.location.pathname.includes('/admin')) {
        iniciarRelojSesion();
    }
});