const API_BASE_URL = '/api';

async function validateEmailWithBackend(email) {
  try {
    console.log('📤 Enviando validación para email:', email);
    
    const response = await fetch(`${API_BASE_URL}/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    
    const result = await response.json();
    console.log('📥 Respuesta del backend:', JSON.stringify(result, null, 2));
    console.log('hasAccess:', result.hasAccess);
    console.log('\n=== DETALLE DE SERVIDORES ===');
    if (result.accessibleServers && Array.isArray(result.accessibleServers)) {
      console.log('Total servidores:', result.accessibleServers.length);
      const serverNames = ['CODIGO (idx 0)', 'MAQUINA (idx 1)', 'MAESTRIA (idx 2)'];
      result.accessibleServers.forEach((server, index) => {
        console.log(`${serverNames[index]}:`, server ? JSON.stringify(server) : '❌ null (SIN ACCESO)');
      });
    }
    console.log('============================\n');
    
    return result;
  } catch (error) {
    console.error('❌ Error validando email:', error);
    throw error;
  }
}

const REDIRECT_PAGE = '/sources/views/lobby/lobby.html';
