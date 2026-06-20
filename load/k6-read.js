// k6 load test for CivicSnap's hottest path: the public reports read.
// Run:  k6 run -e BASE=https://<ref>.supabase.co -e ANON=<anon> load/k6-read.js
//
// Thresholds encode the SLO: p95 < 500ms and < 1% errors under ramped load.
import http from 'k6/http'
import { check, sleep } from 'k6'

const BASE = __ENV.BASE
const ANON = __ENV.ANON

export const options = {
  stages: [
    { duration: '30s', target: 25 }, // ramp up
    { duration: '1m', target: 50 }, // sustained
    { duration: '30s', target: 0 }, // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
}

export default function () {
  const res = http.get(`${BASE}/rest/v1/reports?select=id,title,category,status&limit=50`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  })
  check(res, {
    'status 200': (r) => r.status === 200,
    'returns array': (r) => Array.isArray(r.json()),
  })
  sleep(1)
}
