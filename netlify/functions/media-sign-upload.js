const crypto = require('crypto');

function json(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': origin || 'https://nariyal-sutra.netlify.app',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type'
    },
    body: JSON.stringify(body)
  };
}

function allowedOrigin(origin) {
  if (!origin) return 'https://nariyal-sutra.netlify.app';
  try {
    const u = new URL(origin);
    if (u.hostname === 'nariyal-sutra.netlify.app' || /--nariyal-sutra\.netlify\.app$/i.test(u.hostname)) return origin;
  } catch (_) {}
  return null;
}

exports.handler = async (event) => {
  const origin = allowedOrigin(event.headers?.origin || event.headers?.Origin);
  if (event.httpMethod === 'OPTIONS') return origin ? json(204, {}, origin) : json(403, { error: 'Origin not allowed' });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' }, origin || undefined);
  if (!origin) return json(403, { error: 'Origin not allowed' });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return json(503, { error: 'Media upload is not configured on this environment.' }, origin);
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) { return json(400, { error: 'Invalid JSON body' }, origin); }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = String(body.folder || 'nariyal-sutra/media').replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 120) || 'nariyal-sutra/media';
  const params = { folder, timestamp };
  if (body.public_id) params.public_id = String(body.public_id).replace(/[^a-zA-Z0-9/_-]/g, '').slice(0, 120);
  if (body.tags) params.tags = String(body.tags).slice(0, 240);
  if (body.context) params.context = String(body.context).slice(0, 500);

  const toSign = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  const signature = crypto.createHash('sha1').update(toSign + apiSecret).digest('hex');
  return json(200, { cloudName, apiKey, signature, ...params }, origin);
};
