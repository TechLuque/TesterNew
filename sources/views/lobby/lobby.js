/**
 * NEWLOBBY.JS - Lógica de gestión del Lobby
 * Maneja acceso a salas, modales y transiciones
 */

// Mapeo de servidores a número de sala
const SERVER_TO_LOBBY = {
    0: 1, // Server 1 → Sala 1
    1: 2, // Server 2 → Sala 2
    2: 3  // Server 3 → Sala 3
};

// Variables globales
let accessibleLobbies = [1, 2, 3]; // Por defecto todas disponibles
let whatsappNumber = '573176484451';

/**
 * Inicializar al cargar la página
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeLobby();
});

/**
 * Inicializar el lobby
 */
function initializeLobby() {
    console.log('🎬 Inicializando Lobby...');

    const userEmail = localStorage.getItem('userEmail');
    const accessibleServersJSON = localStorage.getItem('accessibleServers');

    // Si no hay usuario, redirigir a login
    if (!userEmail || !accessibleServersJSON) {
        console.warn('⚠️ Usuario no autenticado - Redirigiendo a login');
        window.location.href = '../login/login.html';
        return;
    }

    try {
        const accessibleServers = JSON.parse(accessibleServersJSON);

        // Si está vacío, mostrar mensaje de no acceso
        if (!Array.isArray(accessibleServers) || accessibleServers.length === 0) {
            console.log('❌ Sin salas disponibles');
            return;
        }

        // Mapear servidores a salas
        accessibleLobbies = accessibleServers
            .map((server, index) => server !== null ? SERVER_TO_LOBBY[index] : null)
            .filter(x => x !== null);

        console.log('✅ Salas accesibles:', accessibleLobbies);

        // Obtener WhatsApp desde localStorage si existe
        const savedWhatsapp = localStorage.getItem('whatsapp');
        if (savedWhatsapp) {
            whatsappNumber = savedWhatsapp.replace(/[^0-9+]/g, '');
            updateWhatsappLinks();
        }

    } catch (error) {
        console.error('💥 Error procesando accesos:', error);
        accessibleLobbies = [1, 2, 3]; // Fallback
    }
}

/**
 * Acceder a una sala específica
 */
function accessLobby(lobbyNumber) {
    console.log(`🔍 Accediendo a sala ${lobbyNumber}`);

    const userEmail = localStorage.getItem('userEmail');

    if (!userEmail) {
        console.warn('⚠️ No hay usuario');
        window.location.href = '../login/login.html';
        return;
    }

    try {
        // Verificar si tiene acceso
        if (!accessibleLobbies.includes(lobbyNumber)) {
            console.warn(`❌ Sin acceso a sala ${lobbyNumber}`);
            showAccessDeniedModal();
            return;
        }

        // URLs de destino
        const lobbyPages = {
            1: '../codigo/codigo.html',
            2: '../maquina/maquina.html',
            3: '../maestria/maestria.html'
        };

        console.log(`✅ Redirigiendo a sala ${lobbyNumber}`);

        // Guardar información
        localStorage.setItem('currentLobby', lobbyNumber);
        localStorage.setItem('currentLobbyAccess', new Date().toISOString());

        // Crear efecto de transición
        createTransitionEffect(lobbyNumber);

        // Redirigir después de la animación
        setTimeout(() => {
            window.location.href = lobbyPages[lobbyNumber];
        }, 600);

    } catch (error) {
        console.error('💥 Error accediendo a sala:', error);
        alert('Error al acceder a la sala');
    }
}

/**
 * Crear efecto de transición visual
 */
function createTransitionEffect(lobbyNumber) {
    const colors = {
        1: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        2: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        3: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    };

    const card = document.querySelector(`[data-room="${lobbyNumber}"]`);
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const overlay = document.createElement('div');

    overlay.style.position = 'fixed';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
    overlay.style.background = colors[lobbyNumber];
    overlay.style.zIndex = '3000';
    overlay.style.pointerEvents = 'none';
    overlay.style.borderRadius = '20px';

    document.body.appendChild(overlay);

    // Animar expansión
    overlay.animate([
        {
            top: rect.top + 'px',
            left: rect.left + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px',
            opacity: 0.8,
            borderRadius: '20px'
        },
        {
            top: '0px',
            left: '0px',
            width: '100%',
            height: '100%',
            opacity: 1,
            borderRadius: '0px'
        }
    ], {
        duration: 600,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards'
    });
}

/**
 * Mostrar modal de acceso denegado
 */
function showAccessDeniedModal() {
    const modal = document.getElementById('noAccessModal');
    if (modal) {
        modal.style.display = 'flex';
        console.log('📱 Modal de acceso denegado mostrado');
    }
}

/**
 * Cerrar modal de acceso denegado
 */
function closeNoAccessModal() {
    const modal = document.getElementById('noAccessModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Cerrar modal al hacer clic afuera
 */
document.addEventListener('click', function(event) {
    const modal = document.getElementById('noAccessModal');
    if (modal && event.target === modal) {
        closeNoAccessModal();
    }
});

/**
 * Actualizar links de WhatsApp
 */
function updateWhatsappLinks() {
    const whatsappFloat = document.querySelector('.whatsapp-float');
    const whatsappModal = document.getElementById('modalWhatsappBtn');
    const message = encodeURIComponent('Necesito ayuda para entrar a una sesión');
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;

    if (whatsappFloat) {
        whatsappFloat.href = whatsappURL;
    }
    if (whatsappModal) {
        whatsappModal.href = whatsappURL;
    }

    console.log('✅ Links de WhatsApp actualizados');
}
