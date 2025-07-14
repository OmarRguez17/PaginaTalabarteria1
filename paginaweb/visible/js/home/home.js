// JavaScript para la página de inicio - Versión mejorada

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
        initAnimations();
        initLazyLoading();
        initSliders();
        initCarritoButtons();
        initStatsCounter();
        initSectionNavigation();
        initScrollButtons();
        initBackToTop();
        initNewsletterForm();
        initCarritoFlotante();
        
        // Mostrar notificación de bienvenida
        setTimeout(() => {
            showNotification('¡Bienvenido a Talabartería Rodríguez!', 'Explora nuestros productos artesanales de alta calidad.', 'info');
        }, 1500);
    });
});

/**
 * Inicializa el carrito flotante
 */
function initCarritoFlotante() {
    // Actualizar contador del carrito al iniciar
    actualizarContadorCarrito();
    
    // Escuchar eventos de actualización del carrito
    window.addEventListener('carrito-actualizado', function() {
        actualizarContadorCarrito();
    });
}

/**
 * Actualiza el contador del carrito
 */
function actualizarContadorCarrito() {
    const contador = document.getElementById('carrito-contador');
    if (!contador) return;
    
    // Obtener carrito del localStorage
    const carrito = JSON.parse(localStorage.getItem('carritoItems') || '[]');
    const cantidad = carrito.reduce((total, item) => total + item.cantidad, 0);
    
    contador.textContent = cantidad;
    
    // Mostrar u ocultar el contador
    if (cantidad > 0) {
        contador.style.display = 'flex';
    } else {
        contador.style.display = 'none';
    }
}

/**
 * Inicializa las animaciones en scroll
 */
function initAnimations() {
    const animatedItems = document.querySelectorAll('.animate-item');
    
    if (animatedItems.length === 0) return;
    
    // Función para verificar si un elemento está visible
    const isElementInViewport = (el) => {
        const rect = el.getBoundingClientRect();
        return (
            rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85
        );
    };
    
    // Animar elementos inicialmente visibles
    animatedItems.forEach(item => {
        if (isElementInViewport(item)) {
            item.classList.add('animated');
        }
    });
    
    // Animar al hacer scroll
    const handleScroll = () => {
        animatedItems.forEach(item => {
            if (isElementInViewport(item) && !item.classList.contains('animated')) {
                item.classList.add('animated');
            }
        });
    };
    
    // Optimización del evento scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(handleScroll);
    });
}

/**
 * Inicializa la carga perezosa de imágenes
 */
function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    
    if (lazyImages.length === 0) return;
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    const parent = image.parentElement;
                    
                    // Cargar la imagen
                    image.src = image.dataset.src;
                    
                    // Cuando la imagen se carga, quitar clase de skeleton
                    image.onload = () => {
                        image.classList.add('loaded');
                        if (parent.classList.contains('skeleton-loading')) {
                            parent.classList.remove('skeleton-loading');
                        }
                    };
                    
                    imageObserver.unobserve(image);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback para navegadores antiguos
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.classList.add('loaded');
            const parent = img.parentElement;
            if (parent.classList.contains('skeleton-loading')) {
                parent.classList.remove('skeleton-loading');
            }
        });
    }
}

/**
 * Inicializa todos los sliders
 */
function initSliders() {
    // Inicializar slider de categorías
    initSlider({
        trackSelector: '.categories-track',
        slideSelector: '.category-slide',
        prevArrowSelector: '.categories-controls .prev-arrow',
        nextArrowSelector: '.categories-controls .next-arrow',
        paginationSelector: '.categories-pagination',
        slidesToShow: getSlidesToShow()
    });
    
    // Inicializar slider de productos destacados
    initSlider({
        trackSelector: '.featured-products-section .products-track',
        slideSelector: '.featured-products-section .product-slide',
        prevArrowSelector: '.featured-controls .prev-arrow',
        nextArrowSelector: '.featured-controls .next-arrow',
        paginationSelector: '.featured-pagination',
        slidesToShow: getSlidesToShow()
    });
    
    // Inicializar slider de productos nuevos
    initSlider({
        trackSelector: '.new-products-section .products-track',
        slideSelector: '.new-products-section .product-slide',
        prevArrowSelector: '.new-controls .prev-arrow',
        nextArrowSelector: '.new-controls .next-arrow',
        paginationSelector: '.new-pagination',
        slidesToShow: getSlidesToShow()
    });
    
    // Inicializar slider de testimonios
    if (document.querySelector('.testimonials-track')) {
        initSlider({
            trackSelector: '.testimonials-track',
            slideSelector: '.testimonial-slide',
            prevArrowSelector: '.testimonials-controls .prev-arrow',
            nextArrowSelector: '.testimonials-controls .next-arrow',
            paginationSelector: '.testimonials-pagination',
            slidesToShow: getSlidesToShowForTestimonials()
        });
    }
    
    // Actualizar sliders al cambiar el tamaño de la ventana
    window.addEventListener('resize', () => {
        // Reinicializar todos los sliders con nuevos valores
        updateAllSliders();
    });
}

/**
 * Determina cuántos slides mostrar según el ancho de la ventana
 */
function getSlidesToShow() {
    const width = window.innerWidth;
    if (width < 480) return 1;
    if (width < 768) return 2;
    if (width < 992) return 3;
    return 4;
}

/**
 * Determina cuántos testimonios mostrar según el ancho de la ventana
 */
function getSlidesToShowForTestimonials() {
    const width = window.innerWidth;
    if (width < 768) return 1;
    if (width < 992) return 2;
    return 3;
}

/**
 * Actualiza todos los sliders con nuevos valores
 */
function updateAllSliders() {
    const slidesToShow = getSlidesToShow();
    const testimonialsSlidesToShow = getSlidesToShowForTestimonials();
    
    updateSlider('.categories-track', '.category-slide', slidesToShow);
    updateSlider('.featured-products-section .products-track', '.featured-products-section .product-slide', slidesToShow);
    updateSlider('.new-products-section .products-track', '.new-products-section .product-slide', slidesToShow);
    
    if (document.querySelector('.testimonials-track')) {
        updateSlider('.testimonials-track', '.testimonial-slide', testimonialsSlidesToShow);
    }
}

/**
 * Actualiza un slider específico
 */
function updateSlider(trackSelector, slideSelector, slidesToShow) {
    const track = document.querySelector(trackSelector);
    if (!track) return;
    
    const slides = track.querySelectorAll(slideSelector);
    if (slides.length === 0) return;
    
    // Resetear posición del track
    track.style.transform = 'translateX(0)';
    
    // Actualizar posición de los botones de paginación
    const currentSliderData = track.sliderData || {};
    currentSliderData.currentIndex = 0;
    currentSliderData.slidesToShow = slidesToShow;
    track.sliderData = currentSliderData;
    
    // Actualizar paginación
    updatePagination(currentSliderData);
}

/**
 * Inicializa un slider
 */
function initSlider(options) {
    const track = document.querySelector(options.trackSelector);
    const prevArrow = document.querySelector(options.prevArrowSelector);
    const nextArrow = document.querySelector(options.nextArrowSelector);
    const paginationContainer = document.querySelector(options.paginationSelector);
    
    if (!track || !prevArrow || !nextArrow || !paginationContainer) return;
    
    const slides = track.querySelectorAll(options.slideSelector);
    if (slides.length === 0) return;
    
    // Almacenar los datos del slider
    const sliderData = {
        track,
        slides,
        slidesToShow: options.slidesToShow,
        currentIndex: 0,
        slideWidth: 0,
        paginationContainer,
        totalSlides: slides.length
    };
    
    // Guardar referencia a los datos en el elemento track
    track.sliderData = sliderData;
    
    // Crear paginación
    createPagination(sliderData);
    
    // Event listeners para los botones
    prevArrow.addEventListener('click', () => {
        moveSlider(sliderData, 'prev');
    });
    
    nextArrow.addEventListener('click', () => {
        moveSlider(sliderData, 'next');
    });
    
    // Habilitar/deshabilitar botones inicialmente
    updateArrowsState(sliderData, prevArrow, nextArrow);
}

/**
 * Crea los botones de paginación para un slider
 */
function createPagination(sliderData) {
    const { paginationContainer, totalSlides, slidesToShow } = sliderData;
    
    // Limpiar contenedor de paginación
    paginationContainer.innerHTML = '';
    
    // Número de páginas
    const pageCount = Math.ceil(totalSlides / slidesToShow);
    
    // Crear botones
    for (let i = 0; i < pageCount; i++) {
        const bullet = document.createElement('div');
        bullet.className = 'slider-pagination-bullet';
        if (i === 0) bullet.classList.add('active');
        
        bullet.addEventListener('click', () => {
            sliderData.currentIndex = i * slidesToShow;
            updateSliderPosition(sliderData);
            updatePagination(sliderData);
        });
        
        paginationContainer.appendChild(bullet);
    }
}

/**
 * Actualiza la paginación de un slider
 */
function updatePagination(sliderData) {
    const { paginationContainer, currentIndex, slidesToShow } = sliderData;
    
    const bullets = paginationContainer.querySelectorAll('.slider-pagination-bullet');
    const activeBulletIndex = Math.floor(currentIndex / slidesToShow);
    
    bullets.forEach((bullet, index) => {
        if (index === activeBulletIndex) {
            bullet.classList.add('active');
        } else {
            bullet.classList.remove('active');
        }
    });
}

/**
 * Mueve el slider en la dirección especificada
 */
function moveSlider(sliderData, direction) {
    const { slides, slidesToShow } = sliderData;
    
    if (direction === 'next') {
        if (sliderData.currentIndex + slidesToShow < slides.length) {
            sliderData.currentIndex += slidesToShow;
        }
    } else {
        if (sliderData.currentIndex - slidesToShow >= 0) {
            sliderData.currentIndex -= slidesToShow;
        }
    }
    
    updateSliderPosition(sliderData);
    updatePagination(sliderData);
}

/**
 * Actualiza la posición del slider
 */
function updateSliderPosition(sliderData) {
    const { track, slides, currentIndex } = sliderData;
    
    if (slides.length === 0) return;
    
    // Calcular el ancho y margen de un slide
    const slideRect = slides[0].getBoundingClientRect();
    const slideWidth = slideRect.width;
    
    // Calcular margen entre slides (asumiendo que todos tienen el mismo margen)
    const computedStyle = window.getComputedStyle(slides[0]);
    const marginRight = parseInt(computedStyle.marginRight) || 0;
    
    // Mover el track
    const offset = (slideWidth + marginRight) * currentIndex;
    track.style.transform = `translateX(-${offset}px)`;
    
    // Actualizar estado de los botones
    const prevArrow = track.parentElement.parentElement.querySelector('.prev-arrow');
    const nextArrow = track.parentElement.parentElement.querySelector('.next-arrow');
    
    if (prevArrow && nextArrow) {
        updateArrowsState(sliderData, prevArrow, nextArrow);
    }
}

/**
 * Actualiza el estado de los botones prev/next
 */
function updateArrowsState(sliderData, prevArrow, nextArrow) {
    const { currentIndex, slides, slidesToShow } = sliderData;
    
    // Deshabilitar/habilitar botón previo
    if (currentIndex === 0) {
        prevArrow.setAttribute('disabled', 'true');
        prevArrow.classList.add('disabled');
    } else {
        prevArrow.removeAttribute('disabled');
        prevArrow.classList.remove('disabled');
    }
    
    // Deshabilitar/habilitar botón siguiente
    if (currentIndex + slidesToShow >= slides.length) {
        nextArrow.setAttribute('disabled', 'true');
        nextArrow.classList.add('disabled');
    } else {
        nextArrow.removeAttribute('disabled');
        nextArrow.classList.remove('disabled');
    }
}

/**
 * Inicializa los botones de añadir al carrito
 */
function initCarritoButtons() {
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            addToCart(productId, this);
        });
    });
}

/**
 * Añade un producto al carrito
 * @param {string} productId - ID del producto
 * @param {HTMLElement} button - Botón que fue pulsado
 */
function addToCart(productId, button) {
    // Obtener información del producto del DOM
    const productCard = button.closest('.product-card');
    if (!productCard) return;
    
    const productName = productCard.querySelector('h3').textContent;
    const productCategory = productCard.querySelector('.product-category').textContent;
    const productImage = productCard.querySelector('.lazy-image').src;
    
    // Obtener precio
    let productPrice = 0;
    const priceElement = productCard.querySelector('.price-discount') || productCard.querySelector('.price-normal');
    if (priceElement) {
        productPrice = parseFloat(priceElement.textContent.replace('$', ''));
    }
    
    // Crear objeto del producto
    const product = {
        id: productId,
        name: productName,
        category: productCategory,
        price: productPrice,
        image: productImage,
        cantidad: 1
    };
    
    // Obtener carrito actual del localStorage
    let carrito = JSON.parse(localStorage.getItem('carritoItems') || '[]');
    
    // Verificar si el producto ya está en el carrito
    const existingProductIndex = carrito.findIndex(item => item.id === productId);
    
    if (existingProductIndex !== -1) {
        // Si existe, incrementar cantidad
        carrito[existingProductIndex].cantidad++;
    } else {
        // Si no existe, agregarlo
        carrito.push(product);
    }
    
    // Guardar carrito actualizado
    localStorage.setItem('carritoItems', JSON.stringify(carrito));
    
    // Animación del botón
    button.classList.add('added');
    
    // Cambiar el ícono temporalmente
    const originalHTML = button.innerHTML;
    button.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Añadido';
    
    setTimeout(() => {
        button.classList.remove('added');
        button.innerHTML = originalHTML;
    }, 1500);
    
    // Disparar evento de carrito actualizado
    window.dispatchEvent(new Event('carrito-actualizado'));
    
    // Mostrar notificación
    showNotification(
        'Producto añadido al carrito', 
        `${productName} ha sido añadido a tu carrito de compras.`, 
        'success'
    );
}

/**
 * Inicializa la animación de contador para las estadísticas
 */
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    if (statNumbers.length === 0) return;
    
    // Implementación de contador con IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statElement = entry.target;
                const finalValue = parseInt(statElement.textContent, 10);
                
                // Solo animar si es un número válido
                if (!isNaN(finalValue)) {
                    animateCounter(statElement, 0, finalValue, 2000);
                }
                
                // Dejar de observar una vez animado
                observer.unobserve(statElement);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    // Observar cada número de estadística
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

/**
 * Anima un contador desde el valor inicial hasta el final
 * @param {HTMLElement} element - Elemento a animar
 * @param {number} start - Valor inicial
 * @param {number} end - Valor final
 * @param {number} duration - Duración en milisegundos
 */
function animateCounter(element, start, end, duration) {
    // Guardar el valor final para restaurarlo después
    const originalText = element.textContent;
    
    // Determinar el incremento según el tamaño del número
    const range = end - start;
    const minStep = 1;
    const stepSize = Math.max(Math.floor(range / 100), minStep);
    
    // Formatear número con separador de miles
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = Math.floor(progress * range);
        
        // Actualizar texto del elemento
        element.textContent = formatNumber(currentValue);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            // Restaurar el valor original exacto al finalizar
            element.textContent = originalText;
        }
    };
    
    window.requestAnimationFrame(step);
}

/**
 * Inicializa la navegación entre secciones
 */
function initSectionNavigation() {
    const navButtons = document.querySelectorAll('.section-nav-button');
    const sections = document.querySelectorAll('.section-container');
    
    if (navButtons.length === 0 || sections.length === 0) return;
    
    // Hacer scroll a la sección correspondiente al hacer clic
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sectionId = button.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Actualizar el botón activo al hacer scroll
    window.addEventListener('scroll', () => {
        updateActiveNavButton();
    });
    
    // Función para actualizar el botón activo
    function updateActiveNavButton() {
        // Conseguir la sección más visible
        let mostVisibleSection = null;
        let maxVisiblePercentage = 0;
        
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            // Calcular qué porcentaje de la sección es visible
            const visibleHeight = Math.min(rect.bottom, viewHeight) - Math.max(rect.top, 0);
            const visiblePercentage = (visibleHeight / section.offsetHeight) * 100;
            
            if (visiblePercentage > maxVisiblePercentage) {
                maxVisiblePercentage = visiblePercentage;
                mostVisibleSection = section;
            }
        });
        
        // Actualizar botón activo
        if (mostVisibleSection) {
            const sectionId = mostVisibleSection.id;
            
            navButtons.forEach(button => {
                if (button.getAttribute('data-section') === sectionId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }
    
    // Inicializar estado activo
    updateActiveNavButton();
}

/**
 * Inicializa los botones de navegación flotante
 */
function initScrollButtons() {
    const prevButton = document.querySelector('.floating-nav .prev-button');
    const nextButton = document.querySelector('.floating-nav .next-button');
    const sections = document.querySelectorAll('.section-container');
    
    if (!prevButton || !nextButton || sections.length === 0) return;
    
    prevButton.addEventListener('click', () => {
        navigateToAdjacentSection('prev');
    });
    
    nextButton.addEventListener('click', () => {
        navigateToAdjacentSection('next');
    });
    
    function navigateToAdjacentSection(direction) {
        // Obtener posiciones de todas las secciones
        const sectionPositions = Array.from(sections).map(section => {
            const rect = section.getBoundingClientRect();
            return {
                id: section.id,
                top: rect.top + window.scrollY,
                element: section
            };
        });
        
        // Ordenar por posición
        sectionPositions.sort((a, b) => a.top - b.top);
        
        // Obtener posición de scroll actual
        const scrollY = window.scrollY;
        
        // Encontrar la siguiente/anterior sección
        if (direction === 'next') {
            // Buscar primera sección cuyo inicio está por debajo del scroll actual
            for (const section of sectionPositions) {
                if (section.top > scrollY + 10) { // Pequeño offset para evitar problemas
                    section.element.scrollIntoView({ behavior: 'smooth' });
                    return;
                }
            }
            // Si llegamos aquí, ir a la última sección
            if (sectionPositions.length > 0) {
                sectionPositions[sectionPositions.length - 1].element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Buscar última sección cuyo inicio está por encima del scroll actual
            for (let i = sectionPositions.length - 1; i >= 0; i--) {
                if (sectionPositions[i].top < scrollY - 10) {
                    sectionPositions[i].element.scrollIntoView({ behavior: 'smooth' });
                    return;
                }
            }
            // Si llegamos aquí, ir a la primera sección
            if (sectionPositions.length > 0) {
                sectionPositions[0].element.scrollIntoView({ behavior: 'smooth' });
            }
        }
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
 * Inicializa el formulario de newsletter
 */
function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;
        
        // Validación simple
        if (!isValidEmail(email)) {
            showNotification(
                'Error', 
                'Por favor, introduce un correo electrónico válido.', 
                'error'
            );
            return;
        }
        
        // En una implementación real, esto se conectaría con el backend
        console.log(`Email ${email} suscrito al newsletter`);
        
        // Mostrar notificación de éxito
        showNotification(
            '¡Suscripción exitosa!', 
            'Gracias por suscribirte a nuestro boletín. Recibirás nuestras novedades y ofertas.', 
            'success'
        );
        
        // Limpiar el formulario
        emailInput.value = '';
    });
}

/**
 * Valida un correo electrónico
 * @param {string} email - Correo a validar
 * @returns {boolean} - Si es válido o no
 */
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
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
    
    // Mostrar con animación (pequeño retraso para permitir la transición)
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
 * Activa el modo de accesibilidad para usuarios mayores
 */
function enableAccessibilityMode() {
    document.body.classList.add('accessibility-mode');
    localStorage.setItem('accessibilityMode', 'enabled');
    
    // Mostrar notificación
    showNotification(
        'Modo de Accesibilidad activado', 
        'Se ha aumentado el tamaño de texto y botones para facilitar la lectura.', 
        'info'
    );
}

/**
 * Activa el modo de alto contraste
 */
function enableHighContrastMode() {
    document.body.classList.add('high-contrast-mode');
    localStorage.setItem('highContrastMode', 'enabled');
    
    // Mostrar notificación
    showNotification(
        'Modo de Alto Contraste activado', 
        'Se han modificado los colores para mejorar la visibilidad.', 
        'info'
    );
}

// Comprobar modos guardados al cargar la página
function checkSavedModes() {
    if (localStorage.getItem('accessibilityMode') === 'enabled') {
        document.body.classList.add('accessibility-mode');
    }
    
    if (localStorage.getItem('highContrastMode') === 'enabled') {
        document.body.classList.add('high-contrast-mode');
    }
}

// Comprobar modos guardados
checkSavedModes();