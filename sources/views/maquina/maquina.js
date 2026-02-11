/**
 * MAQUINA.JS - Valida acceso a lobby MAQUINA
 * Corresponde a Apps Script 2 (Servidor 1)
 */

const LOBBY_NUMBER = 2; // Sala de MAQUINA
const SERVER_INDEX = 1; // Apps Script 2

document.addEventListener('DOMContentLoaded', function() {
  initializeMaquinaLobby();
});

/**
 * Inicializa la validación de acceso a maquina
 */
function initializeMaquinaLobby() {
  const userEmail = localStorage.getItem('userEmail');
  const accessibleServersJSON = localStorage.getItem('accessibleServers');
  
  console.log('=== Maquina DEBUG ===');
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
    console.log('Array type:', Array.isArray(accessibleServers) ? 'ARRAY' : 'NOT ARRAY');
    console.log('Array length:', accessibleServers?.length || 'undefined');
    console.log('SERVER_INDEX constante:', SERVER_INDEX);
    
    console.log('Detalles de cada índice:');
    for (let i = 0; i < 3; i++) {
      const item = accessibleServers?.[i];
      console.log(`  [${i}]:`, JSON.stringify(item));
    }
    
    // Validar que sea un array
    if (!Array.isArray(accessibleServers)) {
      console.error('❌ accessibleServers no es un array válido. Type:', typeof accessibleServers);
      showAccessDenied();
      return;
    }
    
    // Verificar si tiene acceso a MAQUINA (validado por Apps Script 1, índice 0)
    const serverData = accessibleServers[SERVER_INDEX];
    
    console.log(`\n🔍 Validando acceso a MAQUINA:`);
    console.log(`   SERVER_INDEX = ${SERVER_INDEX}`);
    console.log(`   serverData = `, JSON.stringify(serverData));
    
    // VALIDACIÓN: Objeto con propiedades = acceso, null/vacío = sin acceso
    const hasAccessToMaquinaCode = serverData && 
                                  typeof serverData === 'object' && 
                                  Object.keys(serverData).length > 0;
    
    console.log(`   Tiene propiedades:`, serverData ? Object.keys(serverData).length : 0);
    console.log(`   RESULTADO FINAL:`, hasAccessToMaquinaCode);
    
    console.log(`\n✅ Resultado: hasAccessToMaquinaCode = ${hasAccessToMaquinaCode}`);
    console.log('===== FIN DEBUG =====\n');
    
    if (hasAccessToMaquinaCode) {
      showAccessGranted();
    } else {
      showAccessDenied();
    }
  } catch (error) {
    console.error('❌ Error validando acceso:', error);
    console.error('   Stack:', error.stack);
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
  
  const zoomButton = document.getElementById('btn-zoom-maquina');
  
  if (zoomButton && joinUrl) {
    zoomButton.href = joinUrl;
    zoomButton.onclick = function(e) {
      recordAccessLog('maquina');
    };
  }
}

/**
 * Muestra acceso denegado en modal
 */
function showAccessDenied() {
  const modal = document.getElementById('access-denied-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
  
  // Obtener WhatsApp desde localStorage
  const whatsappNumber = localStorage.getItem('whatsapp');
  const whatsappLink = document.getElementById('deniedWhatsappBtn');
  
  if (whatsappLink && whatsappNumber) {
    whatsappLink.href = 'https://wa.me/' + whatsappNumber.replace(/[^0-9]/g, '');
  }
}

/**
 * Cerrar modal de acceso denegado
 */
function closeAccessDeniedModal() {
  const modal = document.getElementById('access-denied-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Cerrar modal al hacer clic fuera del contenido
document.addEventListener('click', function(event) {
  const modal = document.getElementById('access-denied-modal');
  if (modal && event.target === modal) {
    closeAccessDeniedModal();
  }
});

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
