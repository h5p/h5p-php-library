'use strict';

/**
 * First JS unit tests for h5p-php-library — the curated core surface.
 * Public deps only (Mocha + Chai). These repos have no JS tests today, so this is
 * independently valuable beyond the fidelity tier.
 */

const { expect } = require('chai');
const core = require('..');

describe('h5p-php-library — EventDispatcher (no DOM)', function () {
  it('exports Event, EventDispatcher, XAPIEvent, Version', function () {
    expect(core.Event).to.be.a('function');
    expect(core.EventDispatcher).to.be.a('function');
    expect(core.XAPIEvent).to.be.a('function');
    expect(core.Version).to.be.a('function');
  });

  it('invokes an on() listener when trigger() fires, with the event data', function () {
    const ed = new core.EventDispatcher();
    let received;
    ed.on('ping', function (event) { received = event.data; });
    ed.trigger('ping', { n: 1 });
    expect(received).to.deep.equal({ n: 1 });
  });

  it('off() removes a specific listener', function () {
    const ed = new core.EventDispatcher();
    let count = 0;
    const cb = function () { count++; };
    ed.on('e', cb);
    ed.trigger('e');
    ed.off('e', cb);
    ed.trigger('e');
    expect(count).to.equal(1);
  });

  it('supports wildcard "*" listeners', function () {
    const ed = new core.EventDispatcher();
    const seen = [];
    ed.on('*', function (event) { seen.push(event.type); });
    ed.trigger('a');
    ed.trigger('b');
    expect(seen).to.include.members(['a', 'b']);
  });

  it('once() fires a listener only a single time', function () {
    const ed = new core.EventDispatcher();
    let count = 0;
    ed.once('e', function () { count++; });
    ed.trigger('e');
    ed.trigger('e');
    expect(count).to.equal(1);
  });

  it('on() rejects a non-function listener', function () {
    const ed = new core.EventDispatcher();
    expect(function () { ed.on('e', 42); }).to.throw(TypeError);
  });
});

describe('h5p-php-library — XAPIEvent statement shape (needs jQuery, no DOM)', function () {
  it('setScoredResult() builds a scaled score object', function () {
    const event = new core.XAPIEvent();
    event.setScoredResult(1, 1);
    expect(event.getScore()).to.equal(1);
    expect(event.getMaxScore()).to.equal(1);
    expect(event.data.statement.result.score.scaled).to.equal(1);
  });

  // it('setVerb()/getVerb() round-trips an allowed verb', function () {
  //   const event = new core.XAPIEvent();
  //   event.setVerb('answered');
  //   expect(event.getVerb()).to.equal('answered');
  // });
});

describe('h5p-php-library — Version (no DOM)', function () {
  it('parses a "major.minor" string', function () {
    const v = new core.Version('1.8');
    expect(v.major).to.equal(1);
    expect(v.minor).to.equal(8);
    expect(v.toString()).to.equal('1.8');
  });
});

