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

      const results = await Promise.all(
        appScripts.map(script => validateWithAppScript(script.url, email))
      );

      const accessibleServers = results.map((r) => {
        if (r === null) {
          return null;
        }
        
        if (typeof r === 'object') {
          const keys = Object.keys(r);
          const hasProperties = keys.length > 0;
          
          if (!hasProperties) {
            return null;
          }
          
          const hasError = r.error || r.message || r.error_message || r.errorMessage || r.mensaje;
          const statusIsError = r.status === 'error' || r.status === 'fail' || r.status === 'failed';
          const isNotFound = r.found === false || r.exists === false || r.usuario === false || r.registered === false || r.encontrado === false;
          const isUnauthorized = r.authorized === false || r.access === false || r.permitido === false || r.con_acceso === false;
          
          const hasRejectIndicator = hasError || statusIsError || isNotFound || isUnauthorized;
          
          if (hasRejectIndicator) {
            return null;
          }
          
          return r;
        }
        
        return null;
      });

      const hasAccess = accessibleServers.some(s => s !== null);
      const whatsapp = accessibleServers.find(s => s && (s.whatsapp || s.phone))?.whatsapp || 
                       accessibleServers.find(s => s && (s.whatsapp || s.phone))?.phone || null;

      return res.status(200).json({
        hasAccess,
        accessibleServers,
        whatsapp,
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

    const response = await fetch(appScriptUrl, {
      method: 'POST',
      body: params,
      timeout: 15000
    });
    
    if (!response.ok) {
      return null;
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
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
    return null;
  }
}