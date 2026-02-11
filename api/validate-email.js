/**
 * VERCEL SERVERLESS FUNCTION - Validación de email contra AppScripts
 * POST /api/validate-email
 * 
 * Variables de entorno requeridas:
 * - APPSCRIPT_CODIGO
 * - APPSCRIPT_MAQUINA
 * - APPSCRIPT_MAESTRIA
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'OK',
      endpoint: 'POST /api/validate-email'
    });
  }

  if (req.method === 'POST') {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          hasAccess: false, 
          error: 'Email es requerido' 
        });
      }

      const appScripts = [
        { name: 'CODIGO', url: process.env.APPSCRIPT_CODIGO },
        { name: 'MAQUINA', url: process.env.APPSCRIPT_MAQUINA },
        { name: 'MAESTRIA', url: process.env.APPSCRIPT_MAESTRIA }
      ];

      for (const script of appScripts) {
        if (!script.url) {
          return res.status(500).json({ 
            hasAccess: false, 
            error: 'Error de configuración en el servidor'
          });
        }
      }

      // Usar Promise.allSettled para que un Apps Script lento/fallido no bloquee a los demás
      const settled = await Promise.allSettled(
        appScripts.map(script => validateWithAppScript(script.url, email))
      );

      const results = settled.map((s, i) => {
        if (s.status === 'fulfilled') return s.value;
        console.log(`[Server ${i}] Promise rejected:`, s.reason?.message || s.reason);
        return null;
      });

      const accessibleServers = results.map((r, index) => {
        if (r === null) {
          console.log(`[Server ${index}] Respuesta null`);
          return null;
        }
        
        if (typeof r === 'object') {
          const keys = Object.keys(r);
          const hasProperties = keys.length > 0;
          
          if (!hasProperties) {
            console.log(`[Server ${index}] Objeto vacío`);
            return null;
          }

          console.log(`[Server ${index}] Respuesta:`, JSON.stringify(r));
          
          // Si tiene join_url, es una respuesta válida - permitir acceso
          if (r.join_url || r.JOIN_URL || r.url || r.link || r.zoom_url) {
            return r;
          }
          
          // Solo rechazar cuando los valores CLARAMENTE indican error
          const hasExplicitError = (r.error && r.error !== false && r.error !== 'false' && r.error !== null) || 
                                   (r.error_message && typeof r.error_message === 'string') || 
                                   (r.errorMessage && typeof r.errorMessage === 'string');
          const statusIsError = r.status === 'error' || r.status === 'fail' || r.status === 'failed' || r.status === 'not_found';
          const isNotFound = r.found === false || r.exists === false || r.usuario === false || r.registered === false || r.encontrado === false;
          const isUnauthorized = r.authorized === false || r.access === false || r.permitido === false || r.con_acceso === false;
          const explicitNoAccess = r.ok === false || r.success === false || r.hasAccess === false;
          
          const hasRejectIndicator = hasExplicitError || statusIsError || isNotFound || isUnauthorized || explicitNoAccess;
          
          if (hasRejectIndicator) {
            console.log(`[Server ${index}] Rechazado por indicador:`, { hasExplicitError, statusIsError, isNotFound, isUnauthorized, explicitNoAccess });
            return null;
          }
          
          // Si no tiene indicadores de rechazo, asumimos acceso válido
          return r;
        }
        
        console.log(`[Server ${index}] Tipo no soportado:`, typeof r);
        return null;
      });

      const hasAccess = accessibleServers.some(s => s !== null);
      const whatsapp = accessibleServers.find(s => s && (s.whatsapp || s.phone))?.whatsapp || 
                       accessibleServers.find(s => s && (s.whatsapp || s.phone))?.phone || null;

      // Log para debug - ver respuestas crudas vs procesadas
      console.log('📧 Email:', email);
      console.log('📥 Respuestas crudas de Apps Scripts:', JSON.stringify(results));
      console.log('✅ accessibleServers procesados:', JSON.stringify(accessibleServers));
      console.log('🔑 hasAccess:', hasAccess);

      return res.status(200).json({
        hasAccess,
        accessibleServers,
        whatsapp,
        // Incluir respuestas crudas para debug (quitar en producción)
        _debug_raw_responses: results,
        error: hasAccess ? null : 'Email no autorizado'
      });

    } catch (error) {
      return res.status(500).json({ 
        hasAccess: false, 
        error: 'Error en el servidor'
      });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

async function validateWithAppScript(appScriptUrl, email) {
  try {
    const params = new URLSearchParams();
    params.append('email', email);

    // Timeout real de 12 segundos para evitar que un Apps Script lento bloquee todo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(appScriptUrl, {
      method: 'POST',
      body: params,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`[AppScript] HTTP ${response.status} para ${email}`);
      return null;
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.log(`[AppScript] Error parseando JSON para ${email}`);
      return null;
    }
    
    if (data === null) {
      return null;
    }
    
    if (typeof data === 'object') {
      return data;
    }
    
    return null;
  } catch (error) {
    console.log(`[AppScript] Error/timeout para ${email}:`, error.name === 'AbortError' ? 'TIMEOUT (12s)' : error.message);
    return null;
  }
}