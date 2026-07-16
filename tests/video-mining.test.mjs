import assert from 'node:assert/strict';
import { parseYouTubeId } from '../functions/api/_youtube.js';
import { normalizePhrase, shouldAutoPublish } from '../functions/api/_video_mining.js';

assert.equal(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
assert.equal(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=10'), 'dQw4w9WgXcQ');
assert.equal(parseYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
assert.equal(parseYouTubeId('not a video link'), null);
assert.equal(normalizePhrase('  Toe-Nail It In! '), 'toe-nail it in');
assert.equal(normalizePhrase('Move it a fuzz.'), 'move it a fuzz');

const settings = { minimum_independent_sources: 3, minimum_confidence: 0.9 };
assert.equal(shouldAutoPublish({ independent_source_count: 3, confidence: 0.9 }, settings), true);
assert.equal(shouldAutoPublish({ independent_source_count: 2, confidence: 0.99 }, settings), false);
assert.equal(shouldAutoPublish({ independent_source_count: 4, confidence: 0.89 }, settings), false);

console.log('Video mining rules passed: YouTube parsing, phrase normalization, and 3-source/90% guardrail.');
