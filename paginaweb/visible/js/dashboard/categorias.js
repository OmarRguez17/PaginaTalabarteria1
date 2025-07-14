// JavaScript para el dashboard de categorías

document.addEventListener('DOMContentLoaded', function() {
    initializeCategories();
    initializeEventListeners();
    initializeSearch();
});

// Inicialización general
function initializeCategories() {
    setupCategoryForm();
    setupImageUpload();
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
    
    // Formulario de categorías
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', handleCategorySubmit);
    }
}

// Inicializar búsqueda
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterCategories, 300));
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
        if (modalId === 'addCategoryModal') {
            resetCategoryForm();
        }
    }
}

// Funciones para manejo de categorías
function resetCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) {
        form.reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imagePreview').classList.remove('active');
        document.querySelector('.modal-header h2').textContent = 'Agregar Nueva Categoría';
    }
}

// Manejar envío del formulario de categoría
async function handleCategorySubmit(e) {
    e.preventDefault();
    
    if (!validateCategoryForm()) {
        return;
    }
    
    const formData = new FormData(e.target);
    const categoryId = document.getElementById('categoryId').value;
    const isEdit = categoryId ? true : false;
    
    // Mostrar indicador de carga
    showLoadingButton(e.target.querySelector('button[type="submit"]'));
    
    try {
        let url = '/dashboard/categorias';
        let method = 'POST';
        
        if (isEdit) {
            url = `/dashboard/categorias/${categoryId}`;
            formData.append('_method', 'PUT');
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Éxito', result.message, 'success');
            closeModal('addCategoryModal');
            
            // Recargar la página
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al guardar la categoría', 'error');
    } finally {
        hideLoadingButton(e.target.querySelector('button[type="submit"]'));
    }
}

// Editar categoría
async function editCategory(categoryId) {
    try {
        showNotification('Cargando', 'Obteniendo datos de la categoría...', 'info');
        
        const response = await fetch(`/dashboard/categorias/${categoryId}`);
        const result = await response.json();
        
        if (result.success) {
            const category = result.data;
            
            // Llenar el formulario
            document.getElementById('categoryId').value = category.id;
            document.getElementById('nombre').value = category.nombre;
            document.getElementById('categoria_padre_id').value = category.categoria_padre_id || '';
            document.getElementById('descripcion').value = category.descripcion || '';
            document.getElementById('orden_visualizacion').value = category.orden_visualizacion || 0;
            document.getElementById('activo').checked = category.activo;
            
            // Cambiar título del modal
            document.querySelector('.modal-header h2').textContent = 'Editar Categoría';
            
            // Mostrar imagen existente si la hay
            if (category.url_imagen) {
                displayExistingImage(category.url_imagen);
            }
            
            openModal('addCategoryModal');
        } else {
            showNotification('Error', result.message || 'No se pudo cargar la categoría', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al cargar los datos de la categoría', 'error');
    }
}

// Ver detalles de categoría
async function viewCategory(categoryId) {
    try {
        showNotification('Cargando', 'Obteniendo detalles de la categoría...', 'info');
        
        const response = await fetch(`/dashboard/categorias/${categoryId}`);
        const result = await response.json();
        
        if (result.success) {
            const category = result.data;
            
            // Construir HTML de detalles
            const detailsHTML = `
                <div class="detail-grid">
                    <div class="detail-section">
                        <span class="detail-label">Nombre:</span>
                        <span class="detail-value">${category.nombre}</span>
                    </div>
                    
                    <div class="detail-section">
                        <span class="detail-label">Categoría Padre:</span>
                        <span class="detail-value">${category.categoria_padre_nombre || 'Categoría Principal'}</span>
                    </div>
                    
                    <div class="detail-section">
                        <span class="detail-label">Estado:</span>
                        <span class="detail-value">${category.activo ? 'Activa' : 'Inactiva'}</span>
                    </div>
                    
                    <div class="detail-section">
                        <span class="detail-label">Orden de Visualización:</span>
                        <span class="detail-value">${category.orden_visualizacion}</span>
                    </div>
                    
                    ${category.descripcion ? `
                    <div class="detail-section full-width">
                        <span class="detail-label">Descripción:</span>
                        <span class="detail-value">${category.descripcion}</span>
                    </div>
                    ` : ''}
                    
                    ${category.subcategorias && category.subcategorias.length > 0 ? `
                    <div class="detail-section full-width">
                        <span class="detail-label">Subcategorías:</span>
                        <span class="detail-value">
                            ${category.subcategorias.map(sub => sub.nombre).join(', ')}
                        </span>
                    </div>
                    ` : ''}
                </div>
                
                ${category.url_imagen ? `
                <div class="category-image-large">
                    <img src="${category.url_imagen}" alt="${category.nombre}">
                </div>
                ` : ''}
            `;
            
            document.getElementById('categoryDetails').innerHTML = detailsHTML;
            
            // Configurar botón de edición
            const editBtn = document.getElementById('editCategoryBtn');
            editBtn.onclick = () => {
                closeModal('viewCategoryModal');
                editCategory(category.id);
            };
            
            openModal('viewCategoryModal');
        } else {
            showNotification('Error', result.message || 'No se pudo cargar la categoría', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al cargar los detalles de la categoría', 'error');
    }
}

// Eliminar categoría
async function deleteCategory(categoryId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(`/dashboard/categorias/${categoryId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Éxito', result.message, 'success');
            
            // Eliminar el elemento del DOM
            const categoryItem = document.querySelector(`.category-item[data-id="${categoryId}"]`);
            if (categoryItem) {
                categoryItem.remove();
            } else {
                // Si no se pudo encontrar el elemento, recargar la página
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Error al eliminar la categoría', 'error');
    }
}

// Cambiar estado de la categoría
async function toggleCategoryStatus(categoryId, checkbox) {
    const newStatus = checkbox.checked;
    
    try {
        const response = await fetch(`/dashboard/categorias/${categoryId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activo: newStatus })
        });
        
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

// Preview de imagen
function previewImage(input) {
    const preview = document.getElementById('imagePreview');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image" onclick="removeImage()">
                    <ion-icon name="close"></ion-icon>
                </button>
            `;
            preview.classList.add('active');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Remover imagen
function removeImage() {
    const preview = document.getElementById('imagePreview');
    const input = document.getElementById('categoryImage');
    
    preview.innerHTML = '';
    preview.classList.remove('active');
    input.value = '';
}

// Mostrar imagen existente
function displayExistingImage(url) {
    const preview = document.getElementById('imagePreview');
    
    preview.innerHTML = `
        <img src="${url}" alt="Imagen actual">
        <button type="button" class="remove-image" onclick="removeExistingImage()">
            <ion-icon name="close"></ion-icon>
        </button>
    `;
    preview.classList.add('active');
}

// Remover imagen existente
function removeExistingImage() {
    if (confirm('¿Estás seguro de que deseas eliminar la imagen actual? Se mantendrá hasta que guardes los cambios.')) {
        removeImage();
    }
}

// Filtrar categorías
function filterCategories() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryItems = document.querySelectorAll('.category-item');
    
    categoryItems.forEach(item => {
        const categoryName = item.querySelector('.category-name').textContent.toLowerCase();
        const shouldShow = categoryName.includes(searchTerm);
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

// Configuración del formulario
function setupCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) {
        // Evitar que se seleccione a sí misma como padre al editar
        const categoryId = document.getElementById('categoryId');
        const parentSelect = document.getElementById('categoria_padre_id');
        
        if (categoryId && parentSelect) {
            categoryId.addEventListener('change', function() {
                if (this.value) {
                    // Deshabilitar la opción de la categoría actual
                    const currentOption = parentSelect.querySelector(`option[value="${this.value}"]`);
                    if (currentOption) {
                        currentOption.disabled = true;
                    }
                }
            });
        }
    }
}

// Configuración de upload de imagen
function setupImageUpload() {
    const uploadArea = document.querySelector('.image-upload-area');
    const fileInput = document.getElementById('categoryImage');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', function(e) {
            if (e.target === fileInput) return;
            fileInput.click();
        });
        
        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
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
                fileInput.files = files;
                previewImage(fileInput);
            }
        }
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

// Validaciones del formulario
function validateCategoryForm() {
    const nombre = document.getElementById('nombre').value.trim();
    
    if (!nombre) {
        showNotification('Error', 'El nombre de la categoría es requerido', 'error');
        document.getElementById('nombre').focus();
        return false;
    }
    
    return true;
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
    // Ctrl/Cmd + N para nueva categoría
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openModal('addCategoryModal');
    }
    
    // Escape para cerrar modales
    if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal.show');
        openModals.forEach(modal => {
            closeModal(modal.id);
        });
    }
});