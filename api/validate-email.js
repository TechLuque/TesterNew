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
      
      console.log(`[VALIDATE-EMAIL] Email a validar: ${email}`);

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

      // Validar configuración
      for (const script of appScripts) {
        if (!script.url) {
          console.error(`[VALIDATE-EMAIL] ❌ Falta config: ${script.name}`);
          return res.status(500).json({ 
            hasAccess: false, 
            error: 'Error de configuración en el servidor'
          });
        }
      }

      console.log(`[VALIDATE-EMAIL] Validando contra ${appScripts.length} AppScripts...`);

      // Validar contra cada AppScript
      const results = await Promise.all(
        appScripts.map(script => validateWithAppScript(script.url, script.name, email))
      );

      console.log(`[VALIDATE-EMAIL] Resultados brutos:`, JSON.stringify(results));

      // Procesar resultados: más flexible
      const accessibleServers = results.map((r, index) => {
        if (r && typeof r === 'object' && Object.keys(r).length > 0) {
          console.log(`[VALIDATE-EMAIL] ✅ Server ${index} tiene acceso`, r);
          return r;
        }
        console.log(`[VALIDATE-EMAIL] ❌ Server ${index} sin acceso`);
        return null;
      });

      const hasAccess = accessibleServers.some(s => s !== null);
      const whatsapp = accessibleServers.find(s => s && (s.whatsapp || s.phone))?.whatsapp || 
                       accessibleServers.find(s => s && (s.whatsapp || s.phone))?.phone || null;

      console.log(`[VALIDATE-EMAIL] Resultado final: hasAccess=${hasAccess}`);
      console.log(`[VALIDATE-EMAIL] accessibleServers:`, JSON.stringify(accessibleServers));

      return res.status(200).json({
        hasAccess,
        accessibleServers,
        whatsapp,
        error: hasAccess ? null : 'Email no autorizado'
      });

    } catch (error) {
      console.error(`[VALIDATE-EMAIL] 💥 Error:`, error);
      return res.status(500).json({ 
        hasAccess: false, 
        error: 'Error en el servidor'
      });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

async function validateWithAppScript(appScriptUrl, scriptName, email) {
  try {
    console.log(`[${scriptName}] Validando email: ${email}`);
    
    const params = new URLSearchParams();
    params.append('email', email);

    const response = await fetch(appScriptUrl, {
      method: 'POST',
      body: params,
      timeout: 15000 // 15 segundos timeout
    });

    if (!response.ok) {
      console.error(`[${scriptName}] ❌ HTTP Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[${scriptName}] ✅ Response:`, JSON.stringify(data));
    
    // Validar que sea un objeto válido
    if (typeof data === 'object' && data !== null) {
      return data; // Retornar todo lo que el AppScript envía
    }
    
    console.log(`[${scriptName}] ⚠️ Respuesta no es objeto. Tipo:`, typeof data, 'Valor:', data);
    return null;
  } catch (error) {
    console.error(`[${scriptName}] 💥 Error:`, error.message);
    return null;
  }
}
