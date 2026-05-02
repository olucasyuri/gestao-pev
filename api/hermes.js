// ════════════════════════════════════════════════════════
//  PEV Gestão — API Route: /api/hermes
//  Recebe o estado do site e repassa ao Hermes
//  Arquivo: api/hermes.js  (na raiz do projeto Vercel)
//
//  Também serve como endpoint do Vercel Cron para
//  disparos automáticos por horário.
// ════════════════════════════════════════════════════════

const HERMES_URL   = process.env.HERMES_URL;    // ex: https://hermes.railway.app
const API_SECRET   = process.env.API_SECRET;    // mesma chave do .env do Hermes

/**
 * Proxy seguro: site → Vercel API → Hermes
 *
 * Body esperado:
 *   { tipo: 'escala', escalaState: {...} }
 *   { tipo: 'almoco', almocoState: {...} }
 *   { tipo: 'cron-escala' }   ← chamado pelo Vercel Cron
 *   { tipo: 'cron-almoco' }   ← chamado pelo Vercel Cron
 */
export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!HERMES_URL) {
    return res.status(500).json({ error: 'HERMES_URL não configurada nas variáveis do Vercel' });
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
      // Cron: envia escala com todos internos (ajuste conforme sua necessidade)
      endpoint = `${HERMES_URL}/send/escala`;
      payload  = { escalaState: null }; // Hermes usa estado salvo ou padrão

    } else if (tipo === 'cron-almoco') {
      // Cron: envia almoço com horários padrão de colaboradores.js
      endpoint = `${HERMES_URL}/send/almoco`;
      payload  = { almocoState: null };

    } else {
      return res.status(400).json({ error: `tipo inválido: ${tipo}` });
    }

    const response = await fetch(endpoint, {
      method:  'POST',
      headers: {
        'Content-Type':   'application/json',
        'x-api-secret':   API_SECRET || '',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('[PEV API] Hermes retornou erro:', response.status, data);
      return res.status(502).json({ error: 'Hermes retornou erro', details: data });
    }

    return res.status(200).json({ ok: true, ...data });

  } catch (err) {
    console.error('[PEV API] Erro ao contatar Hermes:', err.message);
    return res.status(500).json({ error: 'Não foi possível contatar o Hermes', details: err.message });
  }
}
