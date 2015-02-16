var H5P = H5P || {};

/**
 * Internal H5P function listening for xAPI completed events and stores scores
 * 
 * @param {function} event - xAPI event
 */
H5P.xAPIListener = function(event) {
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

/**
 * Trigger xAPI events on all registered listeners
 * 
 * @param {Function} event - xAPI event
 */
H5P.xAPIEmitter = function (event) {
  if (event.data.statement !== undefined) {
    for (var i = 0; i < H5P.xAPIListeners.length; i++) {
      H5P.xAPIListeners[i](event.data.statement);
    }
  }
};

H5P.xAPIListeners = [];

/**
 * API function used to register for xAPI events
 * 
 * @param {Function} listener
 */
H5P.onXAPI = function(listener) {
  H5P.xAPIListeners.push(listener);
};

/**
 * Constructor for xAPI events
 * 
 * @class
 */
H5P.XAPIEvent = function() {
  H5P.Event.call(this, 'xAPI', {'statement': {}});
};

H5P.XAPIEvent.prototype = Object.create(H5P.Event.prototype);
H5P.XAPIEvent.prototype.constructor = H5P.XAPIEvent;

/**
 * Helperfunction to set scored result statements
 * 
 * @param {int} score
 * @param {int} maxScore
 */
H5P.XAPIEvent.prototype.setScoredResult = function(score, maxScore) {
  this.data.statement.result = {
    'score': {
      'min': 0,
      'max': maxScore,
      'raw': score
    }
  };
};

/**
 * Helperfunction to set a verb.
 * 
 * @param {string} verb
 *  Verb in short form, one of the verbs defined at
 *  http://adlnet.gov/expapi/verbs/
 */
H5P.XAPIEvent.prototype.setVerb = function(verb) {
  if (H5P.jQuery.inArray(verb, H5P.XAPIEvent.allowedXAPIVerbs) !== -1) {
    this.data.statement.verb = {
      'id': 'http://adlnet.gov/expapi/verbs/' + verb,
      'display': {
        'en-US': verb
      }
    };
  }
  else {
  console.log('illegal verb');
  }
  // Else: Fail silently...
};

/**
 * Helperfunction to get the statements verb id
 * 
 * @param {boolean} full
 *  if true the full verb id prefixed by http://adlnet.gov/expapi/verbs/ will be returned
 * @returns {string} - Verb or null if no verb with an id has been defined
 */
H5P.XAPIEvent.prototype.getVerb = function(full) {
  var statement = this.data.statement;
  if ('verb' in statement) {
    if (full === true) {
      return statement.verb;
    }
    return statement.verb.id.slice(31);
  }
  else {
    return null;
  }
}

/**
 * Helperfunction to set the object part of the statement.
 * 
 * The id is found automatically (the url to the content)
 * 
 * @param {object} instance - the H5P instance
 */
H5P.XAPIEvent.prototype.setObject = function(instance) {
  this.data.statement.object = {
    // TODO: Correct this. contentId might be vid, and this can't be Drupal
    // specific
    'id': window.location.origin + Drupal.settings.basePath + 'node/' + instance.contentId,
    'objectType': 'Activity',
    'extensions': {
      'http://h5p.org/x-api/h5p-local-content-id': instance.contentId
    }
  };
};

/**
 * Helper function to set the actor, email and name will be added automatically
 */
H5P.XAPIEvent.prototype.setActor = function() {
  this.data.statement.actor = H5P.getActor();
};

/**
 * Get the max value of the result - score part of the statement
 * 
 * @returns {int} the max score, or null if not defined
 */
H5P.XAPIEvent.prototype.getMaxScore = function() {
  return this.getVerifiedStatementValue(['result', 'score', 'max']);
};

/**
 * Get the raw value of the result - score part of the statement
 * 
 * @returns {int} the max score, or null if not defined
 */
H5P.XAPIEvent.prototype.getScore = function() {
  return this.getVerifiedStatementValue(['result', 'score', 'raw']);
};

/**
 * Figure out if a property exists in the statement and return it
 * 
 * @param {array} keys
 *  List describing the property we're looking for. For instance
 *  ['result', 'score', 'raw'] for result.score.raw
 * @returns the value of the property if it is set, null otherwise
 */
H5P.XAPIEvent.prototype.getVerifiedStatementValue = function(keys) {
  var val = this.data.statement;
  for (var i = 0; i < keys.length; i++) {
    if (val[keys[i]] === undefined) {
      return null;
    }
    val = val[keys[i]];
  }
  return val;
};

/**
 * List of verbs defined at http://adlnet.gov/expapi/verbs/
 * 
 * @type Array
 */
H5P.XAPIEvent.allowedXAPIVerbs = [
  'answered',
  'asked',
  'attempted',
  'attended',
  'commented',
  'completed',
  'exited',
  'experienced',
  'failed',
  'imported',
  'initialized',
  'interacted',
  'launched',
  'mastered',
  'passed',
  'preferred',
  'progressed',
  'registered',
  'responded',
  'resumed',
  'scored',
  'shared',
  'suspended',
  'terminated',
  'voided'
];

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
 * Helps get the data for the actor part of the xAPI statement
 * 
 * @returns {object} - the actor object for the xAPI statement
 */
H5P.getActor = function() {
  var user = H5PIntegration.getUser();
  return {
    'name': user.name,
    'mbox': 'mailto:' + user.mail,
    'objectType': 'Agent'
  };
};