var H5P = H5P || {};

H5P.xAPIListener = function(event) {
  if ('verb' in event.statement) {
    if (event.statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
      var score = event.statement.result.score.raw;
      var maxScore = event.statement.result.score.max;
      var contentId = event.statement.object.extensions['http://h5p.org/x-api/h5p-local-content-id'];
      H5P.setFinished(contentId, score, maxScore);
    }
  }
};

H5P.xAPIEmitter = function (event) {
  if (event.statement !== undefined) {
    for (var i = 0; i < H5P.xAPIListeners.length; i++) {
      H5P.xAPIListeners[i](event.statement);
    }
  }
};

H5P.xAPIListeners = [];

H5P.onXAPI = function(listener) {
  H5P.xAPIListeners.push(listener);
};

H5P.onXAPI(function(statement) {
  console.log(statement);
});

H5P.XAPIEvent = function() {
  H5P.Event.call(this);
  this.statement = {};
};

H5P.XAPIEvent.prototype = Object.create(H5P.Event.prototype);
H5P.XAPIEvent.prototype.constructor = H5P.XAPIEvent;

H5P.XAPIEvent.prototype.setScoredResult = function(score, maxScore) {
  this.statement.result = {
    'score': {
      'min': 0,
      'max': maxScore,
      'raw': score
    }
  };
};

H5P.XAPIEvent.prototype.setVerb = function(verb) {
  if (H5P.jQuery.inArray(verb, H5P.XAPIEvent.allowedXAPIVerbs) !== -1) {
    this.statement.verb = {
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

H5P.XAPIEvent.prototype.setObject = function(instance) {
  this.statement.object = {
    // TODO: Correct this. contentId might be vid
    'id': window.location.origin + Drupal.settings.basePath + 'node/' + instance.contentId,
    'objectType': 'Activity',
    'extensions': {
      'http://h5p.org/x-api/h5p-local-content-id': instance.contentId
    }
  };
};

H5P.XAPIEvent.prototype.setActor = function() {
  this.statement.actor = H5P.getActor();
};

H5P.XAPIEvent.prototype.getMaxScore = function() {
  return this.getVerifiedStatementValue(['result', 'score', 'max']);
};

H5P.XAPIEvent.prototype.getScore = function() {
  return this.getVerifiedStatementValue(['result', 'score', 'raw']);
};

H5P.XAPIEvent.prototype.getVerifiedStatementValue = function(keys) {
  var val = this.statement;
  for (var i in keys) {
    if (val[keys[i]] === undefined) {
      return null;
    }
    val = val[keys[i]];
  }
  return val;
}

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

H5P.EventDispatcher.prototype.triggerXAPI = function(verb, extra) {
  var event = this.createXAPIEventTemplate(verb, extra);
  this.trigger('xAPI', event);
};

H5P.EventDispatcher.prototype.createXAPIEventTemplate = function(verb, extra) {
  var event = new H5P.XAPIEvent();

  event.setActor();
  event.setVerb(verb);
  if (extra !== undefined) {
    for (var i in extra) {
      event.statement[i] = extra[i];
    }
  }
  if (!('object' in event)) {
    event.setObject(this);
  }
  return event;
};

H5P.EventDispatcher.prototype.triggerXAPICompleted = function(score, maxScore) {
  var event = this.createXAPIEventTemplate('completed');
  event.setScoredResult(score, maxScore);
  this.trigger('xAPI', event);
}

H5P.getActor = function() {
  var user = H5PIntegration.getUser();
  return {
    'name': user.name,
    'mbox': 'mailto:' + user.mail,
    'objectType': 'Agent'
  };
};