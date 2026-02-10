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
    
    if (result.hasAccess) {
      // REGLAS DE ACCESO JERÁRQUICO:
      // Maestría [2] → acceso a Maestría + Máquina + Código
      // Máquina [1] → acceso a Máquina + Código
      // Código [0] → solo Código
      const accessibleServers = result.accessibleServers;
      if (Array.isArray(accessibleServers)) {
        // Si tiene Maestría, dar también Máquina y Código
        if (accessibleServers[2]) {
          if (!accessibleServers[1]) accessibleServers[1] = accessibleServers[2];
          if (!accessibleServers[0]) accessibleServers[0] = accessibleServers[2];
        }
        // Si tiene Máquina, dar también Código
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