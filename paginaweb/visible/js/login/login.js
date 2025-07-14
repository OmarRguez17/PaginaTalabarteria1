// JavaScript para la página de login - login.js

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
        initTabs();
        initPasswordToggles();
        initLoginForm();
        initRegisterForm();
        initForgotPasswordForm();
        initPasswordValidation();
        
        // Mostrar mensajes de alerta si existen en la URL (redirecciones desde el backend)
        checkUrlParams();
    });
});

/**
 * Inicializa las pestañas de la página de login
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.login-tab-btn');
    const tabContents = document.querySelectorAll('.login-tab-content');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginBtn = document.querySelector('.back-to-login');
    
    // Cambiar entre pestañas de login y registro
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Activar botón
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar contenido
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Ocultar alertas al cambiar de pestaña
            const alerts = document.querySelectorAll('.login-alert');
            alerts.forEach(alert => alert.style.display = 'none');
        });
    });
    
    // Navegación a "Olvidé mi contraseña"
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Desactivar botones de pestañas
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Mostrar contenido de recuperación
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById('forgot-password-tab').classList.add('active');
            
            // Ocultar alertas
            const alerts = document.querySelectorAll('.login-alert');
            alerts.forEach(alert => alert.style.display = 'none');
        });
    }
    
    // Volver a login desde recuperación
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            // Activar botón de login
            tabButtons.forEach(btn => {
                if (btn.getAttribute('data-tab') === 'login') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            // Mostrar contenido de login
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById('login-tab').classList.add('active');
            
            // Ocultar alertas
            const alerts = document.querySelectorAll('.login-alert');
            alerts.forEach(alert => alert.style.display = 'none');
        });
    }
}

/**
 * Inicializa los botones para mostrar/ocultar contraseña
 */
function initPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.parentElement.querySelector('input');
            const showIcon = this.querySelector('.show-password');
            const hideIcon = this.querySelector('.hide-password');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                showIcon.style.display = 'none';
                hideIcon.style.display = 'block';
            } else {
                passwordInput.type = 'password';
                showIcon.style.display = 'block';
                hideIcon.style.display = 'none';
            }
        });
    });
}

/**
 * Inicializa el formulario de login
 */
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    
    if (!loginForm) return;
    
    // No agregar event listener para permitir envío normal del formulario
    // El formulario se enviará directamente al servidor sin JavaScript
}

/**
 * Inicializa el formulario de registro
 */
function initRegisterForm() {
    const registerForm = document.getElementById('register-form');
    
    if (!registerForm) return;
    
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (validateRegisterForm(registerForm)) {
            // Enviar formulario normalmente
            registerForm.submit();
        }
    });
}

/**
 * Valida el formulario de registro
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} - Si el formulario es válido
 */
function validateRegisterForm(form) {
    let isValid = true;
    const nombre = form.querySelector('input[name="nombre"]');
    const apellidos = form.querySelector('input[name="apellidos"]');
    const email = form.querySelector('input[name="email"]');
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirm_password"]');
    const terms = form.querySelector('input[name="terms"]');
    const alert = form.parentElement.querySelector('.login-alert');
    
    // Validar nombre
    if (!nombre.value.trim()) {
        showInputError(nombre, 'Por favor, introduce tu nombre');
        isValid = false;
    } else {
        removeInputError(nombre);
    }
    
    // Validar apellidos
    if (!apellidos.value.trim()) {
        showInputError(apellidos, 'Por favor, introduce tus apellidos');
        isValid = false;
    } else {
        removeInputError(apellidos);
    }
    
    // Validar email
    if (!email.value.trim()) {
        showInputError(email, 'Por favor, introduce tu correo electrónico');
        isValid = false;
    } else if (!validateEmail(email.value)) {
        showInputError(email, 'Por favor, introduce un correo electrónico válido');
        isValid = false;
    } else {
        removeInputError(email);
    }
    
    // Validar contraseña
    if (!password.value.trim()) {
        showInputError(password, 'Por favor, introduce una contraseña');
        isValid = false;
    } else if (!validatePassword(password.value)) {
        showInputError(password, 'Tu contraseña no cumple con los requisitos');
        isValid = false;
    } else {
        removeInputError(password);
    }
    
    // Validar confirmación de contraseña
    if (!confirmPassword.value.trim()) {
        showInputError(confirmPassword, 'Por favor, confirma tu contraseña');
        isValid = false;
    } else if (confirmPassword.value !== password.value) {
        showInputError(confirmPassword, 'Las contraseñas no coinciden');
        isValid = false;
    } else {
        removeInputError(confirmPassword);
    }
    
    // Validar términos
    if (!terms.checked) {
        showInputError(terms, 'Debes aceptar los términos y condiciones');
        isValid = false;
    } else {
        removeInputError(terms);
    }
    
    // Mostrar alerta general si hay errores
    if (!isValid && alert) {
        showAlert(alert, 'Por favor, corrige los errores en el formulario', 'error');
    } else if (alert) {
        hideAlert(alert);
    }
    
    return isValid;
}

/**
 * Inicializa el formulario de recuperación de contraseña
 */
function initForgotPasswordForm() {
    const forgotForm = document.getElementById('forgot-password-form');
    
    if (!forgotForm) return;
    
    forgotForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (validateForgotPasswordForm(forgotForm)) {
            // Enviar formulario normalmente
            forgotForm.submit();
        }
    });
}

/**
 * Valida el formulario de recuperación de contraseña
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} - Si el formulario es válido
 */
function validateForgotPasswordForm(form) {
    let isValid = true;
    const email = form.querySelector('input[name="email"]');
    const alert = form.parentElement.querySelector('.login-alert');
    
    // Validar email
    if (!email.value.trim()) {
        showInputError(email, 'Por favor, introduce tu correo electrónico');
        isValid = false;
    } else if (!validateEmail(email.value)) {
        showInputError(email, 'Por favor, introduce un correo electrónico válido');
        isValid = false;
    } else {
        removeInputError(email);
    }
    
    // Mostrar alerta general si hay errores
    if (!isValid && alert) {
        showAlert(alert, 'Por favor, introduce un correo electrónico válido', 'error');
    } else if (alert) {
        hideAlert(alert);
    }
    
    return isValid;
}

/**
 * Inicializa la validación de contraseña en tiempo real
 */
function initPasswordValidation() {
    const passwordInput = document.getElementById('register-password');
    const requirements = document.querySelectorAll('.password-requirements li');
    
    if (!passwordInput || !requirements.length) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        // Validar cada requisito
        requirements.forEach(requirement => {
            const type = requirement.getAttribute('data-requirement');
            let isValid = false;
            
            switch (type) {
                case 'length':
                    isValid = password.length >= 8;
                    break;
                case 'uppercase':
                    isValid = /[A-Z]/.test(password);
                    break;
                case 'lowercase':
                    isValid = /[a-z]/.test(password);
                    break;
                case 'number':
                    isValid = /[0-9]/.test(password);
                    break;
            }
            
            if (isValid) {
                requirement.classList.add('valid');
            } else {
                requirement.classList.remove('valid');
            }
        });
    });
}

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - Si el email es válido
 */
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - Si la contraseña es válida
 */
function validatePassword(password) {
    // Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
}

/**
 * Muestra un error en un campo
 * @param {HTMLElement} input - Campo con error
 * @param {string} message - Mensaje de error
 */
function showInputError(input, message) {
    // Si es un checkbox, manejarlo diferente
    if (input.type === 'checkbox') {
        const container = input.parentElement;
        
        // Verificar si ya existe un mensaje de error
        let errorMessage = container.nextElementSibling;
        if (!errorMessage || !errorMessage.classList.contains('error-message')) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            container.parentElement.insertBefore(errorMessage, container.nextElementSibling);
        }
        
        errorMessage.textContent = message;
        return;
    }
    
    // Para campos normales
    input.classList.add('input-error');
    
    // Verificar si ya existe un mensaje de error
    const container = input.parentElement.parentElement;
    let errorMessage = container.querySelector('.error-message');
    
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        container.appendChild(errorMessage);
    }
    
    errorMessage.textContent = message;
}

/**
 * Elimina el error de un campo
 * @param {HTMLElement} input - Campo a corregir
 */
function removeInputError(input) {
    // Si es un checkbox, manejarlo diferente
    if (input.type === 'checkbox') {
        const container = input.parentElement;
        const errorMessage = container.nextElementSibling;
        
        if (errorMessage && errorMessage.classList.contains('error-message')) {
            errorMessage.remove();
        }
        return;
    }
    
    // Para campos normales
    input.classList.remove('input-error');
    
    const container = input.parentElement.parentElement;
    const errorMessage = container.querySelector('.error-message');
    
    if (errorMessage) {
        errorMessage.remove();
    }
}

/**
 * Muestra una alerta
 * @param {HTMLElement} alert - Elemento de alerta
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta: 'error', 'success', 'info'
 */
function showAlert(alert, message, type = 'info') {
    alert.className = `login-alert ${type}`;
    alert.querySelector('.login-alert-message').textContent = message;
    alert.style.display = 'flex';
    
    // Configurar botón de cerrar
    const closeButton = alert.querySelector('.login-alert-close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            hideAlert(alert);
        });
    }
}

/**
 * Oculta una alerta
 * @param {HTMLElement} alert - Elemento de alerta a ocultar
 */
function hideAlert(alert) {
    alert.style.display = 'none';
}

/**
 * Muestra el estado de carga en un formulario
 * @param {HTMLFormElement} form - Formulario
 */
function showLoadingState(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (submitButton) {
        // Guardar texto original
        submitButton.dataset.originalText = submitButton.innerHTML;
        
        // Cambiar a estado de carga
        submitButton.innerHTML = '<span class="spinner"></span> Procesando...';
        submitButton.disabled = true;}
    
    // Deshabilitar todos los inputs
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

/**
 * Oculta el estado de carga en un formulario
 * @param {HTMLFormElement} form - Formulario
 */
function hideLoadingState(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    
    if (submitButton) {
        // Restaurar texto original
        submitButton.innerHTML = submitButton.dataset.originalText;
        submitButton.disabled = false;
    }
    
    // Habilitar todos los inputs
    const inputs = form.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.disabled = false;
    });
}

/**
 * Verifica los parámetros de la URL para mostrar alertas
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';
    const tab = urlParams.get('tab');
    
    // Cambiar a pestaña específica si se solicita
    if (tab) {
        const tabButton = document.querySelector(`.login-tab-btn[data-tab="${tab}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }
    
    // Mostrar mensaje si existe
    if (message) {
        // Buscar la pestaña activa
        const activeTab = document.querySelector('.login-tab-content.active');
        if (activeTab) {
            const alert = activeTab.querySelector('.login-alert');
            if (alert) {
                showAlert(alert, decodeURIComponent(message), type);
            }
        }
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