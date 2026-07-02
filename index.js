'use strict';

/**
 * Curated, no-build JS entry for the `h5p-js-library` package (shipped from the
 * h5p-php-library repository) — the proto-`h5p-js-core`.
 *
 * This file is *additive*: it does not move or rewrite any existing source. It only
 * reads the raw global-IIFE files under `js/` and re-exports a small, deliberately
 * grown surface. Import paths for the wider H5P ecosystem are untouched.
 *
 * Consumption: `require('h5p-js-library')` (works with **no build step**).
 *
 * Per-export DOM/jQuery requirements (see also README-style notes below):
 *   - Event            — no DOM, no jQuery.
 *   - EventDispatcher  — no DOM, no jQuery. (`triggerXAPIScored`/`createXAPIEventTemplate`
 *                        DO need the full runtime — H5PIntegration/createUUID — so they are
 *                        NOT part of the low-DOM unit surface.)
 *   - XAPIEvent        — no DOM. `setVerb()` needs `H5P.jQuery` (real jQuery, wired below).
 *   - Version          — no DOM, no jQuery.
 *   - utils (H5PUtils) — needs `H5P.jQuery` AND a real DOM (creates table/pagination nodes).
 *
 * The low-DOM-first exports (Event/EventDispatcher/XAPIEvent/Version) load with zero
 * runtime deps: a plain `window` shim is enough. `utils` is only wired when jQuery is
 * available. A real DOM (jsdom) is auto-used when present/installed but never required
 * for the low-DOM surface.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// --- 1. Ensure a `window` exists (global-IIFE files do `window.H5P = ...`). ----------
// Prefer a real DOM (jsdom) when available so `utils` works; otherwise a minimal shim
// is sufficient for the low-DOM-first surface.
if (typeof global.window === 'undefined') {
  try {
    // eslint-disable-next-line global-require
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.navigator = dom.window.navigator;
    global.localStorage = dom.window.localStorage;
  }
  catch (e) {
    // No jsdom — fine for the low-DOM surface (Event/EventDispatcher/XAPIEvent/Version).
    global.window = {};
  }
}

// --- 2. Establish / reuse the H5P namespace (do not clobber a caller's namespace). ---
const H5P = global.window.H5P = global.window.H5P || global.H5P || {};
global.H5P = H5P;

// --- 3. Wire real jQuery where present (public MIT package, runs on jsdom). ----------
if (!H5P.jQuery) {
  try {
    // eslint-disable-next-line global-require
    H5P.jQuery = require('jquery');
  }
  catch (e) {
    // utils + XAPIEvent.setVerb will be unavailable without jQuery; low-DOM surface is fine.
  }
}

/**
 * Evaluate a raw legacy `js/*.js` file against the current globals. The file mutates
 * the global namespace (assigns onto `window.H5P` / `H5P`), mirroring how H5P concats
 * and serves them. We read the classes off `global.H5P` afterwards.
 */
function load(relPath) {
  const abs = path.join(__dirname, relPath);
  vm.runInThisContext(fs.readFileSync(abs, 'utf8'), { filename: abs });
}

// --- 4. Load the curated files in dependency order. ---------------------------------
load('js/h5p-event-dispatcher.js'); // H5P.Event, H5P.EventDispatcher
load('js/h5p-x-api-event.js');      // H5P.XAPIEvent (extends Event)
load('js/h5p-x-api.js');            // externalDispatcher + xAPI prototype helpers
load('js/h5p-version.js');          // H5P.Version
if (H5P.jQuery) {
  load('js/h5p-utils.js');          // H5PUtils (needs jQuery + DOM at call time)
}

// --- 5. Re-export the small, explicit surface. --------------------------------------
module.exports = {
  Event: H5P.Event,
  EventDispatcher: H5P.EventDispatcher,
  XAPIEvent: H5P.XAPIEvent,
  Version: H5P.Version,
  utils: global.H5PUtils, // undefined when jQuery is absent
  /** The mutated namespace, for advanced/interop callers. */
  H5P
};


