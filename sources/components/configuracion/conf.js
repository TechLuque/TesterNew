const API_BASE_URL = '/api';

async function validateEmailWithBackend(email) {
  try {
    const response = await fetch(`${API_BASE_URL}/validate-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    if (!response.ok) throw new Error(`Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error validando email:', error);
    throw error;
  }
}

const REDIRECT_PAGE = '../lobby/lobby.html';
