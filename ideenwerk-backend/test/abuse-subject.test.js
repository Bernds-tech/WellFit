import test from 'node:test';
import assert from 'node:assert/strict';
import { createAbuseSubjectHash, distributedRatePolicy } from '../src/lib/abuse-subject.js';

const secret='0123456789abcdef0123456789abcdef';

test('abuse subject hash is stable and does not expose raw client data',()=>{
  const input={ip:'203.0.113.42',userAgent:'WERK-Test-Agent/1.0'};
  const a=createAbuseSubjectHash(input,secret);
  const b=createAbuseSubjectHash(input,secret);
  assert.equal(a,b);
  assert.match(a,/^[a-f0-9]{64}$/);
  assert.equal(a.includes('203.0.113.42'),false);
  assert.equal(a.includes('WERK-Test-Agent'),false);
});

test('secret rotation changes pseudonymous abuse subject',()=>{
  const input={ip:'203.0.113.42',userAgent:'WERK-Test-Agent/1.0'};
  const a=createAbuseSubjectHash(input,secret);
  const b=createAbuseSubjectHash(input,'fedcba9876543210fedcba9876543210');
  assert.notEqual(a,b);
});

test('short abuse secret is rejected',()=>{
  assert.throws(()=>createAbuseSubjectHash({ip:'127.0.0.1'},'too-short'),/at least 32/);
});

test('distributed rate policy only covers intended IDEENWERK routes',()=>{
  assert.deepEqual(distributedRatePolicy('POST','/api/ideenwerk/v1/submissions'),{key:'submission',limit:20,windowSeconds:60});
  assert.equal(distributedRatePolicy('GET','/health'),null);
  assert.equal(distributedRatePolicy('POST','/api/ideenwerk/v1/unknown'),null);
});
