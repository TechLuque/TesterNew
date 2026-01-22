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
        process.env.APPSCRIPT_CODIGO,
        process.env.APPSCRIPT_MAQUINA,
        process.env.APPSCRIPT_MAESTRIA
      ];

      if (appScripts.some(url => !url)) {
        return res.status(500).json({ 
          hasAccess: false, 
          error: 'Error de configuración en el servidor'
        });
      }

      const results = await Promise.all(
        appScripts.map(url => validateWithAppScript(url, email))
      );

      const accessibleServers = results.map(r => 
        (r && r.ok) ? {
          ok: r.ok,
          join_url: r.join_url,
          whatsapp: r.whatsapp
        } : null
      );

      const hasAccess = accessibleServers.some(s => s !== null);
      const whatsapp = results.find(r => r && r.whatsapp)?.whatsapp || null;

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
      body: params
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}
