
// JavaScript para la página de registro - registro.js

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
        initPasswordToggles();
        initPasswordValidation();
        initRegistroForm();
        initVerificationForm();
        initVerificationInputs();
        initBackButtons();
        initResendCode();
        
        // Mostrar mensajes de alerta si existen en la URL (redirecciones desde el backend)
        checkUrlParams();
    });
});

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
 * Inicializa la validación de contraseña en tiempo real
 */
function initPasswordValidation() {
    const passwordInput = document.getElementById('registro-password');
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
 * Inicializa el formulario de registro (Paso 1)
 */
function initRegistroForm() {
    const registroForm = document.getElementById('registro-form');
    
    if (!registroForm) return;
    
    registroForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar formulario
        if (validateRegistroForm(registroForm)) {
            // Recopilar datos del formulario
            const formData = new FormData(registroForm);
            
            // Mostrar estado de carga
            showLoadingState(registroForm);
            
            // Enviar datos al servidor
            fetch('/registro/create-temp-user', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // Ocultar estado de carga
                hideLoadingState(registroForm);
                
                if (data.success) {
                    // Almacenar datos para el siguiente paso
                    document.getElementById('verification-email').textContent = formData.get('email');
                    document.getElementById('temp-user-id').value = data.temp_user_id;
                    
                    // Avanzar al paso 2
                    goToStep(2);
                    
                    // Iniciar temporizador
                    startTimer();
                    
                    // Enfocar primer campo de verificación
                    const firstInput = document.querySelector('.verification-input');
                    if (firstInput) {
                        firstInput.focus();
                    }
                    
                    // Mostrar notificación
                    showNotification('Código enviado', 'Se ha enviado un código de verificación a tu correo electrónico.', 'info');
                } else {
                    // Mostrar error
                    const alert = document.querySelector('#step-1 .registro-alert');
                    if (alert) {
                        showAlert(alert, data.message, 'error');
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                hideLoadingState(registroForm);
                
                // Mostrar error
                const alert = document.querySelector('#step-1 .registro-alert');
                if (alert) {
                    showAlert(alert, 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.', 'error');
                }
            });
        }
    });
}

/**
 * Valida el formulario de registro
 * @param {HTMLFormElement} form - Formulario a validar
 * @returns {boolean} - Si el formulario es válido
 */
function validateRegistroForm(form) {
    let isValid = true;
    const nombre = form.querySelector('input[name="nombre"]');
    const apellidos = form.querySelector('input[name="apellidos"]');
    const email = form.querySelector('input[name="email"]');
    const password = form.querySelector('input[name="password"]');
    const confirmPassword = form.querySelector('input[name="confirm_password"]');
    const terms = form.querySelector('input[name="terms"]');
    const alert = form.parentElement.querySelector('.registro-alert');
    
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
 * Inicializa los campos de entrada del código de verificación
 */
function initVerificationInputs() {
    const inputs = document.querySelectorAll('.verification-input');
    const hiddenCodeInput = document.getElementById('verification-code');
    
    if (!inputs.length || !hiddenCodeInput) return;
    
    // Escuchar cambios en los inputs de verificación
    inputs.forEach((input, index) => {
        // Auto-focus en el siguiente input al ingresar un dígito
        input.addEventListener('input', function() {
            // Asegurar que solo se ingresen números
            this.value = this.value.replace(/[^0-9]/g, '');
            
            if (this.value && index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
            
            // Actualizar el campo oculto con el código completo
            updateVerificationCode(inputs, hiddenCodeInput);
        });
        
        // Manejar tecla de retroceso para navegar hacia atrás
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value && index > 0) {
                inputs[index - 1].focus();
            }
        });
        
        // Permitir pegar el código completo
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            
            if (paste) {
                const digits = paste.replace(/[^0-9]/g, '').split('');
                
                // Rellenar los inputs con los dígitos
                inputs.forEach((input, i) => {
                    if (digits[i]) {
                        input.value = digits[i];
                    }
                });
                
                // Enfocar el último input o el siguiente vacío
                let lastFilledIndex = Math.min(digits.length - 1, inputs.length - 1);
                inputs[lastFilledIndex].focus();
                
                // Actualizar el campo oculto
                updateVerificationCode(inputs, hiddenCodeInput);
            }
        });
    });
}

/**
 * Actualiza el campo oculto con el código de verificación completo
 * @param {NodeList} inputs - Campos de entrada del código
 * @param {HTMLInputElement} hiddenInput - Campo oculto para el código completo
 */
function updateVerificationCode(inputs, hiddenInput) {
    let code = '';
    inputs.forEach(input => {
        code += input.value;
    });
    hiddenInput.value = code;
}

/**
 * Inicializa el formulario de verificación (Paso 2)
 */
function initVerificationForm() {
    const verificationForm = document.getElementById('verification-form');
    
    if (!verificationForm) return;
    
    verificationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar que se haya completado el código
        const codeInput = document.getElementById('verification-code');
        const tempUserId = document.getElementById('temp-user-id');
        
        if (!codeInput || !tempUserId) return;
        
        const code = codeInput.value;
        const userId = tempUserId.value;
        
        // Validar que el código esté completo (6 dígitos)
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            const alert = document.querySelector('#step-2 .registro-alert');
            if (alert) {
                showAlert(alert, 'Por favor, introduce el código de 6 dígitos completo', 'error');
            }
            return;
        }
        
        // Mostrar estado de carga
        showLoadingState(verificationForm);
        
        // Enviar datos al servidor
        fetch('/registro/verify-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                temp_user_id: userId,
                verification_code: code
            })
        })
        .then(response => response.json())
        .then(data => {
            // Ocultar estado de carga
            hideLoadingState(verificationForm);
            
            if (data.success) {
                // Avanzar al paso 3 (completado)
                goToStep(3);
                
                // Mostrar notificación
                showNotification('Verificación exitosa', 'Tu cuenta ha sido verificada correctamente.', 'success');
            } else {
                // Mostrar error
                const alert = document.querySelector('#step-2 .registro-alert');
                if (alert) {
                    showAlert(alert, data.message, 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoadingState(verificationForm);
            
            // Mostrar error
            const alert = document.querySelector('#step-2 .registro-alert');
            if (alert) {
                showAlert(alert, 'Ha ocurrido un error. Por favor, intenta nuevamente más tarde.', 'error');
            }
        });
    });
}

/**
 * Inicializa los botones para volver a pasos anteriores
 */
function initBackButtons() {
    const backToStep1 = document.getElementById('back-to-step-1');
    
    if (backToStep1) {
        backToStep1.addEventListener('click', function() {
            goToStep(1);
        });
    }
}

/**
 * Inicializa el botón de reenvío de código
 */
function initResendCode() {
    const resendButton = document.getElementById('resend-code');
    
    if (!resendButton) return;
    
    resendButton.addEventListener('click', function() {
        if (this.disabled) return;
        
        const tempUserId = document.getElementById('temp-user-id').value;
        
        // Mostrar estado de carga en el botón
        const originalText = this.innerHTML;
        this.innerHTML = '<ion-icon name="sync-outline"></ion-icon><span>Enviando...</span>';
        this.disabled = true;
        
        // Enviar solicitud al servidor
        fetch('/registro/resend-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                temp_user_id: tempUserId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mostrar notificación
                showNotification('Código reenviado', 'Se ha enviado un nuevo código de verificación a tu correo electrónico.', 'info');
                
                // Reiniciar temporizador
                startTimer();
                
                // Restaurar botón pero mantenerlo deshabilitado (el temporizador lo habilitará)
                this.innerHTML = originalText;
            } else {
                // Mostrar error
                showNotification('Error', data.message, 'error');
                
                // Restaurar botón
                this.innerHTML = originalText;
                this.disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Mostrar error
            showNotification('Error', 'Ha ocurrido un error. Por favor, intenta nuevamente.', 'error');
            
            // Restaurar botón
            this.innerHTML = originalText;
            this.disabled = false;
        });
    });
}


/**
 * Inicia el temporizador para reenvío de código
 */
function startTimer() {
    const timerElement = document.getElementById('timer');
    const resendButton = document.getElementById('resend-code');
    
    if (!timerElement || !resendButton) return;
    
    // Configurar tiempo (5 minutos = 300 segundos)
    let timeLeft = 300;
    
    // Deshabilitar botón de reenvío
    resendButton.disabled = true;
    
    // Actualizar temporizador cada segundo
    const timerInterval = setInterval(() => {
        // Calcular minutos y segundos
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        
        // Actualizar texto del temporizador
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Decrementar tiempo
        timeLeft--;
        
        // Verificar si el tiempo ha terminado
        if (timeLeft < 0) {
            clearInterval(timerInterval);
            timerElement.textContent = '00:00';
            resendButton.disabled = false;
        }
    }, 1000);
}

/**
 * Cambia al paso especificado
 * @param {number} step - Número de paso (1, 2 o 3)
 */
function goToStep(step) {
    // Actualizar pasos en la parte superior
    const steps = document.querySelectorAll('.registro-step');
    steps.forEach(stepEl => {
        const stepNum = parseInt(stepEl.getAttribute('data-step'));
        if (stepNum === step) {
            stepEl.classList.add('active');
        } else if (stepNum < step) {
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active');
        }
    });
    
    // Actualizar barra de progreso
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
        // Calcular porcentaje de progreso
        const progress = ((step - 1) / 2) * 100;
        progressFill.style.width = `${progress}%`;
    }
    
    // Mostrar contenido del paso actual
    const stepContainers = document.querySelectorAll('.registro-form-container');
    stepContainers.forEach(container => {
        if (container.id === `step-${step}`) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });
    
    // Ocultar alertas al cambiar de paso
    const alerts = document.querySelectorAll('.registro-alert');
    alerts.forEach(alert => {
        alert.style.display = 'none';
    });
    
    // Scroll al inicio del contenedor
    window.scrollTo({
        top: document.querySelector('.registro-container').offsetTop - 50,
        behavior: 'smooth'
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
    alert.className = `registro-alert ${type}`;
    alert.querySelector('.registro-alert-message').textContent = message;
    alert.style.display = 'flex';
    
    // Configurar botón de cerrar
    const closeButton = alert.querySelector('.registro-alert-close');
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
        submitButton.disabled = true;
    }
    
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
        if (input.id !== 'resend-code') { // No habilitar el botón de reenvío (lo maneja el temporizador)
            input.disabled = false;
        }
    });
}

/**
 * Verifica los parámetros de la URL para mostrar alertas o ir a un paso específico
 */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    const type = urlParams.get('type') || 'info';
    const step = urlParams.get('step');
    
    // Cambiar a paso específico si se solicita
    if (step && ['1', '2', '3'].includes(step)) {
        goToStep(parseInt(step));
    }
    
    // Mostrar mensaje si existe
    if (message) {
        // Buscar la alerta en el paso activo
        const activeStep = document.querySelector('.registro-form-container[style*="display: block"]');
        if (activeStep) {
            const alert = activeStep.querySelector('.registro-alert');
            if (alert) {
                showAlert(alert, decodeURIComponent(message), type);
            }
        }
    }
    
    // Verificar si hay datos para pre-rellenar campos (por ejemplo, email temporal)
    const tempEmail = urlParams.get('email');
    if (tempEmail) {
        const emailInput = document.getElementById('registro-email');
        if (emailInput) {
            emailInput.value = decodeURIComponent(tempEmail);
        }
    }
    
    // Verificar si hay ID de usuario temporal para la verificación
    const tempUserId = urlParams.get('temp_user_id');
    if (tempUserId && step === '2') {
        const tempUserIdInput = document.getElementById('temp-user-id');
        if (tempUserIdInput) {
            tempUserIdInput.value = tempUserId;
        }
        
        // También rellena el email en la sección de verificación
        const emailDisplay = document.getElementById('verification-email');
        if (emailDisplay && tempEmail) {
            emailDisplay.textContent = decodeURIComponent(tempEmail);
        }
        
        // Iniciar temporizador
        startTimer();
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
