const {productionRequest}=require('../lib/release-boundary');
/* Anonymous read of an ALREADY PUBLIC document. No Admin SDK, secrets, private reads or writes.
   Only one allowlisted effective theme id crosses the public response boundary. */
const IDS = ['nariyal-signature', 'fresh-grove', 'coastal-premium', 'golden-harvest'];
const FALLBACK = IDS[0];
const valid = id => IDS.includes(id) ? id : FALLBACK;
function active(s, now, timezone) {
  if (!s || s.enabled === false || !IDS.includes(s.themeId)) return false;
  const start = Date.parse(s.startAt || ''), end = Date.parse(s.endAt || ''), ms = now.getTime();
  if ((Number.isFinite(start) && ms < start) || (Number.isFinite(end) && ms >= end)) return false;
  if (s.type !== 'weekly') return true;
  let parts;
  try { parts = new Intl.DateTimeFormat('en-CA', {timeZone: s.timezone || timezone || 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(now); }
  catch (_) { parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'UTC', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(now); }
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  if (!(s.daysOfWeek || []).includes(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday))) return false;
  const time = p.hour + ':' + p.minute, from = String(s.dailyStart || '00:00'), to = String(s.dailyEnd || '23:59');
  return from <= to ? time >= from && time < to : time >= from || time < to;
}
function effective(config = {}, now = new Date()) {
  if (config.manualOverride?.active !== false && IDS.includes(config.manualOverride?.themeId)) return config.manualOverride.themeId;
  const matches = (Array.isArray(config.schedules) ? config.schedules : []).filter(s => active(s, now, config.businessTimezone))
    .sort((a,b) => (Number(b.priority)||0) - (Number(a.priority)||0) || String(a.id).localeCompare(String(b.id)));
  return matches[0]?.themeId || valid(config.publishedTheme);
}
function decode(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v || 'doubleValue' in v) return Number(v.integerValue ?? v.doubleValue);
  if ('timestampValue' in v) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(decode);
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k,x]) => [k,decode(x)]));
  return null;
}
exports.handler = async event => {
  const headers = {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff'};
  if (event.httpMethod !== 'GET') return {statusCode:405, headers:{...headers, allow:'GET'}, body:'{}'};
  if(!productionRequest(event))return {statusCode:403,headers,body:JSON.stringify({error:'Production services are disabled on this hostname.'})};
  let themeId = FALLBACK;
  try {
    const project = encodeURIComponent(process.env.FIREBASE_PROJECT_ID || 'nariyal-sutra');
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/publicStories/site-config?mask.fieldPaths=status&mask.fieldPaths=themeConfig`, {signal:AbortSignal.timeout(2000)});
    if (response.ok) {
      const doc = await response.json();
      if (decode(doc.fields?.status) === 'live') themeId = effective(decode(doc.fields?.themeConfig) || {});
    }
  } catch (_) { /* Decorative lookup failure never blocks authentication. */ }
  return {statusCode:200, headers, body:JSON.stringify({themeId})};
};
exports.effective = effective;
