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

      // Procesar resultados: NUEVA LÓGICA MÁS ESTRICTA
      // Permitir acceso SOLO si:
      // 1. El AppScript devuelve un objeto CON propiedades
      // 2. Y contiene al menos UN campo positivo de acceso (join_url, url, link, etc)
      // 3. Y NO contiene indicadores de rechazo
      const accessibleServers = results.map((r, index) => {
        console.log(`\n[VALIDATE-EMAIL] 🔍 Analizando resultado [${index}]:`, JSON.stringify(r));
        
        // Si es null, definitivamente sin acceso
        if (r === null) {
          console.log(`[VALIDATE-EMAIL] ❌ [${index}] NULL - ACCESO DENEGADO`);
          return null;
        }
        
        // Si es un objeto
        if (typeof r === 'object') {
          const keys = Object.keys(r);
          const hasProperties = keys.length > 0;
          
          // Si está vacío, sin acceso
          if (!hasProperties) {
            console.log(`[VALIDATE-EMAIL] ❌ [${index}] OBJETO VACÍO - ACCESO DENEGADO`);
            return null;
          }
          
          // PRIMERO: Buscar indicadores de rechazo EXPLÍCITO
          const hasError = r.error || r.message || r.error_message || r.errorMessage || r.mensaje || r.status === 'error';
          const isNotFound = r.found === false || r.exists === false || r.usuario === false || r.registered === false;
          const isUnauthorized = r.authorized === false || r.access === false || r.permitido === false || r.con_acceso === false;
          
          if (hasError || isNotFound || isUnauthorized) {
            console.log(`[VALIDATE-EMAIL] ❌ [${index}] RECHAZO EXPLÍCITO DETECTADO:`, 
              hasError ? '(error)' : '', isNotFound ? '(no encontrado)' : '', isUnauthorized ? '(no autorizado)' : '',
              JSON.stringify(r));
            return null;
          }
          
          // SEGUNDO: Buscar indicadores POSITIVOS de acceso (campos que indican acceso válido)
          const hasAccessIndicators = 
            r.join_url ||                                    // Zoom link
            r.url ||                                         // URL genérica
            r.link ||                                        // Link genérico
            r.access_granted ||                              // Access granted flag
            r.permitido === true ||                          // Spanish: permitido
            r.con_acceso === true ||                         // Spanish: con_acceso
            r.authorized === true ||                         // Authorized flag
            r.access === true ||                             // Access flag
            r.ok === true ||                                 // OK flag
            r.success === true ||                            // Success flag
            r.status === 'ok' ||                             // Status OK
            r.status === 'success' ||                        // Status success
            r.status === 'granted' ||                        // Status granted
            (r.nombre && r.sala) ||                          // Has user data + sala
            (r.email && r.link);                             // Has email + link
          
          if (hasAccessIndicators) {
            console.log(`[VALIDATE-EMAIL] ✅ [${index}] ACCESO CONFIRMADO - Indicadores positivos encontrados`);
            console.log(`[VALIDATE-EMAIL] ✅ [${index}] Datos:`, JSON.stringify(r));
            return r;
          }
          
          // Si tiene propiedades pero NINGÚN indicador positivo ni negativo
          console.log(`[VALIDATE-EMAIL] ⚠️ [${index}] OBJETO SIN INDICADORES CLAROS - ACCESO DENEGADO (POR SEGURIDAD)`);
          console.log(`[VALIDATE-EMAIL] ⚠️ [${index}] Datos recibidos:`, JSON.stringify(r));
          console.log(`[VALIDATE-EMAIL] ⚠️ [${index}] Claves encontradas:`, keys);
          return null;
        }
        
        // Cualquier otro tipo, sin acceso
        console.log(`[VALIDATE-EMAIL] ❌ [${index}] TIPO INVÁLIDO (${typeof r}) - ACCESO DENEGADO`);
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
