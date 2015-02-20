var H5P = H5P || {};

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
  if (instance.contentId) {
    this.data.statement.object = {
      'id': H5PIntegration.getContentUrl(instance.contentId),
      'objectType': 'Activity',
      'extensions': {
        'http://h5p.org/x-api/h5p-local-content-id': instance.contentId
      }
    };
  }
  else {
    // Not triggered by an H5P content type...
    this.data.statement.object = {
      'objectType': 'Activity'
    };
  }
};

/**
 * Helper function to set the actor, email and name will be added automatically
 */
H5P.XAPIEvent.prototype.setActor = function() {
  var user = H5PIntegration.getUser();
  this.data.statement.actor = {
    'name': user.name,
    'mbox': 'mailto:' + user.mail,
    'objectType': 'Agent'
  };
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