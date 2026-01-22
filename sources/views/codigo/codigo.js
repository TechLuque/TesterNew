/**
 * CODIGO.JS - Valida acceso a lobby CODIGO
 * Corresponde a Apps Script 1 (Servidor 0)
 */

const LOBBY_NUMBER = 1; // Sala de código
const SERVER_INDEX = 0; // Apps Script 1

document.addEventListener('DOMContentLoaded', function() {
  initializeCodigoLobby();
});

/**
 * Inicializa la validación de acceso a código
 */
function initializeCodigoLobby() {
  const userEmail = localStorage.getItem('userEmail');
  const accessibleServersJSON = localStorage.getItem('accessibleServers');
  
  // Si no hay usuario, redirigir a login
  if (!userEmail || !accessibleServersJSON) {
    window.location.href = '../login/login.html';
    return;
  }
  
  try {
    const accessibleServers = JSON.parse(accessibleServersJSON);
    
    // Verificar si tiene acceso a CODIGO (validado por Apps Script 1)
    const hasAccessToCodigoCode = accessibleServers[SERVER_INDEX] !== undefined && 
                                   accessibleServers[SERVER_INDEX] !== null;
    
    if (hasAccessToCodigoCode) {
      showAccessGranted();
    } else {
      showAccessDenied();
    }
  } catch (error) {
    console.error('Error validando acceso:', error);
    showAccessDenied();
  }
}

/**
 * Muestra acceso concedido - permite entrar a la sala
 */
function showAccessGranted() {
  const deniedContainer = document.getElementById('access-denied');
  const grantedContainer = document.getElementById('access-granted');
  
  if (deniedContainer) deniedContainer.style.display = 'none';
  if (grantedContainer) grantedContainer.style.display = 'block';
  
  // Obtener el join_url de la sala desde localStorage
  const accessibleServersJSON = localStorage.getItem('accessibleServers');
  let joinUrl = null;
  
  try {
    const accessibleServers = JSON.parse(accessibleServersJSON);
    // El primer servidor es el que tiene acceso a código
    if (accessibleServers[SERVER_INDEX] && accessibleServers[SERVER_INDEX].join_url) {
      joinUrl = accessibleServers[SERVER_INDEX].join_url;
    }
  } catch (error) {
    console.error('Error obteniendo join_url:', error);
  }
  
  const zoomButton = document.getElementById('btn-zoom-codigo');
  
  if (zoomButton && joinUrl) {
    zoomButton.href = joinUrl;
    zoomButton.onclick = function(e) {
      recordAccessLog('codigo');
    };
  }
}

/**
 * Muestra acceso denegado
 */
function showAccessDenied() {
  const grantedContainer = document.getElementById('access-granted');
  const deniedContainer = document.getElementById('access-denied');
  
  if (grantedContainer) grantedContainer.style.display = 'none';
  if (deniedContainer) deniedContainer.style.display = 'block';
  
  // Obtener WhatsApp desde localStorage
  const whatsappNumber = localStorage.getItem('whatsapp');
  const whatsappLink = document.querySelector('.btn-whatsapp');
  
  if (whatsappLink && whatsappNumber) {
    whatsappLink.href = 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g, '');
  }
}

/**
 * Registra el acceso a la sala
 */
function recordAccessLog(lobbyName) {
  const userEmail = localStorage.getItem('userEmail');
  const timestamp = new Date().toISOString();
  
  localStorage.setItem(`accessed_${lobbyName}`, timestamp);
  console.log(`Acceso a ${lobbyName} - ${userEmail} - ${timestamp}`);
}

/**
 * Volver al lobby principal
 */
function backToLobby() {
  window.location.href = '../lobby/lobby.html';
}

/**
 * Logout
 */
function logout() {
  localStorage.removeItem('userEmail');
  localStorage.removeItem('accessibleServers');
  localStorage.removeItem('currentLobby');
  localStorage.removeItem('lobby1_url');
  localStorage.removeItem('lobby2_url');
  localStorage.removeItem('lobby3_url');
  localStorage.removeItem('whatsapp');
  window.location.href = '../login/login.html';
}
