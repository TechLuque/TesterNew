async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim().toLowerCase();
  const errorDiv = document.getElementById('errorMessage');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  if (!email) {
    showError(errorDiv, 'Por favor ingresa un email.');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verificando...';
  
  try {
    const result = await validateEmailWithBackend(email);
    
    // DEBUG: Ver respuesta completa del servidor
    console.log('🔍 Respuesta completa del API:', JSON.stringify(result, null, 2));
    if (result._debug_raw_responses) {
      console.log('📥 Respuestas CRUDAS de Apps Scripts:');
      result._debug_raw_responses.forEach((r, i) => {
        console.log(`  [${i}]:`, JSON.stringify(r));
      });
    }
    console.log('✅ accessibleServers:', JSON.stringify(result.accessibleServers, null, 2));
    console.log('🔑 hasAccess:', result.hasAccess);
    
    if (result.hasAccess) {
      // REGLAS DE ACCESO JERÁRQUICO:
      // Maestría [2] → acceso a Maestría + Máquina + Código
      // Máquina [1] → acceso a Máquina + Código
      // Código [0] → solo Código
      const accessibleServers = result.accessibleServers;
      if (Array.isArray(accessibleServers)) {
        if (accessibleServers[2]) {
          if (!accessibleServers[1]) accessibleServers[1] = accessibleServers[2];
          if (!accessibleServers[0]) accessibleServers[0] = accessibleServers[2];
        }
        if (accessibleServers[1]) {
          if (!accessibleServers[0]) accessibleServers[0] = accessibleServers[1];
        }
      }
      
      localStorage.setItem('userEmail', email);
      localStorage.setItem('accessibleServers', JSON.stringify(accessibleServers));
      
      if (result.whatsapp) {
        localStorage.setItem('whatsapp', result.whatsapp);
      }
      
      hideError(errorDiv);
      window.location.href = REDIRECT_PAGE;
    } else {
      showError(errorDiv, result.error || 'Email no autorizado.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'INGRESAR<span class="arrow">→</span>';
    }
  } catch (error) {
    showError(errorDiv, 'Error al conectar. Intenta nuevamente.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'INGRESAR<span class="arrow">→</span>';
  }
}

function showError(element, message) {
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

function hideError(element) {
  if (element) {
    element.textContent = '';
    element.style.display = 'none';
  }
}