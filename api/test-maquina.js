export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Usa: /api/test-maquina?email=tu@email.com' });
  }

  const appScriptUrl = process.env.APPSCRIPT_MAQUINA;
  if (!appScriptUrl) {
    return res.status(500).json({ error: 'APPSCRIPT_MAQUINA no configurada' });
  }

  try {
    const params = new URLSearchParams();
    params.append('email', email);

    const response = await fetch(appScriptUrl, {
      method: 'POST',
      body: params,
      timeout: 15000
    });

    const data = await response.json();

    return res.status(200).json({
      email,
      httpStatus: response.status,
      appScriptResponse: data,
      analisis: {
        tieneError: !!data?.error,
        tieneOk: data?.ok,
        tieneJoinUrl: !!data?.join_url,
        campos: data ? Object.keys(data) : [],
        miCodigoPermitiriaAcceso: !(data?.error || data?.message || data?.ok === false || data?.found === false || data?.access === false)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
