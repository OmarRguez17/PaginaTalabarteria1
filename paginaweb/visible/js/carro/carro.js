// JavaScript para la página del carrito - carro.js

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar estado global del carrito
    window.carritoState = {
        items: [],
        subtotal: 0,
        impuestos: 0,
        envio: 0,
        total: 0,
        cuponAplicado: null,
        metodoEnvio: 'estandar',
        costoEnvio: 0,
        direccionEnvio: null
    };
    
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
        initCarrito();
        initBackToTop();
        
        // Mostrar notificación de bienvenida
       setTimeout(() => {
           showNotification('Carrito de compras', 'Revisa tus productos y completa tu compra.', 'info');
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
* Inicializa todos los sliders
*/
function initSliders() {
   // Inicializar slider de productos relacionados
   if (document.querySelector('#productos-relacionados-track')) {
       initSlider({
           trackSelector: '#productos-relacionados-track',
           slideSelector: '.product-slide',
           prevArrowSelector: '.relacionados-controls .prev-arrow',
           nextArrowSelector: '.relacionados-controls .next-arrow',
           paginationSelector: '.relacionados-pagination',
           slidesToShow: getSlidesToShow()
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
* Actualiza todos los sliders con nuevos valores
*/
function updateAllSliders() {
   const slidesToShow = getSlidesToShow();
   
   if (document.querySelector('#productos-relacionados-track')) {
       updateSlider('#productos-relacionados-track', '.product-slide', slidesToShow);
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
* Inicializa la funcionalidad del carrito
*/
function initCarrito() {
   // Cargar carrito desde localStorage SIEMPRE
   loadCarritoItems();
   
   // Inicializar botones de añadir al carrito en productos relacionados
   initAddToCartButtons();
   
   // Inicializar botones de acción del carrito
   initCarritoActionButtons();
   
   // Inicializar modales
   initModals();
}

/**
* Inicializa los botones de añadir al carrito
*/
function initAddToCartButtons() {
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
* @param {number} cantidad - Cantidad a añadir (opcional, por defecto 1)
*/
function addToCart(productId, button, cantidad = 1) {
   // Obtener información del producto
   const productCard = button.closest('.product-card');
   let productInfo = {};
   
   if (productCard) {
       let productName = productCard.querySelector('h3').textContent;
       let categoryElement = productCard.querySelector('.product-category');
       let productCategory = categoryElement ? categoryElement.textContent : "Categoría";
       let imageElement = productCard.querySelector('.product-image img');
       let productImage = imageElement ? (imageElement.getAttribute('src') || imageElement.getAttribute('data-src')) : "/publico/imagenes/fijos/logo.png";
       let priceElement = productCard.querySelector('.price-discount') || productCard.querySelector('.price-normal');
       let productPrice = priceElement ? priceElement.textContent.replace('$', '').trim() : "0";
       
       productInfo = {
           id: productId,
           nombre: productName,
           categoria: productCategory,
           precio: parseFloat(productPrice),
           imagen: productImage,
           cantidad: cantidad
       };
   } else {
       // Datos por defecto si no podemos obtener del DOM
       productInfo = {
           id: productId,
           nombre: "Producto " + productId,
           categoria: "Categoría",
           precio: 100,
           imagen: "/publico/imagenes/fijos/logo.png",
           cantidad: cantidad
       };
   }
   
   // Añadir al carrito LOCAL
   addItemToCarrito(productInfo);
   
   // Animación del botón
   button.classList.add('added');
   const originalHTML = button.innerHTML;
   button.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Añadido';
   
   setTimeout(() => {
       button.classList.remove('added');
       button.innerHTML = originalHTML;
   }, 1500);
   
   showNotification('Producto añadido al carrito', `${productInfo.nombre} ha sido añadido a tu carrito.`, 'success');
}

/**
* Añade un producto al estado del carrito
*/
function addItemToCarrito(productInfo) {
   // Verificar si el producto ya está en el carrito
   const existingItemIndex = window.carritoState.items.findIndex(item => item.id === productInfo.id);
   
   if (existingItemIndex >= 0) {
       // Incrementar cantidad si ya existe
       window.carritoState.items[existingItemIndex].cantidad += productInfo.cantidad;
   } else {
       // Añadir nuevo item si no existe
       window.carritoState.items.push(productInfo);
   }
   
   // Guardar en localStorage SIEMPRE
   saveCarritoToLocalStorage();
   
   // Actualizar UI
   updateCarritoUI();
}

/**
* Envía un item del carrito al servidor
*/
function sendCartItemToServer(productId, cantidad) {
   fetch('/api/carrito/add', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'X-Requested-With': 'XMLHttpRequest'
       },
       body: JSON.stringify({
           producto_id: productId,
           cantidad: cantidad
       })
   })
   .then(response => response.json())
   .then(data => {
       if (!data.success) {
           console.error('Error al guardar item en servidor:', data.message);
       }
   })
   .catch(error => {
       console.error('Error en la petición al servidor:', error);
   });
}

/**
* Guarda el carrito en localStorage
*/
function saveCarritoToLocalStorage() {
   localStorage.setItem('carritoItems', JSON.stringify(window.carritoState.items));
}

/**
* Carga los items del carrito desde localStorage o desde el servidor
*/
function loadCarritoItems() {
   const storedItems = localStorage.getItem('carritoItems');
   
   if (storedItems) {
       try {
           window.carritoState.items = JSON.parse(storedItems);
           updateCarritoUI();
       } catch (e) {
           console.error('Error al cargar carrito desde localStorage:', e);
           window.carritoState.items = [];
       }
   } else {
       window.carritoState.items = [];
   }
}

/**
* Carga los items del carrito desde localStorage
*/
function loadFromLocalStorage() {
   const storedItems = localStorage.getItem('carritoItems');
   
   if (storedItems) {
       try {
           window.carritoState.items = JSON.parse(storedItems);
           updateCarritoUI();
       } catch (e) {
           console.error('Error al cargar carrito desde localStorage:', e);
           window.carritoState.items = [];
       }
   } else {
       window.carritoState.items = [];
   }
}

/**
* Sincroniza el carrito local con el servidor
*/
function syncCartWithServer() {
   fetch('/api/carrito/sincronizar', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
           'X-Requested-With': 'XMLHttpRequest'
       },
       body: JSON.stringify({
           items: window.carritoState.items
       })
   })
   .then(response => response.json()).then(data => {
       if (data.success && data.carrito) {
           // Actualizar carrito local con datos del servidor
           window.carritoState.items = data.carrito;
           updateCarritoUI();
           saveCarritoToLocalStorage(); // Actualizar también localStorage
       }
   })
   .catch(error => {
       console.error('Error al sincronizar carrito con servidor:', error);
   });
}

/**
* Actualiza la interfaz del carrito
*/
function updateCarritoUI() {
   const carritoItems = window.carritoState.items;
   const carritoVacio = document.getElementById('carro-vacio');
   const carritoConProductos = document.getElementById('carro-con-productos');
   const carritoItemsContainer = document.getElementById('carro-items');
   
   if (!carritoVacio || !carritoConProductos || !carritoItemsContainer) {
       // Si estamos en otra página que no sea el carrito, solo actualizamos contador
       updateCarritoCounter();
       return;
   }
   
   // Mostrar vista adecuada según si hay productos o no
   if (carritoItems.length === 0) {
       carritoVacio.classList.remove('hidden');
       carritoConProductos.classList.add('hidden');
   } else {
       carritoVacio.classList.add('hidden');
       carritoConProductos.classList.remove('hidden');
       
       // Limpiar contenedor de items
       carritoItemsContainer.innerHTML = '';
       
       // Añadir cada item del carrito
       carritoItems.forEach(item => {
           const itemElement = createCarritoItemElement(item);
           carritoItemsContainer.appendChild(itemElement);
       });
   }
   
   // Actualizar totales
   updateCarritoTotals();
   
   // Actualizar contador en cualquier caso
   updateCarritoCounter();
}

/**
* Actualiza el contador del carrito
*/
function updateCarritoCounter() {
   const contadorElement = document.getElementById('carrito-contador');
   if (!contadorElement) return;
   
   const totalItems = window.carritoState.items.reduce((total, item) => total + item.cantidad, 0);
   contadorElement.textContent = totalItems;
   
   // Mostrar u ocultar el contador según si hay items o no
   if (totalItems > 0) {
       contadorElement.style.display = 'flex';
   } else {
       contadorElement.style.display = 'none';
   }
}

/**
* Crea un elemento DOM para un item del carrito
*/
function createCarritoItemElement(item) {
   // Intentar obtener el template
   const template = document.getElementById('carro-item-template');
   
   if (!template) {
       // Crear elemento manualmente si no hay template
       const div = document.createElement('div');
       div.className = 'carro-item';
       div.setAttribute('data-id', item.id);
       
       div.innerHTML = `
           <div class="tabla-col producto-info" data-label="Producto:">
               <div class="producto-imagen skeleton-loading">
                   <img src="${item.imagen}" alt="${item.nombre}" class="lazy-image loaded">
               </div>
               <div class="producto-detalles">
                   <h3 class="producto-nombre">${item.nombre}</h3>
                   <p class="producto-categoria">${item.categoria}</p>
               </div>
           </div>
           <div class="tabla-col producto-precio" data-label="Precio:">
               <span class="precio">$${item.precio.toFixed(2)}</span>
           </div>
           <div class="tabla-col producto-cantidad" data-label="Cantidad:">
               <div class="cantidad-control">
                   <button class="cantidad-btn dec-cantidad">
                       <ion-icon name="remove-outline"></ion-icon>
                   </button>
                   <input type="number" class="cantidad-input" value="${item.cantidad}" min="1" max="99" data-id="${item.id}">
                   <button class="cantidad-btn inc-cantidad">
                       <ion-icon name="add-outline"></ion-icon>
                   </button>
               </div>
           </div>
           <div class="tabla-col producto-total" data-label="Total:">
               <span class="total">$${(item.precio * item.cantidad).toFixed(2)}</span>
           </div>
           <div class="tabla-col producto-acciones">
               <button class="btn-icon eliminar-item">
                   <ion-icon name="trash-outline"></ion-icon>
               </button>
           </div>
       `;
       
       // Añadir event listeners
       const decBtn = div.querySelector('.dec-cantidad');
       const incBtn = div.querySelector('.inc-cantidad');
       const cantidadInput = div.querySelector('.cantidad-input');
       const deleteBtn = div.querySelector('.eliminar-item');
       
       decBtn.addEventListener('click', () => {
           updateItemQuantity(item.id, Math.max(1, parseInt(cantidadInput.value) - 1));
       });
       
       incBtn.addEventListener('click', () => {
           updateItemQuantity(item.id, parseInt(cantidadInput.value) + 1);
       });
       
       cantidadInput.addEventListener('change', function() {
           let value = parseInt(this.value);
           
           // Validar valor
           if (isNaN(value) || value < 1) {
               value = 1;
               this.value = 1;
           } else if (value > 99) {
               value = 99;
               this.value = 99;
           }
           
           updateItemQuantity(item.id, value);
       });
       
       deleteBtn.addEventListener('click', () => {
           showRemoveItemModal(item);
       });
       
       return div;
   }
   
   // Si hay template, usarlo
   const itemElement = document.importNode(template.content, true).querySelector('.carro-item');
   
   // Asignar el ID del producto
   itemElement.setAttribute('data-id', item.id);
   
   // Rellenar datos del producto
   const imagen = itemElement.querySelector('.producto-imagen img');
   imagen.setAttribute('src', item.imagen);
   imagen.setAttribute('alt', item.nombre);
   imagen.classList.add('loaded');
   
   itemElement.querySelector('.producto-nombre').textContent = item.nombre;
   itemElement.querySelector('.producto-categoria').textContent = item.categoria;
   itemElement.querySelector('.precio').textContent = `$${item.precio.toFixed(2)}`;
   
   const cantidadInput = itemElement.querySelector('.cantidad-input');
   cantidadInput.value = item.cantidad;
   cantidadInput.setAttribute('data-id', item.id);
   
   const total = item.precio * item.cantidad;
   itemElement.querySelector('.total').textContent = `$${total.toFixed(2)}`;
   
   // Para uso en versión móvil
   itemElement.querySelector('.producto-precio').setAttribute('data-label', 'Precio:');
   itemElement.querySelector('.producto-cantidad').setAttribute('data-label', 'Cantidad:');
   itemElement.querySelector('.producto-total').setAttribute('data-label', 'Total:');
   
   // Añadir event listeners
   const decBtn = itemElement.querySelector('.dec-cantidad');
   const incBtn = itemElement.querySelector('.inc-cantidad');
   const deleteBtn = itemElement.querySelector('.eliminar-item');
   
   decBtn.addEventListener('click', () => {
       updateItemQuantity(item.id, Math.max(1, parseInt(cantidadInput.value) - 1));
   });
   
   incBtn.addEventListener('click', () => {
       updateItemQuantity(item.id, parseInt(cantidadInput.value) + 1);
   });
   
   cantidadInput.addEventListener('change', function() {
       let value = parseInt(this.value);
       
       // Validar valor
       if (isNaN(value) || value < 1) {
           value = 1;
           this.value = 1;
       } else if (value > 99) {
           value = 99;
           this.value = 99;
       }
       
       updateItemQuantity(item.id, value);
   });
   
   deleteBtn.addEventListener('click', () => {
       showRemoveItemModal(item);
   });
   
   return itemElement;
}

/**
* Actualiza la cantidad de un producto en el carrito
*/
function updateItemQuantity(productId, newQuantity) {
   const itemIndex = window.carritoState.items.findIndex(item => item.id === productId);
   
   if (itemIndex >= 0) {
       // Actualizar cantidad
       window.carritoState.items[itemIndex].cantidad = newQuantity;
       
       // Actualizar UI
       const itemElement = document.querySelector(`.carro-item[data-id="${productId}"]`);
       
       if (itemElement) {
           const cantidadInput = itemElement.querySelector('.cantidad-input');
           cantidadInput.value = newQuantity;
           
           const precio = window.carritoState.items[itemIndex].precio;
           const total = precio * newQuantity;
           itemElement.querySelector('.total').textContent = `$${total.toFixed(2)}`;
       }
       
       // Guardar cambios en localStorage
       saveCarritoToLocalStorage();
       
       // Actualizar totales
       updateCarritoTotals();
       updateCarritoCounter();
   }
}

/**
* Elimina un producto del carrito
*/
function removeItemFromCarrito(productId) {
   // Filtrar el item a eliminar
   window.carritoState.items = window.carritoState.items.filter(item => item.id !== productId);
   
   // Guardar cambios en localStorage
   saveCarritoToLocalStorage();
   
   // Actualizar UI
   updateCarritoUI();
   
   showNotification('Producto eliminado', 'El producto ha sido eliminado del carrito.', 'info');
}

/**
* Vacía todo el carrito
*/
function clearCarrito() {
   // Vaciar array de items
   window.carritoState.items = [];
   
   // Guardar cambios en localStorage
   saveCarritoToLocalStorage();
   
   // Actualizar UI
   updateCarritoUI();
   
   showNotification('Carrito vaciado', 'Todos los productos han sido eliminados del carrito.', 'info');
}

/**
* Actualiza los totales del resumen del carrito
*/
function updateCarritoTotals() {
   // Comprobar si estamos en la página de carrito
   const subtotalElement = document.getElementById('subtotal-precio');
   const impuestosElement = document.getElementById('impuestos-precio');
   const envioElement = document.getElementById('envio-precio');
   const totalElement = document.getElementById('total-precio');
   
   if (!subtotalElement || !impuestosElement || !envioElement || !totalElement) {
       return; // No estamos en la página de carrito
   }
   // Calcular subtotal
   const subtotal = window.carritoState.items.reduce((total, item) => {
       return total + (item.precio * item.cantidad);
   }, 0);
   
   // Calcular costo de envío dinámico basado en el subtotal
   let costoEnvio = calcularCostoEnvio(subtotal, window.carritoState.metodoEnvio);
   
   // Si hay cupón de envío gratis, anular solo el costo base
   if (window.carritoState.cuponAplicado && window.carritoState.cuponAplicado.tipo === 'envio_gratis') {
       costoEnvio = 0;
   }
   
   // Calcular impuestos (16% IVA)
   const impuestos = subtotal * 0.16;
   
   // Calcular total
   const total = subtotal + impuestos + costoEnvio;
   
   // Actualizar state
  window.carritoState.subtotal = subtotal;
  window.carritoState.impuestos = impuestos;
  window.carritoState.envio = costoEnvio;
  window.carritoState.total = total;
  
  // Actualizar UI
  subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
  impuestosElement.textContent = `$${impuestos.toFixed(2)}`;
  
  if (costoEnvio > 0) {
      envioElement.textContent = `$${costoEnvio.toFixed(2)}`;
  } else {
      envioElement.textContent = 'Por calcular';
  }
  
  totalElement.textContent = `$${total.toFixed(2)}`;
}

/**
* Calcula el costo de envío dinámico basado en el subtotal
*/
function calcularCostoEnvio(subtotal, metodoEnvio) {
  // Tabla de costos base según rango de subtotal
  let costoBase = 0;
  
  if (subtotal <= 500) {
      costoBase = 80;
  } else if (subtotal <= 1000) {
      costoBase = 120;
  } else if (subtotal <= 2000) {
      costoBase = 150;
  } else if (subtotal <= 5000) {
      costoBase = 200;
  } else {
      // Para compras mayores a $5000, el envío base es gratuito
      costoBase = 0;
  }
  
  // Multiplicar por factor según método de envío
  if (metodoEnvio === 'express') {
      costoBase = costoBase * 1.5; // 50% más para envío express
  }
  
  return costoBase;
}

/**
* Actualiza los precios de envío en el modal
*/
function actualizarPreciosEnvioModal() {
  const subtotal = window.carritoState.subtotal;
  const impuestos = window.carritoState.impuestos;
  
  // Calcular costos base
  const costoEstandar = calcularCostoEnvio(subtotal, 'estandar');
  const costoExpress = calcularCostoEnvio(subtotal, 'express');
  
  // Calcular totales con impuestos incluidos
  const totalEstandar = subtotal + impuestos + costoEstandar;
  const totalExpress = subtotal + impuestos + costoExpress;
  
  // Actualizar elementos en el modal
  const totalEstandarElement = document.getElementById('total-estandar');
  const totalExpressElement = document.getElementById('total-express');
  
  if (totalEstandarElement) {
    totalEstandarElement.textContent = `$${totalEstandar.toFixed(2)}`;
  }
  
  if (totalExpressElement) {
    totalExpressElement.textContent = `$${totalExpress.toFixed(2)}`;
  }
  
  // Añadir elementos adicionales para mostrar desglose completo
  const opcionEstandar = document.querySelector('label[for="envio-estandar"] .envio-detalles');
  const opcionExpress = document.querySelector('label[for="envio-express"] .envio-detalles');
  
  if (opcionEstandar) {
    // Buscar o crear el desglose de precios
    let preciosDesglose = opcionEstandar.querySelector('.envio-precios-desglose');
    
    if (!preciosDesglose) {
      preciosDesglose = document.createElement('div');
      preciosDesglose.className = 'envio-precios-desglose';
      opcionEstandar.querySelector('.envio-precios').insertBefore(preciosDesglose, opcionEstandar.querySelector('.envio-precio-total'));
    }
    
    preciosDesglose.innerHTML = `
      <p class="envio-precio-subtotal">Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
      <p class="envio-precio-impuestos">Impuestos: <span>$${impuestos.toFixed(2)}</span></p>
      <p class="envio-precio-envio">Costo de envío: <span>$${costoEstandar.toFixed(2)}</span></p>
    `;
  }
  
  if (opcionExpress) {
    // Buscar o crear el desglose de precios
    let preciosDesglose = opcionExpress.querySelector('.envio-precios-desglose');
    
    if (!preciosDesglose) {
      preciosDesglose = document.createElement('div');
      preciosDesglose.className = 'envio-precios-desglose';
      opcionExpress.querySelector('.envio-precios').insertBefore(preciosDesglose, opcionExpress.querySelector('.envio-precio-total'));
    }
    
    preciosDesglose.innerHTML = `
      <p class="envio-precio-subtotal">Subtotal: <span>$${subtotal.toFixed(2)}</span></p>
      <p class="envio-precio-impuestos">Impuestos: <span>$${impuestos.toFixed(2)}</span></p>
      <p class="envio-precio-envio">Costo de envío: <span>$${costoExpress.toFixed(2)}</span></p>
    `;
  }
}

/**
* Inicializa los botones de acción del carrito
*/
function initCarritoActionButtons() {
  // Botón para vaciar carrito
  const btnVaciarCarro = document.getElementById('vaciar-carro');
  if (btnVaciarCarro) {
      btnVaciarCarro.addEventListener('click', function() {
          if (window.carritoState.items.length > 0) {
              if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
                  clearCarrito();
              }
          } else {
              showNotification('Carrito vacío', 'No hay productos en el carrito.', 'info');
          }
      });
  }
  
  // Botón para actualizar carrito
  const btnActualizarCarro = document.getElementById('actualizar-carro');
  if (btnActualizarCarro) {
      btnActualizarCarro.addEventListener('click', function() {
          // Recargar carrito desde localStorage o servidor
          if (window.carritoState.isUserAuthenticated) {
              syncCartWithServer();
              showNotification('Carrito actualizado', 'El carrito ha sido sincronizado con el servidor.', 'success');
          } else {
              loadCarritoItems();
              showNotification('Carrito actualizado', 'El carrito ha sido actualizado.', 'success');
          }
      });
  }
  
  // Botón para proceder al pago
  const btnProcederPago = document.getElementById('proceder-pago');
  if (btnProcederPago) {
      btnProcederPago.addEventListener('click', function() {
          if (window.carritoState.items.length > 0) {
              // Actualizar precios de envío antes de mostrar modal
              actualizarPreciosEnvioModal();
              // Mostrar modal de dirección de envío
              showModal('envio-modal');
          } else {
              showNotification('Carrito vacío', 'Añade productos al carrito para continuar con la compra.', 'error');
          }
      });
  }
  
  // Botón para aplicar cupón
  const btnAplicarCupon = document.getElementById('aplicar-cupon');
  if (btnAplicarCupon) {
      btnAplicarCupon.addEventListener('click', function() {
          const cuponInput = document.getElementById('cupon-codigo');
          const cuponCodigo = cuponInput.value.trim();
          
          if (cuponCodigo) {
              // Verificar cupón con el servidor
              fetch('/api/cupon/verificar', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'X-Requested-With': 'XMLHttpRequest'
                  },
                  body: JSON.stringify({
                      codigo: cuponCodigo
                  })
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      // Aplicar cupón
                      const cuponData = data.data;
                      window.carritoState.cuponAplicado = {
                          codigo: cuponCodigo,
                          tipo: cuponData.tipo,
                          valor: cuponData.valor
                      };
                      
                      // Ajustar costos según tipo de cupón
                      if (cuponData.tipo === 'envio_gratis') {
                          showNotification('Cupón aplicado', 'Se ha aplicado envío gratuito a tu compra.', 'success');
                      } else if (cuponData.tipo === 'porcentaje') {
                          showNotification('Cupón aplicado', `Se ha aplicado un descuento del ${cuponData.valor}% a tu compra.`, 'success');
                      }
                      
                      // Actualizar totales del carrito
                      updateCarritoTotals();
                  } else {
                      window.carritoState.cuponAplicado = null;
                      showNotification('Cupón inválido', data.message || 'El código de cupón ingresado no es válido.', 'error');
                  }
              })
              .catch(error => {
                  console.error('Error al verificar cupón:', error);
                  showNotification('Error', 'Ocurrió un error al verificar el cupón.', 'error');
              });
          } else {
              showNotification('Cupón vacío', 'Por favor ingresa un código de cupón.', 'error');
          }
      });
  }
}

/**
* Inicializa los modales del carrito
*/
function initModals() {
  // Botones para cerrar modales
  const closeButtons = document.querySelectorAll('.modal-close');
  closeButtons.forEach(button => {
      button.addEventListener('click', function() {
          const modal = this.closest('.modal-overlay');
          hideModal(modal.id);
      });
  });
   const btnCancelarEnvio = document.getElementById('cancelar-envio');
   if (btnCancelarEnvio) {
       btnCancelarEnvio.addEventListener('click', function() {
           hideModal('envio-modal');
       });
   }
  
  // Modal de eliminar producto
  const btnCancelarEliminar = document.getElementById('cancelar-eliminar');
  const btnConfirmarEliminar = document.getElementById('confirmar-eliminar');
  
  if (btnCancelarEliminar) {
      btnCancelarEliminar.addEventListener('click', function() {
          hideModal('eliminar-modal');
      });
  }
  
  if (btnConfirmarEliminar) {
      btnConfirmarEliminar.addEventListener('click', function() {
          const productId = this.getAttribute('data-product-id');
          if (productId) {
              removeItemFromCarrito(productId);
          }
          hideModal('eliminar-modal');
      });
  }
  
  // Modal de envío
  // Botón de confirmar envío
  const btnConfirmarEnvio = document.getElementById('confirmar-envio');
  
  if (btnConfirmarEnvio) {
      btnConfirmarEnvio.addEventListener('click', function() {
          // Validar formulario de dirección
          if (validarDireccionEnvio()) {
              // Actualizar método de envío
              updateMetodoEnvio();
              
              // Ocultar modal
              hideModal('envio-modal');
              
              // Procesar directamente (sin servidor)
              procesarPagoExitoso();
          }
      });
  }
  
  // Opciones de envío
  const opcionesEnvio = document.querySelectorAll('input[name="metodo_envio"]');
  opcionesEnvio.forEach(opcion => {
      opcion.addEventListener('change', actualizarUIEnvio);
  });
  
  // Toggle entre direcciones guardadas y nueva dirección
  const btnMostrarNuevaDireccion = document.getElementById('mostrar-nueva-direccion');
  const btnVolverDireccionesGuardadas = document.getElementById('volver-direcciones-guardadas');
  
  if (btnMostrarNuevaDireccion) {
      btnMostrarNuevaDireccion.addEventListener('click', function() {
          document.getElementById('direcciones-guardadas').style.display = 'none';
          document.getElementById('nueva-direccion').style.display = 'block';
      });
  }
  
  if (btnVolverDireccionesGuardadas) {
      btnVolverDireccionesGuardadas.addEventListener('click', function() {
          document.getElementById('direcciones-guardadas').style.display = 'block';
          document.getElementById('nueva-direccion').style.display = 'none';
      });
  }
}

/**
* Función para actualizar UI cuando cambia el método de envío
*/
function actualizarUIEnvio() {
  // Actualizar el método de envío
  const metodoEnvio = document.querySelector('input[name="metodo_envio"]:checked')?.value || 'estandar';
  window.carritoState.metodoEnvio = metodoEnvio;
  
  // Calcular costo de envío dinámico
  const subtotal = window.carritoState.subtotal;
  const costoEnvio = calcularCostoEnvio(subtotal, metodoEnvio);
  
  window.carritoState.costoEnvio = costoEnvio;
  
  // Si hay cupón de envío gratis, anular solo el costo base
  if (window.carritoState.cuponAplicado && window.carritoState.cuponAplicado.tipo === 'envio_gratis') {
    window.carritoState.costoEnvio = 0;
  }
  
  // Actualizar totales y precios en el modal
  updateCarritoTotals();
  actualizarPreciosEnvioModal();
}

/**
* Muestra el modal para eliminar un producto
*/
function showRemoveItemModal(item) {
  const modal = document.getElementById('eliminar-modal');
  const btnConfirmarEliminar = document.getElementById('confirmar-eliminar');
  const imagenPreview = document.getElementById('eliminar-producto-imagen');
  const nombrePreview = document.getElementById('eliminar-producto-nombre');
  const precioPreview = document.getElementById('eliminar-producto-precio');
  
  if (!modal || !btnConfirmarEliminar) {
      // Si no existe el modal, eliminar directamente
      removeItemFromCarrito(item.id);
      return;
  }
  
  // Actualizar datos en el modal
  btnConfirmarEliminar.setAttribute('data-product-id', item.id);
  
  if (imagenPreview) {
      imagenPreview.setAttribute('src', item.imagen);
      imagenPreview.classList.add('loaded');
  }
  
  if (nombrePreview) {
      nombrePreview.textContent = item.nombre;
  }
  
  if (precioPreview) {
      precioPreview.textContent = `$${item.precio.toFixed(2)} x ${item.cantidad}`;
  }
  
  // Mostrar modal
  showModal('eliminar-modal');
}

/**
* Validar el formulario de dirección de envío (SOLO LOCAL)
*/
function validarDireccionEnvio() {
  // Solo validar el formulario de nueva dirección
  const nombre = document.getElementById('nombre')?.value.trim();
  const apellidos = document.getElementById('apellidos')?.value.trim();
  const direccion1 = document.getElementById('direccion_linea1')?.value.trim();
  const ciudad = document.getElementById('ciudad')?.value.trim();
  const estado = document.getElementById('estado')?.value.trim();
  const codigoPostal = document.getElementById('codigo_postal')?.value.trim();
  const telefono = document.getElementById('telefono')?.value.trim();
  
  if (!nombre || !apellidos || !direccion1 || !ciudad || !estado || !codigoPostal || !telefono) {
      showNotification('Error', 'Por favor completa todos los campos obligatorios.', 'error');
      return false;
  }
  
  // Guardar datos de la dirección LOCALMENTE
  window.carritoState.direccionEnvio = {
      tipo: 'nueva',
      nombre: nombre,
      apellidos: apellidos,
      direccion1: direccion1,
      direccion2: document.getElementById('direccion_linea2')?.value.trim() || '',
      ciudad: ciudad,
      estado: estado,
      codigoPostal: codigoPostal,
      pais: document.getElementById('pais')?.value || 'México',
      telefono: telefono
  };
  
  return true;
}

/**
* Guarda una dirección en el servidor
*/
function guardarDireccionEnServidor(direccion) {
  fetch('/api/direccion/guardar', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
          direccion_linea1: direccion.direccion1,
          direccion_linea2: direccion.direccion2,
          ciudad: direccion.ciudad,
          estado: direccion.estado,
          codigo_postal: direccion.codigoPostal,
          pais: direccion.pais,
          es_principal: direccion.principal
      })
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Actualizar el ID de la dirección
          window.carritoState.direccionEnvio.id = data.id;
          showNotification('Dirección guardada', 'La dirección se ha guardado correctamente.', 'success');
      } else {
          console.error('Error al guardar dirección:', data.message);
      }
  })
  .catch(error => {
      console.error('Error en la petición al servidor:', error);
  });
}

/**
* Actualiza el método de envío elegido
*/
function updateMetodoEnvio() {
  const metodoEnvio = document.querySelector('input[name="metodo_envio"]:checked')?.value || 'estandar';
  window.carritoState.metodoEnvio = metodoEnvio;
  
  // Calcular costo de envío dinámico
  const subtotal = window.carritoState.subtotal;
  const costoEnvio = calcularCostoEnvio(subtotal, metodoEnvio);
  
  window.carritoState.costoEnvio = costoEnvio;
  
  // Si hay cupón de envío gratis, anular solo el costo base
  if (window.carritoState.cuponAplicado && window.carritoState.cuponAplicado.tipo === 'envio_gratis') {
      window.carritoState.costoEnvio = 0;
  }
  
  // Actualizar totales
  updateCarritoTotals();
}

/**
* Inicializa los botones de PayPal
*/
function initPayPalButtons() {
  // Simular la inicialización de PayPal (en implementación real se usaría la SDK de PayPal)
  const paypalContainer = document.getElementById('paypal-button-container');
  
  if (paypalContainer) {
      // Crear un botón simulado para demostración
      setTimeout(() => {
          if (typeof paypal !== 'undefined') {
              // Usar SDK de PayPal (en un escenario real)
              initRealPayPalButtons();
          } else {
              // Crear botón simulado para fines de demostración
              createSimulatedPayPalButton();
          }
      }, 1000);
  }
}

/**
* Crea un botón de PayPal simulado para demostración
*/
function createSimulatedPayPalButton() {
  const paypalContainer = document.getElementById('paypal-button-container');
  
  // Limpiar contenedor
  paypalContainer.innerHTML = '';
  
  // Crear botón simulado
  const button = document.createElement('button');
  button.className = 'simulated-paypal-button';
  button.innerHTML = '<span class="paypal-logo">Pay<span>Pal</span></span>';
  button.style.backgroundColor = '#0070ba';
  button.style.color = 'white';
  button.style.padding = '10px';
  button.style.borderRadius = '4px';
  button.style.border = 'none';
  button.style.width = '100%';
  button.style.fontSize = '1.1em';
  button.style.fontWeight = 'bold';
  button.style.cursor = 'pointer';
  button.style.marginTop = '10px';
  
  // Añadir evento click
  button.addEventListener('click', function() {
      // Simular procesamiento de pago
      showNotification('Procesando pago...', 'Por favor espera mientras procesamos tu pago.', 'info');
      
      // Simular demora del servidor
      setTimeout(() => {
          // Simular éxito del pago
          procesarPagoExitoso();
      }, 2000);
  });
  
  // Añadir al contenedor
  paypalContainer.appendChild(button);
  
  // Añadir también un botón de tarjeta de crédito
  const cardButton = document.createElement('button');
  cardButton.className = 'simulated-card-button';
  cardButton.innerHTML = '<ion-icon name="card-outline"></ion-icon> Pagar con Tarjeta';
  cardButton.style.backgroundColor = '#ffffff';
  cardButton.style.color = '#0070ba';
  cardButton.style.padding = '10px';
  cardButton.style.borderRadius = '4px';
  cardButton.style.border = '1px solid #0070ba';
  cardButton.style.width = '100%';
  cardButton.style.fontSize = '1.1em';
  cardButton.style.fontWeight = 'bold';
  cardButton.style.cursor = 'pointer';
  cardButton.style.marginTop = '10px';
  cardButton.style.display = 'flex';
  cardButton.style.alignItems = 'center';
  cardButton.style.justifyContent = 'center';
  cardButton.style.gap = '10px';
  
  // Añadir evento click
  cardButton.addEventListener('click', function() {
      // Simular procesamiento de pago
      showNotification('Procesando pago...', 'Por favor espera mientras procesamos tu pago.', 'info');
      
      // Simular demora del servidor
      setTimeout(() => {
          // Simular éxito del pago
          procesarPagoExitoso();
      }, 2000);
  });
  
  // Añadir al contenedor
  paypalContainer.appendChild(cardButton);
}

/**
* Inicializa los botones de PayPal reales (si la SDK está disponible)
*/
function initRealPayPalButtons() {
  // Código para inicializar los botones reales de PayPal (SDK requerido)
  paypal.Buttons({
      createOrder: function(data, actions) {
          return actions.order.create({
              purchase_units: [{
                  amount: {
                      value: window.carritoState.total.toFixed(2)
                  }
              }]
          });
      },
      onApprove: function(data, actions) {
          return actions.order.capture().then(function(details) {
              procesarPagoExitoso(details);
          });
      }
  }).render('#paypal-button-container');
}

/**
* Procesa un pago exitoso
*/
function procesarPagoExitoso() {
  // Guardar el pedido en localStorage con un ID único
  const pedidoId = 'PED' + Date.now();
  const pedido = {
      id: pedidoId,
      fecha: new Date().toISOString(),
      items: [...window.carritoState.items],
      direccion: window.carritoState.direccionEnvio,
      metodoEnvio: window.carritoState.metodoEnvio,
      costoEnvio: window.carritoState.costoEnvio,
      total: window.carritoState.total,
      estado: 'pendiente'
  };
  
  // Guardar pedido en localStorage
  let pedidosGuardados = localStorage.getItem('pedidos');
  let pedidos = pedidosGuardados ? JSON.parse(pedidosGuardados) : [];
  pedidos.push(pedido);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
  
  // Mostrar notificación de éxito
  showNotification('Envío completado', 'Tu pedido ha sido procesado correctamente', 'success');
  
  // Limpiar carrito
  clearCarrito();
  
  // Redirigir a servicios después de 2 segundos
  setTimeout(() => {
      window.location.href = '/servicios';
  }, 2000);
}

/**
* Muestra un modal
*/
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
      // Si es el modal de envío, actualizar precios
      if (modalId === 'envio-modal') {
          actualizarPreciosEnvioModal();
      }
      
      modal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Evitar scroll en el fondo
  }
}

/**
* Oculta un modal
*/
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = ''; // Restaurar scroll
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

/**
* Verifica si hay modo de accesibilidad guardado al cargar la página
*/
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

// Añadir estilos CSS para el desglose de precios
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    .envio-precios-desglose {
      margin-top: 8px;
      font-size: 0.9em;
      color: #666;
      border-top: 1px solid #eee;
      padding-top: 8px;
    }
    
    .envio-precios-desglose p {
      margin: 3px 0;
      display: flex;
      justify-content: space-between;
      line-height: 1.5;
    }
    
    .envio-precios-desglose span {
      font-weight: 500;
    }
    
    .envio-precio-total {
      margin-top: 8px;
      font-weight: bold;
      color: #000;
      font-size: 1.1em;
      border-top: 1px dashed #ddd;
      padding-top: 8px;
    }
    
    /* Mejorar la apariencia de las opciones de envío */
    .envio-opciones {
      margin-top: 20px;
    }
    
    .envio-opcion {
      margin-bottom: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    
    .envio-opcion:hover {
      border-color: #aaa;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .info-envio-dinamico p {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
      font-style: italic;
    }
  `;
  document.head.appendChild(style);
});