// JavaScript para el dashboard de productos

document.addEventListener('DOMContentLoaded', function() {
    initializeProducts();
    initializeEventListeners();
    initializeFilters();
});

// Inicialización general
function initializeProducts() {
    setupProductForm();
    setupSearch();
    setupTable();
    setupImageDragAndDrop();
    setupImageClickUpload();
}

// Configurar event listeners
function initializeEventListeners() {
    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Prevenir envío de formulario por defecto
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }
}

// Inicializar filtros
function initializeFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterProducts, 300));
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterProducts);
    }
}

// Configurar click para subir imágenes
function setupImageClickUpload() {
    const uploadArea = document.querySelector('.image-upload-area');
    const fileInput = document.getElementById('productImages');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function(e) {
            // Evitar que el click se propague al input file
            if (e.target === fileInput) return;
            fileInput.click();
        });
        
        uploadArea.style.cursor = 'pointer';
    }
}

// Función para manejar el toggle del sidebar en móvil
function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    const backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        const existingBackdrop = document.querySelector('.sidebar-backdrop');
        if (existingBackdrop) existingBackdrop.remove();
    } else {
        sidebar.classList.add('active');
        document.body.appendChild(backdrop);
        backdrop.addEventListener('click', toggleSidebar);
    }
}

// Función para manejar dropdowns
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

// Cerrar dropdowns al hacer clic fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// Funciones para manejar modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        
        // Limpiar formulario si es el modal de añadir/editar
        if (modalId === 'addProductModal') {
            resetProductForm();
        }
    }
}

// Funciones para manejo de productos
function resetProductForm() {
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.querySelector('.modal-header h2').textContent = 'Agregar Nuevo Producto';
    }
}

// Manejar envío del formulario de producto
async function handleProductSubmit(e) {
    e.preventDefault();
    
    if (!validateProductForm()) {
        return;
    }
    
    const formData = new FormData(e.target);
    const productId = document.getElementById('productId').value;
    const isEdit = productId ? true : false;
    
    // Mostrar indicador de carga
    showLoadingButton(e.target.querySelector('button[type="submit"]'));
    
    try {
        let url = '/dashboard/productos';
        let method = 'POST';
        
        if (isEdit) {
            url = `/dashboard/productos/${productId}`;
            formData.append('_method', 'PUT');
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Éxito', result.message, 'success');
            closeModal('addProductModal');
            
            // Recargar la tabla o la página
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al guardar el producto', 'error');
    } finally {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
    }
}

// Editar producto
async function editProduct(productId) {
    try {
        showNotification('Cargando', 'Obteniendo datos del producto...', 'info');
        
        const response = await fetch(`/dashboard/productos/${productId}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const product = result.data;
            
            // Llenar el formulario con los datos del producto
            document.getElementById('productId').value = product.id;
            document.getElementById('nombre').value = product.nombre;
            document.getElementById('categoria_id').value = product.categoria_id || '';
            document.getElementById('precio').value = product.precio;
            document.getElementById('precio_descuento').value = product.precio_descuento || '';
            document.getElementById('cantidad_stock').value = product.cantidad_stock;
            document.getElementById('sku').value = product.sku || '';
            document.getElementById('descripcion').value = product.descripcion || '';
            document.getElementById('descripcion_detallada').value = product.descripcion_detallada || '';
            document.getElementById('material').value = product.material || '';
            document.getElementById('dimensiones').value = product.dimensiones || '';
            document.getElementById('peso').value = product.peso || '';
            document.getElementById('destacado').checked = product.destacado;
            document.getElementById('nuevo').checked = product.nuevo;
            document.getElementById('activo').checked = product.activo;
            
            // Cambiar título del modal
            document.querySelector('.modal-header h2').textContent = 'Editar Producto';
            
            // Mostrar imágenes existentes
            if (product.imagenes && product.imagenes.length > 0) {
                displayExistingImages(product.imagenes);
            }
            
            openModal('addProductModal');
        } else {
            showNotification('Error', result.message || 'No se pudo cargar el producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al cargar los datos del producto', 'error');
    }
}

// Ver detalles del producto (función mejorada)
async function viewProduct(productId) {
    try {
        showNotification('Cargando', 'Obteniendo detalles del producto...', 'info');
        
        const response = await fetch(`/dashboard/productos/${productId}`);
        const result = await response.json();
        
        if (result.success) {
            const product = result.data;
            
            // Actualizar título y badges
            document.getElementById('productName').textContent = product.nombre;
            
            const badgesContainer = document.getElementById('productBadges');
            badgesContainer.innerHTML = '';
            
            if (product.destacado) {
                const badge = document.createElement('span');
                badge.className = 'badge destacado';
                badge.textContent = 'Destacado';
                badgesContainer.appendChild(badge);
            }
            
            if (product.nuevo) {
                const badge = document.createElement('span');
                badge.className = 'badge nuevo';
                badge.textContent = 'Nuevo';
                badgesContainer.appendChild(badge);
            }
            
            // Actualizar información básica
            document.getElementById('productCategory').textContent = product.categoria_nombre || 'Sin categoría';
            document.getElementById('productSku').textContent = product.sku || 'N/A';
            document.getElementById('productStock').textContent = `${product.cantidad_stock} unidades`;
            document.getElementById('productMaterial').textContent = product.material || 'N/A';
            document.getElementById('productDimensions').textContent = product.dimensiones || 'N/A';
            document.getElementById('productWeight').textContent = product.peso ? `${product.peso} kg` : 'N/A';
            
            // Actualizar precios
            document.getElementById('productPrice').textContent = `$${product.precio.toFixed(2)}`;
            
            const discountRow = document.getElementById('discountPriceRow');
            if (product.precio_descuento) {
                discountRow.style.display = 'flex';
                document.getElementById('productDiscountPrice').textContent = `$${product.precio_descuento.toFixed(2)}`;
                const percentage = document.getElementById('discountPercentage');
                percentage.textContent = `-${product.porcentaje_descuento}%`;
            } else {
                discountRow.style.display = 'none';
            }
            
            // Actualizar estado
            const statusElement = document.getElementById('productStatus');
            statusElement.textContent = product.activo ? 'Activo' : 'Inactivo';
            statusElement.className = `status-value ${product.activo ? 'active' : 'inactive'}`;
            
            // Actualizar descripciones
            const shortDescSection = document.getElementById('shortDescriptionSection');
            const detailedDescSection = document.getElementById('detailedDescriptionSection');
            
            if (product.descripcion) {
                shortDescSection.style.display = 'block';
                document.getElementById('productDescription').textContent = product.descripcion;
            } else {
                shortDescSection.style.display = 'none';
            }
            
            if (product.descripcion_detallada) {
                detailedDescSection.style.display = 'block';
                document.getElementById('productDetailedDescription').innerHTML = product.descripcion_detallada;
            } else {
                detailedDescSection.style.display = 'none';
            }
            
            // Procesar imágenes
            const mainImage = document.getElementById('mainProductImage');
            const thumbnailsContainer = document.getElementById('productThumbnails');
            thumbnailsContainer.innerHTML = '';
            
            if (product.imagenes && product.imagenes.length > 0) {
                // Establecer imagen principal
                const mainImageData = product.imagenes.find(img => img.es_principal) || product.imagenes[0];
                mainImage.src = mainImageData.url_imagen;
                
                // Crear thumbnails
                product.imagenes.forEach((imagen, index) => {
                    const thumbnail = document.createElement('div');
                    thumbnail.className = `thumbnail ${imagen.es_principal ? 'active' : ''}`;
                    thumbnail.innerHTML = `<img src="${imagen.url_imagen}" alt="Imagen ${index + 1}">`;
                    thumbnail.onclick = () => {
                        mainImage.src = imagen.url_imagen;
                        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                        thumbnail.classList.add('active');
                    };
                    thumbnailsContainer.appendChild(thumbnail);
                });
                
                // Almacenar URLs para navegación
                window.productImages = product.imagenes.map(img => img.url_imagen);
                window.currentImageIndex = 0;
            } else {
                mainImage.src = '/publico/imagenes/placeholder.jpg';
                window.productImages = [];
            }
            
            // Configurar botón de edición
            const editBtn = document.getElementById('editProductBtn');
            editBtn.onclick = () => {
                closeModal('viewProductModal');
                editProduct(product.id);
            };
            
            openModal('viewProductModal');
        } else {
            showNotification('Error', result.message || 'No se pudo cargar el producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al cargar los detalles del producto', 'error');
    }
}

// Navegación de imágenes
function navigateImage(direction) {
    if (!window.productImages || window.productImages.length === 0) return;
    
    const mainImage = document.getElementById('mainProductImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (direction === 'prev') {
        window.currentImageIndex = (window.currentImageIndex - 1 + window.productImages.length) % window.productImages.length;
    } else {
        window.currentImageIndex = (window.currentImageIndex + 1) % window.productImages.length;
    }
    
    mainImage.src = window.productImages[window.currentImageIndex];
    
    // Actualizar thumbnail activo
    thumbnails.forEach((thumb, index) => {
        if (index === window.currentImageIndex) {
            thumb.classList.add('active');
            // Hacer scroll para mostrar el thumbnail activo
            thumb.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        } else {
            thumb.classList.remove('active');
        }
    });
}

// Eliminar producto
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/dashboard/productos/${productId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Éxito', result.message, 'success');
            
            // Eliminar la fila de la tabla
            const row = document.querySelector(`tr[data-id="${productId}"]`);
            if (row) {
                row.remove();
            } else {
                // Si no se pudo encontrar la fila, recargar la página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al eliminar el producto', 'error');
    }
}

// Cambiar estado del producto
async function toggleProductStatus(productId, checkbox) {
    const newStatus = checkbox.checked;
    
    try {
        const response = await fetch(`/dashboard/productos/${productId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activo: newStatus })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Éxito', 'Estado actualizado correctamente', 'success');
        } else {
            // Revertir el cambio si hubo error
            checkbox.checked = !newStatus;
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        // Revertir el cambio si hubo error
        checkbox.checked = !newStatus;
        showNotification('Error', 'Error al actualizar el estado', 'error');
    }
}

// Preview de imágenes al seleccionar (función corregida)
function previewImages(input) {
    const previewContainer = document.getElementById('imagePreview');
    
    if (input.files && input.files.length > 0) {
        // Si estamos agregando nuevas imágenes durante la edición, no limpiar las existentes
        const existingImages = previewContainer.querySelectorAll('.existing-image').length;
        const hasExistingImages = existingImages > 0;
        
        // Si no hay imágenes existentes, limpiar el contenedor
        if (!hasExistingImages) {
            previewContainer.innerHTML = '';
        }
        
        // Agregar nuevas imágenes
        Array.from(input.files).forEach((file, index) => {
            if (!file.type.match('image.*')) {
                showNotification('Error', `El archivo ${file.name} no es una imagen válida`, 'error');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item new-image';
                
                // Si es la primera imagen y no hay ninguna principal
                const totalImages = previewContainer.querySelectorAll('.image-preview-item').length;
                const hasPrincipal = previewContainer.querySelector('.main-image-badge') !== null;
                const isPrincipal = totalImages === 0 && index === 0 && !hasPrincipal;
                
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image" onclick="removePreviewImage(this)">
                        <ion-icon name="close"></ion-icon>
                    </button>
                    ${isPrincipal ? '<span class="main-image-badge">Principal</span>' : ''}
                `;
                previewContainer.appendChild(previewItem);
            };
            
            reader.readAsDataURL(file);
        });
        
        // Mostrar el contenedor de previews
        previewContainer.style.display = 'grid';
    }
}

// Eliminar imagen del preview
function removePreviewImage(button) {
    const previewItem = button.closest('.image-preview-item');
    const wasPrincipal = previewItem.querySelector('.main-image-badge') !== null;
    
    previewItem.remove();
    
    // Si era la principal, asignar la principal a la primera imagen restante
    if (wasPrincipal) {
        const firstImage = document.querySelector('.image-preview-item');
        if (firstImage && !firstImage.querySelector('.main-image-badge')) {
            const badge = document.createElement('span');
            badge.className = 'main-image-badge';
            badge.textContent = 'Principal';
            firstImage.appendChild(badge);
        }
    }
    
    // Ocultar el contenedor si no hay imágenes
    const container = document.getElementById('imagePreview');
    if (container.children.length === 0) {
        container.style.display = 'none';
    }
}

// Mostrar imágenes existentes al editar
function displayExistingImages(images) {
    const previewContainer = document.getElementById('imagePreview');
    previewContainer.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach((image) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item existing-image';
            previewItem.innerHTML = `
                <img src="${image.url_imagen}" alt="Imagen del producto">
                <button type="button" class="remove-image" onclick="removeExistingImage(${image.id}, this)">
                    <ion-icon name="close"></ion-icon>
                </button>
                ${image.es_principal ? '<span class="main-image-badge">Principal</span>' : ''}
            `;
            previewContainer.appendChild(previewItem);
        });
        
        // Mostrar el contenedor
        previewContainer.style.display = 'grid';
    } else {
        previewContainer.style.display = 'none';
    }
}

// Eliminar imagen existente
async function removeExistingImage(imageId, button) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
        return;
    }
    
    try {
        const response = await fetch(`/dashboard/productos/imagen/${imageId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const previewItem = button.closest('.image-preview-item');
            const wasPrincipal = previewItem.querySelector('.main-image-badge') !== null;
            
            previewItem.remove();
            
            // Si era la principal, asignar la principal a la primera imagen restante
            if (wasPrincipal) {
                const firstImage = document.querySelector('.image-preview-item');
                if (firstImage && !firstImage.querySelector('.main-image-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'main-image-badge';
                    badge.textContent = 'Principal';
                    firstImage.appendChild(badge);
                }
            }
            
            showNotification('Éxito', 'Imagen eliminada correctamente', 'success');
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al eliminar la imagen', 'error');
    }
}

// Filtrar productos
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryId = document.getElementById('categoryFilter').value;
    const status = document.getElementById('statusFilter').value;
    
    const rows = document.querySelectorAll('.products-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const productName = row.querySelector('.product-name').textContent.toLowerCase();
        const productCategory = row.querySelector('td[data-category-id]').getAttribute('data-category-id');
        const isActive = row.querySelector('input[type="checkbox"]').checked;
        
        let showRow = true;
        
        // Filtrar por búsqueda
        if (searchTerm && !productName.includes(searchTerm)) {
            showRow = false;
        }
        
        // Filtrar por categoría
        if (categoryId && productCategory !== categoryId) {
            showRow = false;
        }
        
        // Filtrar por estado
        if (status !== '') {
            const statusBool = status === '1';
            if (isActive !== statusBool) {
                showRow = false;
            }
        }
        
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    });
    
    // Mostrar mensaje si no hay resultados
    const tableContainer = document.querySelector('.products-table-container');
    let noResultsMsg = document.querySelector('.no-results-message');
    
    if (visibleCount === 0) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results-message';
            noResultsMsg.innerHTML = `
                <ion-icon name="search-outline"></ion-icon>
                <p>No se encontraron productos con los filtros aplicados</p>
                <button class="btn-secondary" onclick="resetFilters()">Limpiar filtros</button>
            `;
            tableContainer.appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Sistema de notificaciones
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
    if (type === 'warning') icon = 'alert-outline';
    
    notification.innerHTML = `
        <div class="notification-icon">
            <ion-icon name="${icon}"></ion-icon>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <ion-icon name="close-outline"></ion-icon>
        </button>
    `;
    
    container.appendChild(notification);
    
    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            closeNotification(notification.querySelector('.notification-close'));
        }
    }, 5000);
}

// Cerrar notificación
function closeNotification(button) {
    const notification = button.closest('.notification');
    if (notification) {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
}

// Mostrar/ocultar botón de carga
function showLoadingButton(button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span> Guardando...';
    button.setAttribute('data-original-text', originalText);
}

function hideLoadingButton(button) {
    const originalText = button.getAttribute('data-original-text');
    button.disabled = false;
    button.innerHTML = originalText;
}

// Configuración del formulario de producto
function setupProductForm() {
    const form = document.getElementById('productForm');
    if (form) {
        // Calcular descuento automáticamente
        const precioInput = document.getElementById('precio');
        const precioDescuentoInput = document.getElementById('precio_descuento');
        
        if (precioInput && precioDescuentoInput) {
            function calculateDiscount() {
                const precio = parseFloat(precioInput.value) || 0;
                const precioDescuento = parseFloat(precioDescuentoInput.value) || 0;
                
                if (precio > 0 && precioDescuento > 0 && precioDescuento < precio) {
                    const descuento = ((precio - precioDescuento) / precio * 100).toFixed(0);
                    // Podrías mostrar el porcentaje de descuento en algún lugar
                    const discountLabel = document.getElementById('discount-preview');
                    if (discountLabel) {
                        discountLabel.textContent = `Descuento: ${descuento}%`;
                        discountLabel.style.display = 'block';
                    }
                } else {
                    const discountLabel = document.getElementById('discount-preview');
                    if (discountLabel) {
                        discountLabel.style.display = 'none';
                    }
                }
            }
            
            precioInput.addEventListener('input', calculateDiscount);
            precioDescuentoInput.addEventListener('input', calculateDiscount);
            
            // Calcular descuento al cargar la página si hay valores
            calculateDiscount();
        }
    }
}

// Configuración de búsqueda
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Limpiar búsqueda con Escape
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                filterProducts();
            }
        });
    }
}

// Configuración de la tabla
function setupTable() {
    // Añadir atributos data-label para responsive
    const table = document.querySelector('.products-table');
    if (table) {
        const headers = table.querySelectorAll('thead th');
        const rows = table.querySelectorAll('tbody tr');
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            cells.forEach((cell, index) => {
                if (headers[index]) {
                    cell.setAttribute('data-label', headers[index].textContent);
                }
            });
        });
    }
}

// Función mejorada para drag and drop de imágenes
function setupImageDragAndDrop() {
    const uploadArea = document.querySelector('.image-upload-area');
    
    if (uploadArea) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight(e) {
            uploadArea.classList.add('drag-active');
        }
        
        function unhighlight(e) {
            uploadArea.classList.remove('drag-active');
        }
        
        uploadArea.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length > 0) {
                // Validar que todos los archivos sean imágenes
                const validFiles = Array.from(files).filter(file => file.type.match('image.*'));
                
                if (validFiles.length !== files.length) {
                    showNotification('Advertencia', 'Algunos archivos no son imágenes válidas y fueron ignorados', 'warning');
                }
                
                if (validFiles.length > 0) {
                    const input = document.getElementById('productImages');
                    
                    // Crear un nuevo DataTransfer para combinar archivos
                    const dataTransfer = new DataTransfer();
                    
                    // Añadir archivos existentes si los hay
                    if (input.files && input.files.length > 0) {
                        Array.from(input.files).forEach(file => {
                            dataTransfer.items.add(file);
                        });
                    }
                    
                    // Añadir nuevos archivos válidos
                    validFiles.forEach(file => {
                        dataTransfer.items.add(file);
                    });
                    
                    // Actualizar el input con todos los archivos
                    input.files = dataTransfer.files;
                    
                    // Mostrar preview de todas las imágenes
                    previewImages(input);
                }
            }
        }
        
        // Estilo visual para drag active
        const style = document.createElement('style');
        style.textContent = `
            .image-upload-area.drag-active {
                border-color: #8B572A;
                background-color: #FAF8F1;
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);
    }
}

// Función debounce para optimizar búsqueda
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validaciones del formulario
function validateProductForm() {
    const nombre = document.getElementById('nombre').value.trim();
    const precio = parseFloat(document.getElementById('precio').value);
    const stock = parseInt(document.getElementById('cantidad_stock').value);
    
    if (!nombre) {
        showNotification('Error', 'El nombre del producto es requerido', 'error');
        document.getElementById('nombre').focus();
        return false;
    }
    
    if (isNaN(precio) || precio <= 0) {
        showNotification('Error', 'El precio debe ser mayor a 0', 'error');
        document.getElementById('precio').focus();
        return false;
    }
    
    if (isNaN(stock) || stock < 0) {
        showNotification('Error', 'El stock no puede ser negativo', 'error');
        document.getElementById('cantidad_stock').focus();
        return false;
    }
    
    return true;
}

// Función para resetear filtros
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filterProducts();
}

// Función para actualizar estadísticas
function updateProductStats() {
    const totalProducts = document.querySelectorAll('.products-table tbody tr').length;
    const activeProducts = document.querySelectorAll('.products-table tbody tr input[type="checkbox"]:checked').length;
    
    // Actualizar elementos en el DOM si existen
    const totalElement = document.getElementById('totalProducts');
    const activeElement = document.getElementById('activeProducts');
    
    if (totalElement) totalElement.textContent = totalProducts;
    if (activeElement) activeElement.textContent = activeProducts;
}

// Manejar cambios de tamaño de ventana
window.addEventListener('resize', function() {
    // Cerrar sidebar en dispositivos móviles al cambiar a desktop
    if (window.innerWidth > 768) {
        const sidebar = document.querySelector('.admin-sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (backdrop) backdrop.remove();
    }
});

// Atajos de teclado
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N para nuevo producto
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openModal('addProductModal');
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            closeModal(modal.id);
        });
    }
});

// Funciones auxiliares para formato
function formatPrice(price) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(price);
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-MX', options);
}

// Inicializar estadísticas y mostrar mensaje de bienvenida
document.addEventListener('DOMContentLoaded', function() {
    updateProductStats();
    
    // Mostrar mensaje de guía al cargar la página
    setTimeout(() => {
        showNotification('Bienvenido', 'Gestiona tus productos desde este panel. Haz clic en el botón "Nuevo Producto" para comenzar.', 'info');
    }, 1000);
});