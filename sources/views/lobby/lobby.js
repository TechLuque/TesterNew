
const SERVER_TO_LOBBY = {
  0: 1, // Apps Script 1 → Sala 1
  1: 2, // Apps Script 2 → Sala 2
  2: 3  // Apps Script 3 → Sala 3
};

const lobbyPages = {
  1: '../maestria/maestria.html', // Antes tenías 'codigo' aquí, ajústalo según tu carpeta
  2: '../maquina/maquina.html',
  3: '../codigo/codigo.html'
};

// Almacenar salas accesibles globalmente
let accessibleLobbies = [];
let whatsappNumber = '573176484451';

document.addEventListener('DOMContentLoaded', function() {
  initializeLobby();
});

/**
 * Inicializa las salas disponibles basado en localStorage
 */
function initializeLobby() {
  const userEmail = localStorage.getItem('userEmail');
  const accessibleServersJSON = localStorage.getItem('accessibleServers');
  
  // Si no hay usuario, redirigir a login
  if (!userEmail || !accessibleServersJSON) {
    window.location.href = '../login/login.html';
    return;
  }
  
  try {
    const accessibleServers = JSON.parse(accessibleServersJSON);
    
    // Si está vacío, mostrar mensaje de no acceso
    if (!Array.isArray(accessibleServers) || accessibleServers.length === 0) {
      showNoAccessMessage();
      return;
    }
    
    // Obtener índices de los servidores accesibles
    // accessibleServers es [resultado1, resultado2, resultado3] donde null = sin acceso
    accessibleLobbies = accessibleServers
      .map((server, index) => server !== null ? SERVER_TO_LOBBY[index] : null)
      .filter(x => x !== null);
    
    // Obtener WhatsApp desde localStorage si existe
    const savedWhatsapp = localStorage.getItem('whatsapp');
    if (savedWhatsapp) {
      whatsappNumber = savedWhatsapp.replace(/[^0-9+]/g, '');
      const modalWhatsappBtn = document.getElementById('modalWhatsappBtn');
      if (modalWhatsappBtn) {
        modalWhatsappBtn.href = 'https://wa.me/' + whatsappNumber + '?text=Necesito%20ayuda%20para%20entrar%20a%20una%20sesi%C3%B3n';
      }
    }
    
  } catch (error) {
    console.error('Error procesando accesos:', error);
    showNoAccessMessage();
  }
}

/**
 * Acceder a una sala específica
 */
function accessLobby(lobbyNumber) {
  const userEmail = localStorage.getItem('userEmail');
  
  if (!userEmail) {
    window.location.href = '../login/login.html';
    return;
  }
  
  try {
    // Verificar si tiene acceso a esta sala
    if (!accessibleLobbies.includes(lobbyNumber)) {
      // Mostrar modal de sin acceso en lugar de redirigir
      showAccessDeniedModal();
      return;
    }
    
    // URLs de las páginas auxiliares (donde se valida acceso)
    const lobbyPages = {
      1: '../codigo/codigo.html',
      2: '../maquina/maquina.html',
      3: '../maestria/maestria.html'
    };
    
    // Guardar la sala actual
    localStorage.setItem('currentLobby', lobbyNumber);
    localStorage.setItem('currentLobbyAccess', new Date().toISOString());
    
    // Redirigir a la página auxiliar
    window.location.href = lobbyPages[lobbyNumber];
    
  } catch (error) {
    console.error('Error accediendo a sala:', error);
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
 * Mostrar mensaje de sin acceso (cuando ninguna sala está disponible)
 */
function showNoAccessMessage() {
  const noAccessMsg = document.getElementById('no-access-msg');
  const lobbiesGrid = document.querySelector('.lobbies-grid');
  
  if (lobbiesGrid) {
    lobbiesGrid.style.display = 'none';
  }
  if (noAccessMsg) {
    noAccessMsg.style.display = 'block';
  }
}
