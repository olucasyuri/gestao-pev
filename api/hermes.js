// ════════════════════════════════════════════════════════
//  PEV Gestão — API Route: /api/hermes
//  Arquivo: api/hermes.js
// ════════════════════════════════════════════════════════

const HERMES_URL = process.env.HERMES_URL;
const API_SECRET = process.env.API_SECRET;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!HERMES_URL) {
    return res.status(500).json({ error: 'HERMES_URL não configurada no Vercel' });
  }

  const { tipo, escalaState, almocoState } = req.body || {};

  try {
    let endpoint, payload;

    if (tipo === 'escala') {
      endpoint = `${HERMES_URL}/send/escala`;
      payload  = { escalaState };
    } else if (tipo === 'almoco') {
      endpoint = `${HERMES_URL}/send/almoco`;
      payload  = { almocoState };
    } else if (tipo === 'cron-escala') {
      endpoint = `${HERMES_URL}/send/escala`;
      payload  = { escalaState: null };
    } else if (tipo === 'cron-almoco') {
      endpoint = `${HERMES_URL}/send/almoco`;
      payload  = { almocoState: null };
    } else {
      return res.status(400).json({ error: `tipo inválido: ${tipo}` });
    }

    const response = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': API_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({ error: 'Hermes retornou erro', details: data });
    }

    return res.status(200).json({ ok: true, ...data });

  } catch (err) {
    return res.status(500).json({ error: 'Não foi possível contatar o Hermes', details: err.message });
  }
};
