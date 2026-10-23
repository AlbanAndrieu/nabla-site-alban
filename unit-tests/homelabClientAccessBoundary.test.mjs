import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCatalogFailure, catalogScopeMatches } from '../lib/homelabClientAccessBoundary.ts';

test('unavailable gateway or network errors allow bounded public last-known-good', () => {
  for (const status of [0, 408, 429, 500, 502, 503, 504]) {
    assert.deepEqual(classifyCatalogFailure(status, null), { reason:'unavailable', revokePublicCache:false });
  }
});
test('server authorization denial must never reuse cached catalog', () => {
  for (const status of [401,403,404]) {
    assert.equal(classifyCatalogFailure(status, null).revokePublicCache, true);
  }
});
test('sanitized backend key denial also revokes cached catalog on HTTP 503', () => {
  for (const reason of ['access-denied','key-missing']) {
    assert.deepEqual(classifyCatalogFailure(503, { reason }), { reason, revokePublicCache:true });
  }
});
test('malformed errors cannot inject arbitrary reasons', () => {
  for (const body of [[], 'untrusted', {reason:'OWNER_SECRETS'}, {reason: {key:'secret'}}]) {
    assert.equal(classifyCatalogFailure(503, body).reason, 'unavailable');
  }
});
test('owner and public catalogs cannot cross render after a mode switch', () => {
  assert.equal(catalogScopeMatches('owner', true), false);
  assert.equal(catalogScopeMatches('public', false), false);
  assert.equal(catalogScopeMatches('owner', false), true);
  assert.equal(catalogScopeMatches('public', true), true);
  assert.equal(catalogScopeMatches(null, true), false);
  assert.equal(catalogScopeMatches(null, false), false);
});
