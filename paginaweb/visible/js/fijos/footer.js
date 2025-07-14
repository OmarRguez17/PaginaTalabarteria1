document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const backToTopButton = document.getElementById('backToTop');
    const currentYearElements = document.querySelectorAll('.current-year');
    const leatherMedallion = document.querySelector('.leather-medallion');
    const socialButtons = document.querySelectorAll('.social-leather-button');
    const newsletterForm = document.querySelector('.leather-form');
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.leather-modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    // Actualizar el año actual en el footer
    const currentYear = new Date().getFullYear();
    currentYearElements.forEach(element => {
        element.textContent = currentYear;
    });
    
    // Sistema de tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Quitar la clase active de todas las tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Añadir la clase active a la tab clickeada
            this.classList.add('active');
            
            // Obtener el contenido asociado a esta tab
            const tabId = this.getAttribute('data-tab');
            
            // Ocultar todos los contenidos
            tabContents.forEach(content => {
                content.classList.remove('active');
                
                // Añadir animación de salida
                content.style.animation = 'none';
                content.offsetHeight; // Force reflow
                content.style.animation = '';
            });
            
            // Mostrar el contenido seleccionado
            const activeContent = document.getElementById(tabId);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        });
    });
    
    // Función para manejar el botón de volver arriba
    function handleBackToTop() {
        if (window.scrollY > 400) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    }
    
    // Eventos de scroll para el botón de volver arriba
    window.addEventListener('scroll', handleBackToTop);
    
    // Clic en el botón de volver arriba con animación suave
    if (backToTopButton) {
        backToTopButton.addEventListener('click', function() {
            // Animación suave para volver arriba
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Efecto 3D para el medallón de cuero
    if (leatherMedallion) {
        leatherMedallion.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // Posición X del mouse dentro del elemento
            const y = e.clientY - rect.top; // Posición Y del mouse dentro del elemento
            
            // Calcular rotación basada en la posición del mouse
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Limitar el ángulo de rotación a un máximo de 15 grados
            const maxRotation = 15;
            
            // Calcular rotación (X invertido ya que queremos rotar en dirección opuesta)
            const rotateY = maxRotation * (x - centerX) / centerX;
            const rotateX = -1 * maxRotation * (y - centerY) / centerY;
            
            // Aplicar transformación con perspectiva
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        // Resetear rotación al salir del elemento
        leatherMedallion.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }
    
    // Efectos de shine y pulsación para botones sociales
    socialButtons.forEach(button => {
        // Efecto de shine al hover
        button.addEventListener('mouseenter', function() {
            const shine = this.querySelector('.button-shine');
            shine.style.transition = 'transform 1s ease';
            shine.style.transform = 'rotate(360deg)';
            
            // Animar ícono
            const icon = this.querySelector('ion-icon');
            animateElement(icon, [
                { transform: 'scale(1)', filter: 'drop-shadow(0 0.125rem 0.25rem rgba(0, 0, 0, 0.5))' },
                { transform: 'scale(1.2)', filter: 'drop-shadow(0 0.25rem 0.5rem rgba(0, 0, 0, 0.6))' },
                { transform: 'scale(1.1)', filter: 'drop-shadow(0 0.25rem 0.5rem rgba(0, 0, 0, 0.6))' }
            ], {
                duration: 400,
                easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fill: 'forwards'
            });
        });
        
        button.addEventListener('mouseleave', function() {
            const shine = this.querySelector('.button-shine');
            shine.style.transition = 'transform 1s ease';
            shine.style.transform = 'rotate(0deg)';
            
            // Resetear animación del ícono
            const icon = this.querySelector('ion-icon');
            animateElement(icon, [
                { transform: 'scale(1.1)', filter: 'drop-shadow(0 0.25rem 0.5rem rgba(0, 0, 0, 0.6))' },
                { transform: 'scale(1)', filter: 'drop-shadow(0 0.125rem 0.25rem rgba(0, 0, 0, 0.5))' }
            ], {
                duration: 300,
                easing: 'ease-out',
                fill: 'forwards'
            });
        });
    });
    
    // Manejar el envío del formulario de newsletter
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const checkBox = this.querySelector('input[type="checkbox"]');
            const email = emailInput.value.trim();
            
            if (email && checkBox.checked) {
                // Aquí normalmente enviarías el email al servidor
                // Para este ejemplo, solo mostraremos una notificación
                
                // Limpiar el input
                emailInput.value = '';
                
                // Mostrar notificación de éxito con la función del header
                if (window.showNotification) {
                    window.showNotification('¡Gracias por suscribirte! Te mantendremos informado.', 'success', 5000);
                } else {
                    // Fallback si no existe la función (para pruebas)
                    alert('¡Gracias por suscribirte! Te mantendremos informado.');
                }
            } else if (!checkBox.checked) {
                // Notificar que debe aceptar recibir emails
                if (window.showNotification) {
                    window.showNotification('Por favor, acepta recibir comunicaciones por email.', 'warning', 5000);
                } else {
                    alert('Por favor, acepta recibir comunicaciones por email.');
                }
            }
        });
    }// Función para abrir modales
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Primero hacemos visible el modal
            modal.style.visibility = 'visible';
            modal.style.opacity = '0';
            
            // Forzar repintado
            modal.offsetHeight;
            
            // Luego aplicamos la transición
            modal.classList.add('active');
            
            // Bloquear scroll en el body
            document.body.style.overflow = 'hidden';
            
            // Animar la entrada del modal
            const container = modal.querySelector('.modal-container');
            if (container) {
                animateElement(container, [
                    { transform: 'scale(0.9) translateY(1rem)', opacity: 0 },
                    { transform: 'scale(1) translateY(0)', opacity: 1 }
                ], {
                    duration: 400,
                    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    fill: 'forwards'
                });
            }
            
            // Animar las esquinas de cuero
            const corners = modal.querySelectorAll('.leather-corner');
            corners.forEach((corner, index) => {
                setTimeout(() => {
                    corner.style.transition = 'background-color 0.5s ease';
                    corner.style.backgroundColor = 'var(--leather-medium)';
                }, index * 100);
            });
        }
    }
    
    // Función para cerrar modales
    function closeModal(modal) {
        if (modal) {
            const container = modal.querySelector('.modal-container');
            const corners = modal.querySelectorAll('.leather-corner');
            
            // Resetear las esquinas
            corners.forEach((corner, index) => {
                setTimeout(() => {
                    corner.style.transition = 'background-color 0.3s ease';
                    corner.style.backgroundColor = 'var(--leather-dark)';
                }, index * 50);
            });
            
            // Animar la salida del modal
            if (container) {
                const animation = animateElement(container, [
                    { transform: 'scale(1) translateY(0)', opacity: 1 },
                    { transform: 'scale(0.9) translateY(1rem)', opacity: 0 }
                ], {
                    duration: 300,
                    easing: 'ease-out',
                    fill: 'forwards'
                });
                
                animation.onfinish = () => {
                    modal.classList.remove('active');
                    
                    // Después de la animación, ocultamos completamente
                    setTimeout(() => {
                        modal.style.visibility = 'hidden';
                        modal.style.opacity = '0';
                        
                        // Desbloquear scroll en el body
                        document.body.style.overflow = '';
                    }, 300);
                };
            } else {
                modal.classList.remove('active');
                
                // Desbloquear scroll en el body
                document.body.style.overflow = '';
            }
        }
    }
    
    // Eventos para abrir modales
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            openModal(modalId);
        });
    });
    
    // Eventos para cerrar modales
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.leather-modal');
            closeModal(modal);
        });
    });
    
    // Cerrar modal al hacer clic en el overlay
    modals.forEach(modal => {
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function() {
                closeModal(modal);
            });
        }
    });
    
    // Cerrar modal con la tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.leather-modal.active');
            if (activeModal) {
                closeModal(activeModal);
            }
        }
    });
    
    // Animación de partículas doradas
    function animateGoldParticles() {
        const particles = document.querySelector('.gold-particles');
        if (particles) {
            // Crear efecto de brillo aleatorio
            setInterval(() => {
                const randomX = Math.floor(Math.random() * 100);
                const randomY = Math.floor(Math.random() * 100);
                const size = Math.random() * 50 + 50; // Tamaño entre 50 y 100
                
                const particle = document.createElement('div');
                particle.classList.add('gold-sparkle');
                particle.style.left = `${randomX}%`;
                particle.style.top = `${randomY}%`;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                particles.appendChild(particle);
                
                // Eliminar partícula después de la animación
                setTimeout(() => {
                    if (particle.parentNode === particles) {
                        particles.removeChild(particle);
                    }
                }, 1500);
            }, 800);
        }
    }
    
    // Iniciar animación de partículas
    animateGoldParticles();
    
    // Agregar estilos para partículas adicionales
    const sparkleStyle = document.createElement('style');
    sparkleStyle.textContent = `
        .gold-sparkle {
            position: absolute;
            background: radial-gradient(circle at center, var(--gold-shine) 0%, transparent 70%);
            border-radius: 50%;
            opacity: 0;
            z-index: 5;
            pointer-events: none;
            animation: sparkle 1.5s ease-out forwards;
        }
        
        @keyframes sparkle {
            0% { transform: scale(0); opacity: 0; }
            20% { transform: scale(1); opacity: 0.8; }
            100% { transform: scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(sparkleStyle);
    
    // Efectos de hover para enlaces de cuero
    const leatherLinks = document.querySelectorAll('.leather-link');
    leatherLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            const icon = this.querySelector('ion-icon');
            if (icon) {
                icon.style.transition = 'transform 0.3s ease, color 0.3s ease';
                icon.style.transform = 'translateX(0.25rem) scale(1.1)';
                icon.style.color = 'var(--gold-shine)';
            }
        });
        
        link.addEventListener('mouseleave', function() {
            const icon = this.querySelector('ion-icon');
            if (icon) {
                icon.style.transition = 'transform 0.3s ease, color 0.3s ease';
                icon.style.transform = '';
                icon.style.color = '';
            }
        });
    });
    
    // Efecto de desplazamiento para las tarjetas de cuero
    const leatherCards = document.querySelectorAll('.leather-card, .connect-leather-card');
    leatherCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calcular la posición relativa del mouse (0-1)
            const xPercent = x / rect.width;
            const yPercent = y / rect.height;
            
            // Calcular la rotación (max 5 grados)
            const maxRotation = 5;
            const rotateX = (0.5 - yPercent) * maxRotation;
            const rotateY = (xPercent - 0.5) * maxRotation;
            
            // Aplicar transformación con perspectiva
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Efecto de brillo basado en la posición del mouse
            this.style.background = `linear-gradient(145deg, 
                var(--leather-medium) 0%, 
                var(--leather-light) 50%, 
                var(--leather-medium) 100%)`;
            
            // Efecto de sombra dinámica
            this.style.boxShadow = `
                ${-rotateY/2}px ${-rotateX/2}px 15px rgba(0,0,0,0.1),
                ${rotateY}px ${rotateX}px 20px rgba(0,0,0,0.3)
            `;
        });
        
        // Resetear al salir
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.background = '';
            this.style.boxShadow = '';
        });
    });
    
    // Animación para las costuras
    const stitches = document.querySelectorAll('.stitch, .stitch-line');
    function animateStitches() {
        stitches.forEach((stitch, index) => {
            setTimeout(() => {
                stitch.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.3)';
                setTimeout(() => {
                    stitch.style.boxShadow = 'none';
                }, 300);
            }, index * 200);
        });
    }
    
    // Animar costuras periódicamente
    setInterval(animateStitches, 5000);
    
    // Observador de intersección para elementos con animación
    const elementsToAnimate = document.querySelectorAll('.footer-info, .footer-nav-section, .footer-connect, .stitched-divider, .footer-bottom');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(30px)';
                
                // Forzar reflow
                entry.target.offsetHeight;
                
                // Aplicar animación
                entry.target.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                
                // Dejar de observar después de animar
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observar elementos
    elementsToAnimate.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        observer.observe(element);
    });
});

// Funciones de utilidad para animaciones
function animateElement(element, keyframes, options) {
    return element.animate(keyframes, options);
}

// Añadir efecto parallax a elementos del fondo
document.addEventListener('scroll', function() {
    const scrollY = window.scrollY;
    const footer = document.querySelector('.spectacular-footer');
    
    if (footer && isElementInViewport(footer)) {
        // Calcular la posición relativa del footer en el viewport
        const footerRect = footer.getBoundingClientRect();
        const footerTop = footerRect.top;
        const windowHeight = window.innerHeight;
        
        // Parallax para elementos decorativos
        const decorativeElements = footer.querySelectorAll('.leather-strap, .stitch-pattern, .leather-corner');
        decorativeElements.forEach(element => {
            const speed = element.classList.contains('leather-strap') ? 0.1 : 0.05;
            const yOffset = (footerTop - windowHeight) * speed;
            element.style.transform = `translateY(${yOffset}px)`;
        });
        
        // Efecto para la textura de cuero
        const leatherTexture = footer.querySelector('.footer-leather-texture');
        if (leatherTexture) {
            leatherTexture.style.backgroundPosition = `0 ${scrollY * 0.03}px`;
        }
    }
});

// Función para verificar si un elemento está visible en el viewport
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.bottom >= 0 &&
        rect.right >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.left <= (window.innerWidth || document.documentElement.clientWidth)
    );
}