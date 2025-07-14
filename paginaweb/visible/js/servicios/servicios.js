
// JavaScript para la página de servicios/productos - servicios.js

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar estado global de filtros
    window.filtrosState = {
        categoriaActiva: 'todas',
        precioMaximo: document.getElementById('precio-rango')?.value || 10000,
        busqueda: '',
        filtros: {
            descuento: false,
            nuevo: false,
            destacado: false
        },
        material: '',
        orden: 'relevancia',
        vista: 'grid',
        paginaActual: 1,
        productosPorPagina: 12
    };
    
    // Inicializar carrito si no existe
    if (!localStorage.getItem('carritoItems')) {
        localStorage.setItem('carritoItems', JSON.stringify([]));
    }
    
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
        initFiltros();
        initProductosBotones();
        initPaginacion();
        initBuscador();
        initVistaBotones();
        initBackToTop();
        initQuickView();
        
        // Actualizar contador del carrito
        actualizarContadorCarrito();
        
        // Mostrar notificación de bienvenida
        setTimeout(() => {
            showNotification('Bienvenido a nuestros productos', 'Explora nuestra colección de artesanía tradicional mexicana.', 'info');
        }, 1500);
    });
});

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
 * Inicializa los filtros de productos
 */
function initFiltros() {
    // Filtro de categorías
    const categoriasBotones = document.querySelectorAll('.categoria-btn');
    categoriasBotones.forEach(btn => {
        btn.addEventListener('click', function() {
            // Quitar clase activa de todos los botones
            categoriasBotones.forEach(b => b.classList.remove('active'));
            
            // Añadir clase activa al botón actual
            this.classList.add('active');
            
            // Actualizar estado
            window.filtrosState.categoriaActiva = this.getAttribute('data-categoria');
            window.filtrosState.paginaActual = 1; // Reiniciar paginación
            
            // Aplicar filtros
            aplicarFiltros();
        });
    });
    
    // Filtro de precio
    const precioRango = document.getElementById('precio-rango');
    const precioValor = document.getElementById('precio-valor');
    
    if (precioRango && precioValor) {
        // Inicializar valor
        precioValor.textContent = `$${precioRango.value}`;
        
        // Actualizar al cambiar
        precioRango.addEventListener('input', function() {
            precioValor.textContent = `$${this.value}`;
        });
        
        // Aplicar filtro al soltar
        precioRango.addEventListener('change', function() {
            window.filtrosState.precioMaximo = this.value;
            window.filtrosState.paginaActual = 1; // Reiniciar paginación
        });
    }
    
    // Filtros de checkbox
    const checkboxesFiltros = {
        'filtro-descuento': 'descuento',
        'filtro-nuevo': 'nuevo',
        'filtro-destacado': 'destacado'
    };
    
    Object.keys(checkboxesFiltros).forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                window.filtrosState.filtros[checkboxesFiltros[id]] = this.checked;
                window.filtrosState.paginaActual = 1; // Reiniciar paginación
            });
        }
    });
    
    // Filtro de material
    const materialSelect = document.getElementById('filtro-material');
    if (materialSelect) {
        materialSelect.addEventListener('change', function() {
            window.filtrosState.material = this.value;
            window.filtrosState.paginaActual = 1; // Reiniciar paginación
        });
    }
    
    // Botones de aplicar y limpiar filtros
    const aplicarFiltrosBtn = document.getElementById('aplicar-filtros');
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.addEventListener('click', aplicarFiltros);
    }
    
    const limpiarFiltrosBtn = document.getElementById('limpiar-filtros');
    if (limpiarFiltrosBtn) {
        limpiarFiltrosBtn.addEventListener('click', limpiarFiltros);
    }
    
    // Selector de orden
    const ordenSelector = document.getElementById('orden-selector');
    if (ordenSelector) {
        ordenSelector.addEventListener('change', function() {
            window.filtrosState.orden = this.value;
            window.filtrosState.paginaActual = 1; // Reiniciar paginación
            aplicarFiltros();
        });
    }
}

/**
 * Aplica todos los filtros actuales a los productos
 */
function aplicarFiltros() {
    const productosGrid = document.getElementById('productos-grid');
    const productosCards = document.querySelectorAll('.producto-card');
    const noResultados = document.getElementById('no-resultados');
    
    if (!productosGrid || !noResultados) return;
    
    // Extraer valores del estado
    const { 
        categoriaActiva, 
        precioMaximo, 
        busqueda, 
        filtros, 
        material, 
        orden, 
        paginaActual, 
        productosPorPagina 
    } = window.filtrosState;
    
    // Array para almacenar productos filtrados
    let productosFiltrados = [];
    
    // Aplicar filtros a cada producto
    productosCards.forEach(card => {
        // Obtener atributos del producto
        const id = card.getAttribute('data-id');
        const categoria = card.getAttribute('data-categoria');
        const precio = parseFloat(card.getAttribute('data-precio'));
        const tieneDescuento = card.getAttribute('data-descuento') === '1';
        const esNuevo = card.getAttribute('data-nuevo') === '1';
        const esDestacado = card.getAttribute('data-destacado') === '1';
        const materialProducto = card.getAttribute('data-material');
        const nombre = card.querySelector('h3').textContent.toLowerCase();
        
        // Verificar si cumple todos los filtros
        let cumpleFiltros = true;
        
        // Filtro de categoría
        if (categoriaActiva !== 'todas' && categoria !== categoriaActiva) {
            cumpleFiltros = false;
        }
        
        // Filtro de precio
        if (precio > parseFloat(precioMaximo)) {
            cumpleFiltros = false;
        }
        
        // Filtro de búsqueda
        if (busqueda && !nombre.includes(busqueda.toLowerCase())) {
            cumpleFiltros = false;
        }
        
        // Filtros de checkbox
        if (filtros.descuento && !tieneDescuento) cumpleFiltros = false;
        if (filtros.nuevo && !esNuevo) cumpleFiltros = false;
        if (filtros.destacado && !esDestacado) cumpleFiltros = false;
        
        // Filtro de material
        if (material && materialProducto !== material) {
            cumpleFiltros = false;
        }
        
        // Si cumple los filtros, agregar al array
        if (cumpleFiltros) {
            productosFiltrados.push({
                elemento: card,
                id: id,
                precio: precio,
                nombre: nombre
            });
        }
    });
    
    // Ordenar productos filtrados
    ordenarProductos(productosFiltrados, orden);
    
    // Calcular paginación
    const totalProductos = productosFiltrados.length;
    const totalPaginas = Math.ceil(totalProductos / productosPorPagina);
    
    // Ajustar paginaActual si es necesario
    if (paginaActual > totalPaginas && totalPaginas > 0) {
        window.filtrosState.paginaActual = totalPaginas;
    }
    
    // Actualizar contador de productos
    const productosCount = document.getElementById('productos-count');
    if (productosCount) {
        productosCount.textContent = totalProductos;
    }
    
    // Mostrar u ocultar productos según filtros y paginación
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosEnPagina = productosFiltrados.slice(inicio, fin);
    
    // Ocultar todos los productos
    productosCards.forEach(card => {
        card.style.display = 'none';
    });
    
    // Mostrar productos filtrados de la página actual
    productosEnPagina.forEach(producto => {
        producto.elemento.style.display = '';
    });
    
    // Mostrar mensaje si no hay resultados
    if (productosFiltrados.length === 0) {
        productosGrid.style.display = 'none';
        noResultados.classList.remove('hidden');
    } else {
        productosGrid.style.display = window.filtrosState.vista === 'grid' ? 'grid' : 'block';
        noResultados.classList.add('hidden');
    }
    
    // Actualizar paginación
    actualizarPaginacion(totalPaginas, paginaActual);
}

/**
 * Ordena los productos según el criterio seleccionado
 */
function ordenarProductos(productos, criterio) {
    switch (criterio) {
        case 'precio-asc':
            productos.sort((a, b) => a.precio - b.precio);
            break;
        case 'precio-desc':
            productos.sort((a, b) => b.precio - a.precio);
            break;
        case 'nombre-asc':
            productos.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'nombre-desc':
            productos.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
        case 'nuevos':
            // En una implementación real esto requeriría otro atributo (fecha)
            // Por ahora lo dejamos sin cambios
            break;
        case 'relevancia':
        default:
            // No hacer nada, mantener el orden predeterminado
            break;
    }
}

/**
 * Limpia todos los filtros aplicados
 */
function limpiarFiltros() {
    // Reiniciar estado de filtros
    window.filtrosState = {
        categoriaActiva: 'todas',
        precioMaximo: document.getElementById('precio-rango')?.max || 10000,
        busqueda: '',
        filtros: {
            descuento: false,
            nuevo: false,
            destacado: false
        },
        material: '',
        orden: 'relevancia',
        vista: window.filtrosState.vista,
        paginaActual: 1,
        productosPorPagina: 12
    };
    
    // Reiniciar UI de filtros
    
    // Categorías
    const categoriasBotones = document.querySelectorAll('.categoria-btn');
    categoriasBotones.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-categoria') === 'todas') {
            btn.classList.add('active');
        }
    });
    
    // Precio
    const precioRango = document.getElementById('precio-rango');
    const precioValor = document.getElementById('precio-valor');
    if (precioRango && precioValor) {
        precioRango.value = precioRango.max;
        precioValor.textContent = `$${precioRango.max}`;
    }
    
    // Checkboxes
    document.getElementById('filtro-descuento')?.removeAttribute('checked');
    document.getElementById('filtro-nuevo')?.removeAttribute('checked');
    document.getElementById('filtro-destacado')?.removeAttribute('checked');
    
    // Material
    const materialSelect = document.getElementById('filtro-material');
    if (materialSelect) {
        materialSelect.value = '';
    }
    
    // Búsqueda
    const buscadorInput = document.getElementById('buscador-termino');
    if (buscadorInput) {
        buscadorInput.value = '';
    }
    
    // Orden
    const ordenSelector = document.getElementById('orden-selector');
    if (ordenSelector) {
        ordenSelector.value = 'relevancia';
    }
    
    // Aplicar filtros reiniciados
    aplicarFiltros();
    
    // Mostrar notificación
    showNotification('Filtros reiniciados', 'Se han limpiado todos los filtros aplicados.', 'info');
}

/**
 * Inicializa la paginación
 */
function initPaginacion() {
    const paginacionContainer = document.getElementById('paginacion-container');
    if (!paginacionContainer) return;
    
    const prevButton = paginacionContainer.querySelector('[data-page="prev"]');
    const nextButton = paginacionContainer.querySelector('[data-page="next"]');
    
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            if (this.hasAttribute('disabled')) return;
            
            window.filtrosState.paginaActual--;
            aplicarFiltros();
            
            // Hacer scroll al inicio de los productos
            document.querySelector('.productos-container').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
    
    if (nextButton) {
        nextButton.addEventListener('click', function() {
            if (this.hasAttribute('disabled')) return;
            
            window.filtrosState.paginaActual++;
            aplicarFiltros();
            
            // Hacer scroll al inicio de los productos
            document.querySelector('.productos-container').scrollIntoView({
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Actualiza la paginación según el número total de páginas
 */
function actualizarPaginacion(totalPaginas, paginaActual) {
    const paginasNumeros = document.getElementById('paginas-numeros');
    const prevButton = document.querySelector('.paginacion-btn[data-page="prev"]');
    const nextButton = document.querySelector('.paginacion-btn[data-page="next"]');
    
    if (!paginasNumeros || !prevButton || !nextButton) return;
    
    // Limpiar contenedor
    paginasNumeros.innerHTML = '';
    
    // No mostrar paginación si hay solo una página
    if (totalPaginas <= 1) {
        prevButton.setAttribute('disabled', 'true');
        nextButton.setAttribute('disabled', 'true');
        return;
    }
    
    // Determinar qué números mostrar
    let numerosAMostrar = [];
    
    if (totalPaginas <= 5) {
        // Mostrar todas las páginas si son 5 o menos
        for (let i = 1; i <= totalPaginas; i++) {
            numerosAMostrar.push(i);
        }
    } else {
        // Estrategia para mostrar algunas páginas con "..."
        numerosAMostrar.push(1); // Siempre mostrar página 1
        
        if (paginaActual <= 3) {
            numerosAMostrar.push(2, 3, 4, '...', totalPaginas);
        } else if (paginaActual >= totalPaginas - 2) {
            numerosAMostrar.push('...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
        } else {
            numerosAMostrar.push('...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas);
        }
    }
    
    // Crear elementos para cada número o elipsis
    numerosAMostrar.forEach(num => {
        if (num === '...') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagina-ellipsis';
            ellipsis.textContent = '...';
            paginasNumeros.appendChild(ellipsis);
        } else {
            const boton = document.createElement('button');
            boton.className = `pagina-num ${num === paginaActual ? 'active' : ''}`;
            boton.textContent = num;
            boton.setAttribute('data-page', num);
            
            boton.addEventListener('click', function() {
                window.filtrosState.paginaActual = parseInt(this.getAttribute('data-page'));
                aplicarFiltros();
                
                // Hacer scroll al inicio de los productos
                document.querySelector('.productos-container').scrollIntoView({
                    behavior: 'smooth'
                });
            });
            
            paginasNumeros.appendChild(boton);
        }
    });
    
    // Actualizar estado de botones prev/next
    if (paginaActual === 1) {
        prevButton.setAttribute('disabled', 'true');
    } else {
        prevButton.removeAttribute('disabled');
    }
    
    if (paginaActual === totalPaginas) {
        nextButton.setAttribute('disabled', 'true');
    } else {
        nextButton.removeAttribute('disabled');
    }
}

/**
 * Inicializa la funcionalidad de búsqueda
 */
function initBuscador() {
    const buscadorForm = document.getElementById('buscador-form');
    const buscadorInput = document.getElementById('buscador-termino');
    
    if (!buscadorForm || !buscadorInput) return;
    
    buscadorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        window.filtrosState.busqueda = buscadorInput.value;
        window.filtrosState.paginaActual = 1; // Reiniciar paginación
        aplicarFiltros();
    });
    
    // Reiniciar búsqueda
    const resetBusqueda = document.getElementById('reset-busqueda');
    if (resetBusqueda) {
        resetBusqueda.addEventListener('click', function() {
            limpiarFiltros();
        });
    }
}

/**
 * Inicializa los botones para cambiar entre vista de cuadrícula y lista
 */
function initVistaBotones() {
    const vistaBotones = document.querySelectorAll('.vista-btn');
    const productosGrid = document.getElementById('productos-grid');
    
    if (vistaBotones.length === 0 || !productosGrid) return;
    
    vistaBotones.forEach(btn => {
        btn.addEventListener('click', function() {
            // Quitar clase activa de todos los botones
            vistaBotones.forEach(b => b.classList.remove('active'));
            
            // Añadir clase activa al botón actual
            this.classList.add('active');
            
            const vistaSeleccionada = this.getAttribute('data-vista');
            
            // Actualizar estado
            window.filtrosState.vista = vistaSeleccionada;
            
            // Actualizar clase en grid de productos
            if (vistaSeleccionada === 'list') {
                productosGrid.classList.add('list-view');
            } else {
                productosGrid.classList.remove('list-view');
            }
        });
    });
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
 * Inicializa la funcionalidad para los botones de productos
 */
function initProductosBotones() {
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
 * Inicializa la funcionalidad de vista rápida de producto
 */
function initQuickView() {
    const productoCards = document.querySelectorAll('.producto-card');
    const quickviewModal = document.getElementById('quickview-modal');
    
    if (!quickviewModal) return;
    
    // Cerrar modal con botón
    const closeBtn = quickviewModal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            quickviewModal.classList.remove('active');
        });
    }
    
    // Añadir funcionalidad de vista rápida a cada producto
    productoCards.forEach(card => {
        // En implementación real, se puede añadir un botón específico
        // Para esta demo usaremos la imagen como trigger
        const imagen = card.querySelector('.producto-imagen');
        
        if (imagen) {
            imagen.addEventListener('click', function(e) {
                e.preventDefault();
                
                const productoId = card.getAttribute('data-id');
                const productoNombre = card.querySelector('h3').textContent;
                const productoCategoria = card.querySelector('.producto-categoria').textContent;
                
                // Determinar precio según si tiene descuento o no
                let productoPrecio = '';
                const precioDiscount = card.querySelector('.price-discount');
                const precioNormal = card.querySelector('.price-normal');
                
                if (precioDiscount) {
                    productoPrecio = precioDiscount.textContent;
                } else if (precioNormal) {
                    productoPrecio = precioNormal.textContent;
                }
                
                // Obtener imagen
                const productoImagen = card.querySelector('.producto-imagen img').getAttribute('data-src');
                
                // Llenar modal con datos del producto
                document.getElementById('quickview-titulo').textContent = 'Vista Rápida: ' + productoNombre;
                document.getElementById('quickview-nombre').textContent = productoNombre;
                document.getElementById('quickview-categoria').textContent = productoCategoria;
                document.getElementById('quickview-precio').textContent = productoPrecio;
                
                const imgElement = document.getElementById('quickview-imagen');
                imgElement.setAttribute('src', productoImagen);
                imgElement.setAttribute('alt', productoNombre);
                
                // Reiniciar cantidad
                document.getElementById('quickview-cantidad').value = 1;
                
                // Configurar botones de cantidad
                const decBtn = quickviewModal.querySelector('.dec-cantidad');
                const incBtn = quickviewModal.querySelector('.inc-cantidad');
                const cantidadInput = document.getElementById('quickview-cantidad');
                
                decBtn.addEventListener('click', () => {
                    let value = parseInt(cantidadInput.value);
                    cantidadInput.value = Math.max(1, value - 1);
                });
                
                incBtn.addEventListener('click', () => {
                    let value = parseInt(cantidadInput.value);
                    cantidadInput.value = Math.min(99, value + 1);
                });
                
                // Configurar botón de añadir al carrito
                const agregarBtn = document.getElementById('quickview-agregar');
                agregarBtn.setAttribute('data-product-id', productoId);
                
                agregarBtn.addEventListener('click', function() {
                    const productId = this.getAttribute('data-product-id');
                    const cantidad = parseInt(document.getElementById('quickview-cantidad').value);
                    
                    // Añadir al carrito con cantidad especificada
                    addToCart(productId, this, cantidad);
                    
                    // Cerrar modal
                    quickviewModal.classList.remove('active');
                });
                
                // Configurar enlace "Ver Más Detalles"
                const verMasLink = document.getElementById('quickview-ver-mas');
                verMasLink.href = `/servicios/${productoId}`;
                
                // Mostrar modal
                quickviewModal.classList.add('active');
            });
        }
    });
}

/**
 * Añade un producto al carrito
 * @param {string} productId - ID del producto
 * @param {HTMLElement} button - Botón que fue pulsado
 * @param {number} cantidad - Cantidad a añadir (opcional, por defecto 1)
 */
function addToCart(productId, button, cantidad = 1) {
    // Obtener información del producto
    const productCard = button.closest('.producto-card') || button.closest('.modal-container');
    let productInfo = {};
    
    if (productCard) {
        // Si estamos en la vista de productos
        let productName, productCategory, productImage, productPrice;
        
        // Si el botón está en el quickview modal
        if (button.id === 'quickview-agregar') {
            productName = document.getElementById('quickview-nombre').textContent;
            productCategory = document.getElementById('quickview-categoria').textContent;
            productImage = document.getElementById('quickview-imagen').getAttribute('src');
            productPrice = document.getElementById('quickview-precio').textContent.replace('$', '').trim();
        } else {
            // Si el botón está en una tarjeta de producto
            productName = productCard.querySelector('h3').textContent;
            productCategory = productCard.querySelector('.producto-categoria').textContent;
            productImage = productCard.querySelector('.producto-imagen img').getAttribute('data-src');
            
            let priceElement = productCard.querySelector('.price-discount') || productCard.querySelector('.price-normal');
            productPrice = priceElement.textContent.replace('$', '').trim();
        }
        
        productInfo = {
            id: productId,
            nombre: productName,
            categoria: productCategory,
            precio: parseFloat(productPrice),
            imagen: productImage,
            cantidad: cantidad
        };
    } else {
        // Si no podemos obtener la info del DOM, hacemos una solicitud al servidor (simulada)
        // En un escenario real, esto sería una petición AJAX
        productInfo = {
            id: productId,
            nombre: "Producto " + productId,
            categoria: "Categoría",
            precio: 100 + Math.floor(Math.random() * 500),
            imagen: "/publico/imagenes/fijos/logo.png",
            cantidad: cantidad
        };
    }
    
    // Añadir al carrito (localStorage)
    addItemToCarritoStorage(productInfo);
    
    // Animación del botón
    button.classList.add('added');
    
    // Cambiar el ícono temporalmente
    const originalHTML = button.innerHTML;
    button.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Añadido';
    
    setTimeout(() => {
        button.classList.remove('added');
        button.innerHTML = originalHTML;
    }, 1500);
    
    // Mostrar notificación
    showNotification(
        'Producto añadido al carrito', 
        `${productInfo.nombre} ha sido añadido a tu carrito de compras.`, 
        'success'
    );
    
    // Actualizar contador
    actualizarContadorCarrito();
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
    const contadorElement = document.getElementById('carrito-contador');
    if (!contadorElement) return;
    
    try {
        // Obtener items actuales
        const storedItems = localStorage.getItem('carritoItems');
        if (storedItems) {
            const carritoItems = JSON.parse(storedItems);
            const totalItems = carritoItems.reduce((total, item) => total + item.cantidad, 0);
            contadorElement.textContent = totalItems;
        } else {
            contadorElement.textContent = '0';
        }
    } catch (e) {
        console.error('Error al actualizar contador del carrito:', e);
        contadorElement.textContent = '0';
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
