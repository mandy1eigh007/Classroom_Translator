import assert from 'node:assert/strict';
import { parseCaptionXml, parseYouTubeId } from '../functions/api/_youtube.js';
import { candidateRecord, normalizePhrase, shouldAutoPublish } from '../functions/api/_video_mining.js';

assert.equal(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
assert.equal(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ?t=10'), 'dQw4w9WgXcQ');
assert.equal(parseYouTubeId('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
assert.equal(parseYouTubeId('not a video link'), null);
assert.deepEqual(parseCaptionXml('<transcript><text start="1.5" dur="2.25">toe &amp; nail</text></transcript>'), [
  { start: 1.5, dur: 2.25, text: 'toe & nail' },
]);
assert.deepEqual(parseCaptionXml('<timedtext format="3"><body><p t="80" d="2850"><s>move it </s><s>a fuzz</s></p></body></timedtext>'), [
  { start: 0.08, dur: 2.85, text: 'move it a fuzz' },
]);
assert.equal(normalizePhrase('  Toe-Nail It In! '), 'toe-nail it in');
assert.equal(normalizePhrase('Move it a fuzz.'), 'move it a fuzz');
assert.deepEqual(candidateRecord({ phrase: 'toe nail it', context_quote: 'toe nail it here' }), {
  phrase: 'toe nail it',
});

const settings = { minimum_independent_sources: 3, minimum_confidence: 0.9 };
assert.equal(shouldAutoPublish({ independent_source_count: 3, confidence: 0.9 }, settings), true);
assert.equal(shouldAutoPublish({ independent_source_count: 1, confidence: 0.99 }, settings), true);
assert.equal(shouldAutoPublish({ independent_source_count: 4, confidence: 0.89 }, settings), false);
assert.equal(shouldAutoPublish({ independent_source_count: 0, confidence: 0.99 }, settings), false);

console.log('Video mining rules passed: YouTube parsing, phrase normalization, and classroom publish/review guardrails.');
