import fs from 'node:fs';
import assert from 'node:assert/strict';

const v44=fs.readFileSync('assets/js/admin-v44-order-operations.js','utf8');
const v45=fs.readFileSync('assets/js/admin-v45-operability.js','utf8');

const required=[
  ['admin-v45-operability.js',v44,'V45 loader'],
  ['data-v45-product',v45,'product lifecycle'],
  ['Dynamic production SKUs are not enabled',v45,'production catalog truth'],
  ['data-v45-stock',v45,'inventory lifecycle'],
  ['View details',v45,'SEO drill-down'],
  ['/sitemap.xml',v45,'SEO sitemap evidence'],
  ['Metric source',v45,'analytics source label'],
  ['Orders today',v45,'overview navigation'],
  ['Configured Owner match',v45,'identity diagnostic'],
  ['nsv421:remote-error',v45,'remote error diagnostic'],
  ['deliveryLat',v45,'delivery coordinates'],
  ['geocoded from saved address',v45,'delivery geocode fallback'],
  ['publicTracking',v45,'tracking projection'],
  ['customerOrders',v45,'customer projection'],
  ['not continuous GPS tracking',v45,'location truth label'],
  ['Delete draft/custom',v45,'custom section lifecycle']
];
for(const [needle,hay,label] of required) assert.ok(hay.includes(needle),`Missing ${label}`);
assert.ok(!/Theme section|Theme manager|Theme builder/i.test(v45),'Themes must stay outside this stabilization pass');
console.log('Admin operability gap QA passed');
