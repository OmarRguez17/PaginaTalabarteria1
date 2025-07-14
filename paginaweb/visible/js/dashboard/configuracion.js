// JavaScript para configuración del dashboard

document.addEventListener('DOMContentLoaded', function() {
    initializeConfiguration();
    initializeEventListeners();
});

// Inicialización
function initializeConfiguration() {
    setupForm();
    setupImageUpload();
}

// Event listeners
function initializeEventListeners() {
    // Formulario principal
    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.addEventListener('submit', handleFormSubmit);
    }
}

// Toggle del sidebar en móvil
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

// Manejar dropdowns
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

// Cambiar de tab
function switchTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-button').forEach(button => {
        if (button.dataset.tab === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Configurar formulario
function setupForm() {
    // Validación en tiempo real para campos requeridos
    const requiredInputs = document.querySelectorAll('input[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', validateField);
    });
}

// Validar campo individual
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('error');
        showFieldError(field, 'Este campo es requerido');
    } else {
        field.classList.remove('error');
        clearFieldError(field);
    }
}

// Mostrar error de campo
function showFieldError(field, message) {
    clearFieldError(field);
    const errorElement = document.createElement('span');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    field.parentNode.appendChild(errorElement);
}

// Limpiar error de campo
function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Manejar envío del formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
        return;
    }
    
    // Mostrar indicador de carga
    const submitButton = e.target.querySelector('button[type="submit"]');
    showLoadingButton(submitButton);
    
    // Preparar datos del formulario
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('/dashboard/configuracion', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Éxito', result.message, 'success');
            
            // Actualizar previews de imágenes si cambiaron
            if (result.data && result.data.logo_url) {
                updateImagePreview('logo-preview', result.data.logo_url);
            }
            if (result.data && result.data.banner_principal_url) {
                updateImagePreview('banner-preview', result.data.banner_principal_url);
            }
        } else {
            showNotification('Error', result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error', 'Ocurrió un error al guardar los cambios', 'error');
    } finally {
        hideLoadingButton(submitButton);
    }
}

// Validar formulario completo
function validateForm() {
    let isValid = true;
    const requiredFields = document.querySelectorAll('input[required]');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('error');
            showFieldError(field, 'Este campo es requerido');
            isValid = false;
        }
    });
    
    if (!isValid) {
        showNotification('Error', 'Por favor completa todos los campos requeridos', 'error');
    }
    
    return isValid;
}

// Configurar upload de imágenes
function setupImageUpload() {
    const uploadAreas = document.querySelectorAll('.image-upload-area');
    
    uploadAreas.forEach(area => {
        // Evitar comportamiento por defecto del navegador
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Resaltar área durante el drag
        ['dragenter', 'dragover'].forEach(eventName => {
            area.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            area.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight(e) {
            area.classList.add('drag-active');
        }
        
        function unhighlight(e) {
            area.classList.remove('drag-active');
        }
        
        // Manejar el drop
        area.addEventListener('drop', handleDrop, false);
        
        function handleDrop(e) {
            const dt = e.dataTransfer;
            const files = dt.files;
            const input = area.querySelector('input[type="file"]');
            
            if (files.length > 0) {
                input.files = files;
                // Disparar evento change para preview
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        }
    });
}

// Preview de imagen
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const previewElement = document.getElementById(previewId);
            
            if (previewElement) {
                // Si el preview ya es una imagen, actualizar src
                if (previewElement.tagName === 'IMG') {
                    previewElement.src = e.target.result;
                } else {
                    // Si no hay imagen, crear una
                    const container = previewElement.closest('.current-image');
                    container.innerHTML = `<img src="${e.target.result}" alt="Preview" id="${previewId}">`;
                }
            }
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Actualizar preview de imagen
function updateImagePreview(previewId, url) {
    const previewElement = document.getElementById(previewId);
    if (previewElement) {
        previewElement.src = url;
    }
}

// Restablecer formulario
function resetForm() {
    if (confirm('¿Estás seguro de que deseas restablecer todos los cambios no guardados?')) {
        const form = document.getElementById('configForm');
        form.reset();
        
        // Recargar la página para restaurar los valores originales
        window.location.reload();
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
    const originalContent = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span class="loading-spinner"></span> Guardando...';
    button.setAttribute('data-original-content', originalContent);
}

function hideLoadingButton(button) {
    const originalContent = button.getAttribute('data-original-content');
    button.disabled = false;
    button.innerHTML = originalContent;
}

// Manejar cambios de tamaño de ventana
window.addEventListener('resize', function() {
    // Cerrar sidebar en móviles al cambiar a desktop
    if (window.innerWidth > 992) {
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
    // Ctrl/Cmd + S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const form = document.getElementById('configForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Escape para cerrar modal/dropdown
    if (e.key === 'Escape') {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

// CSS para errores de validación
const style = document.createElement('style');
style.textContent = `
    .field-error {
        color: #9B2226;
        font-size: 0.85rem;
        margin-top: 0.25rem;
        display: block;
    }
    
    input.error,
    textarea.error {
        border-color: #9B2226;
    }
    
    .image-upload-area.drag-active {
        border-color: var(--primary-color);
        background-color: var(--bg-light);
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);