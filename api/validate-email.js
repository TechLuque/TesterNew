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

      // Procesar resultados: VALIDACIÓN SIMPLIFICADA Y ROBUSTA
      // PERMITIR acceso si:
      // 1. El AppScript devuelve un objeto CON propiedades
      // 2. Y NO tiene indicadores de rechazo EXPLÍCITO (error, unauthorized, not found)
      // DENEGAR si: null, objeto vacío, o tiene indicador de rechazo
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
          
          // Buscar indicadores EXPLÍCITOS de rechazo
          const hasError = r.error || r.message || r.error_message || r.errorMessage || r.mensaje;
          const statusIsError = r.status === 'error' || r.status === 'fail' || r.status === 'failed';
          const isNotFound = r.found === false || r.exists === false || r.usuario === false || r.registered === false || r.encontrado === false;
          const isUnauthorized = r.authorized === false || r.access === false || r.permitido === false || r.con_acceso === false;
          
          const hasRejectIndicator = hasError || statusIsError || isNotFound || isUnauthorized;
          
          if (hasRejectIndicator) {
            console.log(`[VALIDATE-EMAIL] ❌ [${index}] RECHAZO EXPLÍCITO DETECTADO:`, 
              hasError ? 'error' : '', 
              statusIsError ? 'status=error' : '', 
              isNotFound ? 'not_found' : '', 
              isUnauthorized ? 'unauthorized' : '',
              JSON.stringify(r));
            return null;
          }
          
          // CLAVE: Si tiene propiedades Y no hay rechazo explícito → PERMITIR ACCESO
          console.log(`[VALIDATE-EMAIL] ✅ [${index}] ACCESO PERMITIDO - Objeto válido sin indicadores de rechazo`);
          console.log(`[VALIDATE-EMAIL] ✅ [${index}] Propiedades encontradas:`, keys);
          console.log(`[VALIDATE-EMAIL] ✅ [${index}] Datos:`, JSON.stringify(r));
          return r;
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
    console.log(`[${scriptName}] URL: ${appScriptUrl?.substring(0, 50)}...`);
    
    const params = new URLSearchParams();
    params.append('email', email);

    console.log(`[${scriptName}] 📤 Enviando POST a AppScript...`);
    const response = await fetch(appScriptUrl, {
      method: 'POST',
      body: params,
      timeout: 15000
    });

    console.log(`[${scriptName}] 📥 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[${scriptName}] ❌ HTTP Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[${scriptName}] ❌ No se pudo parsear JSON. Error:`, parseError.message);
      const text = await response.text();
      console.log(`[${scriptName}] Respuesta en texto:`, text?.substring(0, 200));
      return null;
    }

    console.log(`[${scriptName}] 📦 Respuesta parseada:`, JSON.stringify(data));
    console.log(`[${scriptName}] 📊 Tipo:`, typeof data);
    
    if (data === null) {
      console.warn(`[${scriptName}] ⚠️ Respuesta es null`);
      return null;
    }
    
    if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log(`[${scriptName}] ✅ Es un objeto con ${keys.length} propiedades: [${keys.join(', ')}]`);
      console.log(`[${scriptName}] ✅ Retornando datos:`, JSON.stringify(data));
      return data;
    }
    
    console.log(`[${scriptName}] ⚠️ Respuesta no es objeto. Tipo: ${typeof data}, Valor:`, data);
    return null;
  } catch (error) {
    console.error(`[${scriptName}] 💥 Excepción:`, error.message);
    console.error(`[${scriptName}] 💥 Stack:`, error.stack);
    return null;
  }
}
