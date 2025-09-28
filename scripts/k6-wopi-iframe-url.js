import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
const myCounter = new Counter('requests');

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.01'], 
    http_req_duration: ['p(95)<2000'], // thoda relax for large files
  },
  stages: [
    { duration: '5s', target: 100 },   // ramp up
    { duration: '10s', target: 500 },  // sustain 500 VUs
    { duration: '5s', target: 0 },     // ramp down
  ],
};

// Different files (small + medium + large)
const FILES = [
  "1st.docx",
  "report-20mb.docx",   // large
  "spreadsheet.xlsx",
  "presentation.pptx",
  "bigdata-100mb.docx"  // very large
];
const BASE_URL = 'http://localhost:3000/api';
const MODE = 'edit';

export default function () {
  const userId = `user${__VU}`;
  const userName = `User ${__VU}`;

  // Pick random file
  const filename = FILES[Math.floor(Math.random() * FILES.length)];

  const url = `${BASE_URL}/wopi/iframe-url?filename=${encodeURIComponent(filename)}&mode=${MODE}&userId=${userId}&userName=${encodeURIComponent(userName)}`;
  const res = http.get(url);

  myCounter.add(1);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has url': (r) => r.json('url') !== undefined,
    'has accessToken': (r) => r.json('accessToken') !== undefined,
    'has wopiSrc': (r) => r.json('wopiSrc') !== undefined,
  });

  sleep(0.5);
}
