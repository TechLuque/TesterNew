async function handleLogin(event) {
  event.preventDefault();
  
  console.log('🔵 INICIO PROCESO DE LOGIN');
  
  const email = document.getElementById('email').value.trim().toLowerCase();
  const errorDiv = document.getElementById('errorMessage');
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  console.log('📧 Email ingresado:', email);
  
  if (!email) {
    console.log('⚠️ Email vacío');
    showError(errorDiv, 'Por favor ingresa un email.');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verificando...';
  
  try {
    console.log('🌐 Enviando solicitud al backend...');
    const result = await validateEmailWithBackend(email);
    
    console.log('✅ Respuesta recibida:', result);
    console.log('   hasAccess:', result.hasAccess);
    console.log('   accessibleServers:', result.accessibleServers);
    console.log('   error:', result.error);
    
    if (result.hasAccess) {
      console.log('✅✅✅ ACCESO PERMITIDO');
      
      // REGLA DE NEGOCIO: Si tiene acceso a Maestría, también tiene acceso a Código
      const accessibleServers = result.accessibleServers;
      if (Array.isArray(accessibleServers) && accessibleServers[2] && !accessibleServers[0]) {
        console.log('Aplicando regla: Maestría -> también Código');
        accessibleServers[0] = accessibleServers[2];
      }
      
      localStorage.setItem('userEmail', email);
      localStorage.setItem('accessibleServers', JSON.stringify(accessibleServers));
      
      if (result.whatsapp) {
        localStorage.setItem('whatsapp', result.whatsapp);
      }
      
      console.log('Datos guardados en localStorage');
      hideError(errorDiv);
      console.log('Redirigiendo a:', REDIRECT_PAGE);
      window.location.href = REDIRECT_PAGE;
    } else {
      console.log('❌ ACCESO DENEGADO -', result.error);
      showError(errorDiv, result.error || 'Email no autorizado.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'INGRESAR<span class="arrow">→</span>';
    }
  } catch (error) {
    console.log('💥 ERROR CAPTURADO:', error);
    console.log('   Mensaje:', error.message);
    console.log('   Stack:', error.stack);
    showError(errorDiv, 'Error al conectar. Intenta nuevamente.');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'INGRESAR<span class="arrow">→</span>';
    console.error('Error completo:', error);
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