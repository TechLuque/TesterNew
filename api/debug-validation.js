/**
 * DEBUG ENDPOINT - Para diagnosticar exactamente qué devuelve cada AppScript
 * GET /api/debug-validation?email=usuario@example.com
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ 
          error: 'Email es requerido',
          example: '/api/debug-validation?email=test@example.com'
        });
      }

      const appScripts = [
        { name: 'CODIGO', url: process.env.APPSCRIPT_CODIGO, index: 0 },
        { name: 'MAQUINA', url: process.env.APPSCRIPT_MAQUINA, index: 1 },
        { name: 'MAESTRIA', url: process.env.APPSCRIPT_MAESTRIA, index: 2 }
      ];

      // Validar configuración
      const missingScripts = appScripts.filter(s => !s.url);
      if (missingScripts.length > 0) {
        return res.status(500).json({ 
          error: 'Falta configuración de AppScripts',
          missing: missingScripts.map(s => s.name)
        });
      }

      const debugResults = [];

      // Validar contra cada AppScript y mostrar respuesta RAW
      for (const script of appScripts) {
        try {
          console.log(`\n[DEBUG-${script.name}] Validando ${email} contra ${script.name}...`);
          
          const params = new URLSearchParams();
          params.append('email', email);

          const response = await fetch(script.url, {
            method: 'POST',
            body: params,
            timeout: 15000
          });

          console.log(`[DEBUG-${script.name}] HTTP Status: ${response.status}`);
          
          if (!response.ok) {
            debugResults.push({
              server: script.name,
              index: script.index,
              status: 'ERROR',
              httpCode: response.status,
              message: `HTTP ${response.status}: ${response.statusText}`,
              rawResponse: null,
              analysis: 'Error de conexión'
            });
            continue;
          }
          
          const data = await response.json();
          console.log(`[DEBUG-${script.name}] Response:`, JSON.stringify(data));
          
          // Análisis detallado
          let analysis = '';
          let hasAccessIndicators = false;
          let hasRejectIndicators = false;
          
          if (data === null) {
            analysis = 'NULL - ACCESO DENEGADO';
            hasRejectIndicators = true;
          } else if (typeof data === 'object') {
            const keys = Object.keys(data);
            
            if (keys.length === 0) {
              analysis = 'OBJETO VACÍO - ACCESO DENEGADO';
              hasRejectIndicators = true;
            } else {
              // Buscar indicadores
              const checkList = {
                'join_url': data.join_url ? 'SÍ' : 'NO',
                'url': data.url ? 'SÍ' : 'NO',
                'link': data.link ? 'SÍ' : 'NO',
                'error': data.error ? 'SÍ (' + data.error + ')' : 'NO',
                'message': data.message ? 'SÍ (' + data.message + ')' : 'NO',
                'access': data.access ? 'SÍ' : (data.access === false ? 'NO (false)' : 'NO'),
                'authorized': data.authorized ? 'SÍ' : (data.authorized === false ? 'NO (false)' : 'NO'),
                'permitido': data.permitido ? 'SÍ' : (data.permitido === false ? 'NO (false)' : 'NO'),
                'con_acceso': data.con_acceso ? 'SÍ' : (data.con_acceso === false ? 'NO (false)' : 'NO'),
                'ok': data.ok ? 'SÍ' : (data.ok === false ? 'NO (false)' : 'NO'),
                'success': data.success ? 'SÍ' : (data.success === false ? 'NO (false)' : 'NO'),
                'status': data.status ? '= ' + data.status : 'NO',
                'nombre': data.nombre ? 'SÍ' : 'NO',
                'sala': data.sala ? 'SÍ' : 'NO'
              };
              
              hasAccessIndicators = data.join_url || data.url || data.link || 
                                  data.access === true || data.authorized === true ||
                                  data.permitido === true || data.con_acceso === true ||
                                  data.ok === true || data.success === true ||
                                  data.status === 'ok' || data.status === 'success' ||
                                  (data.nombre && data.sala);
              
              hasRejectIndicators = data.error || data.message || 
                                   data.found === false || data.exists === false ||
                                   data.usuario === false || data.registered === false ||
                                   data.authorized === false || data.access === false ||
                                   data.permitido === false || data.con_acceso === false;
              
              analysis = `OBJETO CON ${keys.length} PROPIEDADES\n` +
                        `Indicadores positivos: ${hasAccessIndicators ? 'SÍ ✅' : 'NO ❌'}\n` +
                        `Indicadores negativos: ${hasRejectIndicators ? 'SÍ ❌' : 'NO ✅'}\n` +
                        `Resultado Final: ${hasAccessIndicators && !hasRejectIndicators ? 'ACCESO PERMITIDO ✅' : 'ACCESO DENEGADO ❌'}`;
            }
          }
          
          debugResults.push({
            server: script.name,
            index: script.index,
            status: 'OK',
            httpCode: 200,
            rawResponse: data,
            analysis: analysis,
            hasAccessIndicators: hasAccessIndicators,
            hasRejectIndicators: hasRejectIndicators
          });
          
        } catch (error) {
          console.error(`[DEBUG-${script.name}] Error:`, error.message);
          debugResults.push({
            server: script.name,
            index: script.index,
            status: 'EXCEPTION',
            error: error.message,
            analysis: 'Excepción durante validación'
          });
        }
      }

      return res.status(200).json({
        email: email,
        timestamp: new Date().toISOString(),
        results: debugResults,
        summary: generateSummary(debugResults)
      });

    } catch (error) {
      console.error(`[DEBUG] Error:`, error);
      return res.status(500).json({ 
        error: 'Error en el servidor',
        message: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Método no permitido. Use GET.' });
}

function generateSummary(results) {
  const summary = {};
  results.forEach(r => {
    if (r.status === 'OK' && r.hasAccessIndicators && !r.hasRejectIndicators) {
      summary[r.server] = `✅ ACCESO PERMITIDO`;
    } else if (r.status === 'OK' && !r.hasAccessIndicators) {
      summary[r.server] = `❌ ACCESO DENEGADO (Sin indicadores positivos)`;
    } else if (r.status === 'OK' && r.hasRejectIndicators) {
      summary[r.server] = `❌ ACCESO DENEGADO (Con indicadores negativos)`;
    } else {
      summary[r.server] = `❌ ERROR: ${r.error || r.analysis}`;
    }
  });
  return summary;
}
