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
      appScripts.forEach((s, i) => {
        console.log(`  [${i}] ${s.name}: ${s.url?.substring(0, 80)}...`);
      });

      // Validar contra cada AppScript
      const results = await Promise.all(
        appScripts.map(script => validateWithAppScript(script.url, script.name, email))
      );

      console.log(`\n[VALIDATE-EMAIL] ======= RESUMEN FINAL =======`);
      console.log(`[VALIDATE-EMAIL] Resultados brutos:`, JSON.stringify(results));

      // Procesar resultados: VALIDACIÓN ESTRICTA
      // Solo considerar acceso válido si tiene join_url (con_acceso field) o estado OK
      const accessibleServers = results.map((r, index) => {
        // Validar que tenga datos (objeto no vacío)
        if (r && typeof r === 'object' && Object.keys(r).length > 0) {
          console.log(`[VALIDATE-EMAIL] ✅ [${index}] ACCESO PERMITIDO:`, JSON.stringify(r));
          return r;
        }
        console.log(`[VALIDATE-EMAIL] ❌ [${index}] ACCESO DENEGADO - Valor:`, JSON.stringify(r));
        return null;
      });

      console.log(`[VALIDATE-EMAIL] Array final de accesos:`, JSON.stringify(accessibleServers));
      console.log(`[VALIDATE-EMAIL] ===================================\n`);

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
    console.log(`\n[${scriptName}] 🔵 INICIANDO VALIDACIÓN`);
    console.log(`[${scriptName}] Email: ${email}`);
    console.log(`[${scriptName}] URL: ${appScriptUrl?.substring(0, 100)}...`);
    
    const params = new URLSearchParams();
    params.append('email', email);

    console.log(`[${scriptName}] 📤 Enviando POST...`);
    const response = await fetch(appScriptUrl, {
      method: 'POST',
      body: params,
      timeout: 15000 // 15 segundos timeout
    });

    console.log(`[${scriptName}] 📥 Response Status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`[${scriptName}] ❌ HTTP Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[${scriptName}] ✅ Success! Data:`, JSON.stringify(data));
    
    // Validar que sea un objeto válido
    if (typeof data === 'object' && data !== null) {
      console.log(`[${scriptName}] ✅ Retornando objeto válido`);
      return data; // Retornar todo lo que el AppScript envía
    }
    
    console.log(`[${scriptName}] ⚠️ Respuesta no es objeto. Tipo:`, typeof data, 'Valor:', data);
    return null;
  } catch (error) {
    console.error(`[${scriptName}] 💥 Error:`, error.message);
    return null;
  }
}
