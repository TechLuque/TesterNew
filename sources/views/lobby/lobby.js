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
async function initializeLobby() {
    console.log('🎬 Inicializando Lobby...');

    const userEmail = localStorage.getItem('userEmail');

    // Si no hay usuario, redirigir a login
    if (!userEmail) {
        console.warn('⚠️ Usuario no autenticado - Redirigiendo a login');
        window.location.href = '/sources/views/login/login.html';
        return;
    }

    // Siempre re-consultar datos frescos del API para obtener links actualizados
    try {
        console.log('🔄 Consultando datos frescos del servidor...');
        const result = await validateEmailWithBackend(userEmail);

        if (result.hasAccess && Array.isArray(result.accessibleServers)) {
            // Aplicar reglas de acceso jerárquico
            const servers = result.accessibleServers;
            if (servers[2]) {
                if (!servers[1]) servers[1] = servers[2];
                if (!servers[0]) servers[0] = servers[2];
            }
            if (servers[1]) {
                if (!servers[0]) servers[0] = servers[1];
            }

            // Actualizar localStorage con datos frescos
            localStorage.setItem('accessibleServers', JSON.stringify(servers));
            if (result.whatsapp) {
                localStorage.setItem('whatsapp', result.whatsapp);
            }
            console.log('✅ localStorage actualizado con datos frescos');

            processAccessibleServers(servers);
        } else {
            console.warn('⚠️ El servidor indica sin acceso, usando datos del cache...');
            fallbackToCache();
        }
    } catch (error) {
        console.warn('⚠️ Error consultando servidor, usando cache local:', error.message);
        fallbackToCache();
    }
}

/**
 * Fallback: usar datos cacheados en localStorage si el servidor no responde
 */
function fallbackToCache() {
    const accessibleServersJSON = localStorage.getItem('accessibleServers');
    if (!accessibleServersJSON) {
        console.log('❌ Sin datos en cache - redirigiendo a login');
        window.location.href = '/sources/views/login/login.html';
        return;
    }

    try {
        const accessibleServers = JSON.parse(accessibleServersJSON);
        if (!Array.isArray(accessibleServers) || accessibleServers.length === 0) {
            console.log('❌ Cache vacío');
            return;
        }
        processAccessibleServers(accessibleServers);
    } catch (error) {
        console.error('💥 Error procesando cache:', error);
        accessibleLobbies = [1, 2, 3];
    }
}

/**
 * Procesar los servidores accesibles y actualizar la UI
 */
function processAccessibleServers(accessibleServers) {
    try {
        // Mapear servidores a salas
        accessibleLobbies = accessibleServers
            .map((server, index) => {
                if (server && typeof server === 'object' && Object.keys(server).length > 0) {
                    console.log(`✅ Sala ${SERVER_TO_LOBBY[index]} accesible - Server ${index}:`, server);
                    return SERVER_TO_LOBBY[index];
                }
                console.log(`❌ Sala ${SERVER_TO_LOBBY[index]} NO accesible - Server ${index}:`, server);
                return null;
            })
            .filter(x => x !== null);

        console.log('✅ Salas accesibles definitivas:', accessibleLobbies);

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
            1: '/sources/views/codigo/codigo.html',
            2: '/sources/views/maquina/maquina.html',
            3: '/sources/views/maestria/maestria.html'
        };

        console.log(`✅ Redirigiendo a sala ${lobbyNumber}`);

        // Guardar información
        localStorage.setItem('currentLobby', lobbyNumber);
        localStorage.setItem('currentLobbyAccess', new Date().toISOString());

        // Redirigir inmediatamente
        window.location.href = lobbyPages[lobbyNumber];

    } catch (error) {
        console.error('💥 Error accediendo a sala:', error);
        alert('Error al acceder a la sala');
    }
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
