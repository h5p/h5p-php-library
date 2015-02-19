var H5P = H5P || {};

// Create object where external code may register and listen for H5P Events
H5P.externalDispatcher = new H5P.EventDispatcher();

if (window.top !== window.self && window.top.H5P !== undefined && window.top.H5P.externalDispatcher !== undefined) {
  H5P.externalDispatcher.on('xAPI', window.top.H5P.externalDispatcher.trigger);
}

// EventDispatcher extensions

/**
 * Helper function for triggering xAPI added to the EventDispatcher
 * 
 * @param {string} verb - the short id of the verb we want to trigger
 * @param {oject} extra - extra properties for the xAPI statement
 */
H5P.EventDispatcher.prototype.triggerXAPI = function(verb, extra) {
  this.trigger(this.createXAPIEventTemplate(verb, extra));
};

/**
 * Helper function to create event templates added to the EventDispatcher
 * 
 * Will in the future be used to add representations of the questions to the
 * statements.
 * 
 * @param {string} verb - verb id in short form
 * @param {object} extra - Extra values to be added to the statement
 * @returns {Function} - XAPIEvent object
 */
H5P.EventDispatcher.prototype.createXAPIEventTemplate = function(verb, extra) {
  var event = new H5P.XAPIEvent();

  event.setActor();
  event.setVerb(verb);
  if (extra !== undefined) {
    for (var i in extra) {
      event.data.statement[i] = extra[i];
    }
  }
  if (!('object' in event)) {
    event.setObject(this);
  }
  return event;
};

/**
 * Helper function to create xAPI completed events
 *
 * @param {int} score - will be set as the 'raw' value of the score object
 * @param {int} maxScore - will be set as the "max" value of the score object
 */
H5P.EventDispatcher.prototype.triggerXAPICompleted = function(score, maxScore) {
  var event = this.createXAPIEventTemplate('completed');
  event.setScoredResult(score, maxScore);
  this.trigger(event);
}

/**
 * Internal H5P function listening for xAPI completed events and stores scores
 * 
 * @param {function} event - xAPI event
 */
H5P.xAPICompletedListener = function(event) {
  var statement = event.data.statement;
  if ('verb' in statement) {
    if (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
      var score = statement.result.score.raw;
      var maxScore = statement.result.score.max;
      var contentId = statement.object.extensions['http://h5p.org/x-api/h5p-local-content-id'];
      H5P.setFinished(contentId, score, maxScore);
    }
  }
};