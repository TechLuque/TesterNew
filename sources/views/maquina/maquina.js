/**
 * MAQUINA.JS - Valida acceso a lobby MAQUINA
 * Corresponde a Apps Script 2 (Servidor 1)
 * 
 * DEBUGGING: Abre DevTools (F12) → Console para ver los logs
 */

const LOBBY_NUMBER = 2; // Sala de máquina
const SERVER_INDEX = 1; // Apps Script 2

document.addEventListener('DOMContentLoaded', function() {
  initializeMaquinaLobby();
});

/**
 * Inicializa la validación de acceso a máquina
 */
function initializeMaquinaLobby() {
  const userEmail = localStorage.getItem('userEmail');
  const accessibleServersJSON = localStorage.getItem('accessibleServers');
  
  console.log('%c=== MÁQUINA LOBBY - VALIDACIÓN INICIAL ===', 'background:#ffd204;color:#000;padding:10px;font-weight:bold;');
  console.log('📧 Email:', userEmail);
  console.log('🔑 AccessibleServersJSON (raw):', accessibleServersJSON);
  
  // Si no hay usuario, redirigir a login
  if (!userEmail || !accessibleServersJSON) {
    console.error('%c❌ FALLO CRÍTICO: No hay usuario o servidores accesibles', 'background:red;color:white;padding:5px;');
    console.warn('⚠️  Redirigiendo a login...');
    window.location.href = '/sources/views/login/login.html';
    return;
  }
  
  try {
    const accessibleServers = JSON.parse(accessibleServersJSON);
    
    console.log('%c📦 ANÁLISIS DE accessibleServers:', 'background:#69E4FF;color:#000;padding:5px;');
    console.log('   Es Array?:', Array.isArray(accessibleServers) ? '✅ SÍ' : '❌ NO');
    console.log('   Largo:', accessibleServers?.length || 'indefinido');
    console.log('   Contenido completo:', accessibleServers);
    
    // Validar que sea un array
    if (!Array.isArray(accessibleServers)) {
      console.error('❌ ERROR: accessibleServers no es un array. Tipo encontrado:', typeof accessibleServers);
      showAccessDenied();
      return;
    }
    
    console.log('%c📋 DETALLES POR ÍNDICE:', 'background:#ffd204;color:#000;padding:5px;');
    console.table({
      '[0] CÓDIGO': {
        'Valor': accessibleServers[0],
        'Es objeto?': typeof accessibleServers[0] === 'object' ? '✅' : '❌',
        'Propiedades': accessibleServers[0] ? Object.keys(accessibleServers[0]) : 'N/A'
      },
      '[1] MAQUINA': {
        'Valor': accessibleServers[1],
        'Es objeto?': typeof accessibleServers[1] === 'object' ? '✅' : '❌',
        'Propiedades': accessibleServers[1] ? Object.keys(accessibleServers[1]) : 'N/A'
      },
      '[2] MAESTRIA': {
        'Valor': accessibleServers[2],
        'Es objeto?': typeof accessibleServers[2] === 'object' ? '✅' : '❌',
        'Propiedades': accessibleServers[2] ? Object.keys(accessibleServers[2]) : 'N/A'
      }
    });
    
    // VALIDACIÓN ESPECÍFICA DE MÁQUINA
    const serverData = accessibleServers[SERVER_INDEX];
    
    console.log('%c🔍 VALIDACIÓN ESPECÍFICA - MÁQUINA (Índice 1):', 'background:#e74c3c;color:white;padding:5px;font-weight:bold;');
    console.log('   Índice:', SERVER_INDEX);
    console.log('   Dato en [1]:', serverData);
    console.log('   Tipo:', typeof serverData);
    
    if (serverData) {
      console.log('   Propiedades:', Object.keys(serverData));
      console.log('   JSON:', JSON.stringify(serverData));
    }
    
    // LÓGICA DE VALIDACIÓN
    const isNull = serverData === null;
    const isUndefined = serverData === undefined;
    const isObject = typeof serverData === 'object' && serverData !== null;
    const hasProperties = isObject && Object.keys(serverData).length > 0;
    const hasJoinUrl = isObject && serverData.join_url;
    const hasUrl = isObject && serverData.url;
    const hasLink = isObject && serverData.link;
    
    console.log('%c📊 ANÁLISIS DETALLADO:', 'background:#27ae60;color:white;padding:5px;');
    console.log('   ¿Es null?', isNull ? '✅ YES' : '❌ NO');
    console.log('   ¿Es undefined?', isUndefined ? '✅ YES' : '❌ NO');
    console.log('   ¿Es objeto?', isObject ? '✅ YES' : '❌ NO');
    console.log('   ¿Tiene propiedades?', hasProperties ? '✅ YES (' + Object.keys(serverData).length + ')' : '❌ NO');
    console.log('   ¿Tiene join_url?', hasJoinUrl ? '✅ YES: ' + serverData.join_url : '❌ NO');
    console.log('   ¿Tiene url?', hasUrl ? '✅ YES: ' + serverData.url : '❌ NO');
    console.log('   ¿Tiene link?', hasLink ? '✅ YES: ' + serverData.link : '❌ NO');
    
    // DECISIÓN FINAL
    const hasAccessToMaquina = serverData && 
                               typeof serverData === 'object' && 
                               Object.keys(serverData).length > 0 &&
                               (serverData.join_url || serverData.url || serverData.link || 
                                serverData.permitido === true || serverData.con_acceso === true ||
                                serverData.access === true || serverData.authorized === true ||
                                serverData.ok === true || serverData.success === true);
    
    console.log('%c🎯 RESULTADO FINAL:', hasAccessToMaquina ? 'background:green;color:white;padding:8px;font-weight:bold;' : 'background:red;color:white;padding:8px;font-weight:bold;');
    console.log(hasAccessToMaquina ? '✅ ACCESO PERMITIDO' : '❌ ACCESO DENEGADO');
    console.log('===== FIN DEBUG =====\n');
    
    if (hasAccessToMaquina) {
      showAccessGranted();
    } else {
      showAccessDenied();
    }
  } catch (error) {
    console.error('%c💥 EXCEPCIÓN:', 'background:red;color:white;padding:5px;font-weight:bold;');
    console.error('   Mensaje:', error.message);
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
    // El segundo servidor es el que tiene acceso a máquina
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
