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
      // Acceso directo sin jerarcaria - cada usuario solo accede a lo que tiene asignado
      localStorage.setItem('userEmail', email);
      localStorage.setItem('accessibleServers', JSON.stringify(result.accessibleServers));
      
      if (result.whatsapp) {
        localStorage.setItem('whatsapp', result.whatsapp);
      }
      
      // Guardar nombre de la persona (extraer del primer servidor con acceso)
      if (result.accessibleServers && Array.isArray(result.accessibleServers)) {
        const serverConAcceso = result.accessibleServers.find(s => s && s.nombre);
        if (serverConAcceso && serverConAcceso.nombre) {
          localStorage.setItem('userName', serverConAcceso.nombre);
        }
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