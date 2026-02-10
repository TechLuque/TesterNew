/*
 * MAESTRIA.JS - Valida acceso a lobby MAESTRIA
 * Corresponde a Apps Script 3 (Servidor 2)
 */

const LOBBY_NUMBER = 3; // Sala de maestría
const SERVER_INDEX = 2; // Apps Script 3

document.addEventListener('DOMContentLoaded', function() {
  initializeMaestriaLobby();
});

/*
 * Inicializa la validación de acceso a maestría
 */
function initializeMaestriaLobby() {
  const userEmail = localStorage.getItem('userEmail');
  const accessibleServersJSON = localStorage.getItem('accessibleServers');
  
  console.log('=== MAESTRIA DEBUG ===');
  console.log('Email:', userEmail);
  console.log('AccessibleServersJSON (raw):', accessibleServersJSON);
  
  // Si no hay usuario, redirigir a login
  if (!userEmail || !accessibleServersJSON) {
    console.warn('⚠️ No hay usuario o accesos registrados');
    window.location.href = '/sources/views/login/login.html';
    return;
  }
  
  try {
    const accessibleServers = JSON.parse(accessibleServersJSON);
    console.log('AccessibleServers parsed:', accessibleServers);
    console.log('Array length:', accessibleServers.length);
    console.log('SERVER_INDEX:', SERVER_INDEX);
    console.log('Server data at index', SERVER_INDEX, ':', accessibleServers[SERVER_INDEX]);
    
    // Validar que sea un array
    if (!Array.isArray(accessibleServers)) {
      console.error('❌ accessibleServers no es un array válido. Type:', typeof accessibleServers);
      showAccessDenied();
      return;
    }
    
    // Verificar si tiene acceso a MAESTRIA (validado por Apps Script 3, índice 2)
    const serverData = accessibleServers[SERVER_INDEX];
    
    // Más flexible: si hay datos, es que tiene acceso
    const hasAccessToMaestria = serverData !== undefined && serverData !== null;
    
    console.log('hasAccessToMaestria:', hasAccessToMaestria);
    console.log('===== FIN DEBUG =====');
    
    if (hasAccessToMaestria) {
      showAccessGranted();
    } else {
      showAccessDenied();
    }
  } catch (error) {
    console.error('❌ Error validando acceso:', error);
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
    // El tercer servidor es el que tiene acceso a maestría
    if (accessibleServers[SERVER_INDEX] && accessibleServers[SERVER_INDEX].join_url) {
      joinUrl = accessibleServers[SERVER_INDEX].join_url;
    }
  } catch (error) {
    console.error('Error obteniendo join_url:', error);
  }
  
  const zoomButton = document.getElementById('btn-zoom-maestria');
  
  if (zoomButton && joinUrl) {
    zoomButton.href = joinUrl;
    zoomButton.onclick = function(e) {
      recordAccessLog('maestria');
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
  window.location.href = '/sources/views/lobby/lobby.html';
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
  window.location.href = '/sources/views/login/login.html';
}
