var H5P = window.H5P = window.H5P || {};

/**
 * The external event dispatcher. Others, outside of H5P may register and
 * listen for H5P Events here.
 *
 * @type {H5P.EventDispatcher}
 */
H5P.externalDispatcher = new H5P.EventDispatcher();

// EventDispatcher extensions

/**
 * Helper function for triggering xAPI added to the EventDispatcher.
 *
 * @param {string} verb
 *   The short id of the verb we want to trigger
 * @param {Oject} [extra]
 *   Extra properties for the xAPI statement
 */
H5P.EventDispatcher.prototype.triggerXAPI = function (verb, extra) {
  this.trigger(this.createXAPIEventTemplate(verb, extra));
};

/**
 * Helper function to create event templates added to the EventDispatcher.
 *
 * Will in the future be used to add representations of the questions to the
 * statements.
 *
 * @param {string} verb
 *   Verb id in short form
 * @param {Object} [extra]
 *   Extra values to be added to the statement
 * @returns {H5P.XAPIEvent}
 *   Instance
 */
H5P.EventDispatcher.prototype.createXAPIEventTemplate = function (verb, extra) {
  var event = new H5P.XAPIEvent();

  event.setActor();
  event.setVerb(verb);
  if (extra !== undefined) {
    for (var i in extra) {
      event.data.statement[i] = extra[i];
    }
  }
  if (!('object' in event.data.statement)) {
    event.setObject(this);
  }
  if (!('context' in event.data.statement)) {
    event.setContext(this);
  }
  return event;
};

/**
 * Helper function to create xAPI completed events
 *
 * DEPRECATED - USE triggerXAPIScored instead
 *
 * @deprecated
 *   since 1.5, use triggerXAPIScored instead.
 * @param {number} score
 *   Will be set as the 'raw' value of the score object
 * @param {number} maxScore
 *   will be set as the "max" value of the score object
 * @param {boolean} success
 *   will be set as the "success" value of the result object
 */
H5P.EventDispatcher.prototype.triggerXAPICompleted = function (score, maxScore, success) {
  this.triggerXAPIScored(score, maxScore, 'completed', true, success);
};

/**
 * Helper function to create scored xAPI events
 *
 * @param {number} score
 *   Will be set as the 'raw' value of the score object
 * @param {number} maxScore
 *   Will be set as the "max" value of the score object
 * @param {string} verb
 *   Short form of adl verb
 * @param {boolean} completion
 *   Is this a statement from a completed activity?
 * @param {boolean} success
 *   Is this a statement from an activity that was done successfully?
 */
H5P.EventDispatcher.prototype.triggerXAPIScored = function (score, maxScore, verb, completion, success) {
  var event = this.createXAPIEventTemplate(verb);
  event.setScoredResult(score, maxScore, this, completion, success);
  this.trigger(event);
};

H5P.EventDispatcher.prototype.setActivityStarted = function () {
  if (this.activityStartTime === undefined) {
    // Don't trigger xAPI events in the editor
    if (this.contentId !== undefined &&
        H5PIntegration.contents !== undefined &&
        H5PIntegration.contents['cid-' + this.contentId] !== undefined) {
      this.triggerXAPI('attempted');
    }
    this.activityStartTime = Date.now();
  }
};

/**
 * Internal H5P function listening for xAPI completed events and stores scores
 *
 * @param {H5P.XAPIEvent} event
 */
H5P.xAPICompletedListener = function (event) {
  if ((event.getVerb() === 'completed' || event.getVerb() === 'answered') && !event.getVerifiedStatementValue(['context', 'contextActivities', 'parent'])) {
    var contentId = event.getVerifiedStatementValue(['object', 'definition', 'extensions', 'http://h5p.org/x-api/h5p-local-content-id']);
    if (H5P.opened[contentId] === undefined) {
      return;
    }
    var score = event.getScore();
    var maxScore = event.getMaxScore();
    H5P.setFinished(contentId, score, maxScore);
  }
};

(function () {
  /**
   * Finds a H5P library instance in an array based on the content ID
   *
   * @param  {Array} instances
   * @param  {number} contentId
   * @returns {Object|null} Content instance
   */
  function findInstanceInArray(instances, contentId) {
    if (instances !== undefined && contentId !== undefined) {
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].contentId === contentId) {
          return instances[i];
        }
      }
    }
  }

  /**
   *
   */
  const callOnInstance = function (instance, fun, args) {
    if (typeof instance[fun] === 'function') {
      return instance[fun].apply(instance, args);
    }
    else {
      console.error('Instance missing ' + fun + '() function');
    }
  };


  /**
   * The new default completed listener
   */
  H5P.xAPICompletedListener2 = function (e) {
    if (typeof this.setXAPIData !== 'function') {
      // Does not support our new ways
      return H5P.xAPICompletedListener.call(this, e);
    }

    const verb = e.getVerb();
    if (verb !== 'answered' && verb !== 'completed' && verb !== 'showed-solution') {
      if (typeof H5P.otherXAPIData === 'function') {
        H5P.otherXAPIData(e);
      }
      return;
    }

    const contentId = e.getVerifiedStatementValue(['object', 'definition', 'extensions', 'http://h5p.org/x-api/h5p-local-content-id']);
    if (!contentId) {
      return;
    }

    const instance = findInstanceInArray(H5P.instances, contentId);
    if (!instance) {
      return;
    }

    // Get xAPI data for the instance who triggered the event
    const xAPIData = callOnInstance(this, 'getXAPIData');
    if (!xAPIData) {
      return;
    }

    H5P.checkXAPIData.call(this, verb, instance, xAPIData);
  };

  /**
   *
   */
  H5P.checkXAPIData = function (verb, instance, xAPIData) {
    if (verb === 'showed-solution') {
      // Create solution based on the xAPIData
      callOnInstance(this, 'setXAPIData', [recursive('solution', xAPIData)]);
    }
    else if (xAPIData.statement.verb.display['en-US'] === 'answered' || xAPIData.statement.verb.display['en-US'] === 'completed') {
      // Create feedback based on the statement
      callOnInstance(this, 'setXAPIData', [recursive('feedback', xAPIData)]);
    }
  };

  /**
   *
   */
  const recursive = function (type, xAPIData) {
    const data = {
      type: type
    };
    console.log('recursive', type, xAPIData); // TODO: REMOVE

    // Create feedback for data
    if (xAPIData.statement.object.definition.interactionType === 'choice') {
      data[type] = choice(type, xAPIData.statement.object.definition, xAPIData.statement.result);
    }

    // Create feedback for child data
    if (xAPIData.children && xAPIData.children.length) {
      data.children = [];
      for (let i = 0; i < xAPIData.children.length; i++) {
        data.children.push(recursive(type, xAPIData.children[i]));
      }
    }

    return data;
  };

  /**
   *
   */
  const choice = function (type, definition, result) {
    // Prepare answers
    const response = result.response ? result.response.split('[,]') : [];
    const correct = definition.correctResponsesPattern
      && definition.correctResponsesPattern.length ? definition.correctResponsesPattern[0].split('[,]') : [];

    // If solution was requested
    if (type === 'solution') {
      // TODO: Disallow if showSolutionsRequiresInput && no response
      return {
        choices: correct
      }
    }

    // Prepare for feedback
    const feedback = {
      answers: [],
      points: 0,
      max: 0
    };

    // Go through all available options
    for (let i = 0; i < definition.choices.length; i++) {
      const id = definition.choices[i].id;

      // Determine if this was chosen and if it was correct
      const isChosen = response.indexOf(id) !== -1;
      const isCorrect = correct.indexOf(id) !== -1;

      // Determine the weight of this repsonse
      const responseWeight = definition.extensions['http://h5p.org/x-api/response-weight']
        && definition.extensions['http://h5p.org/x-api/response-weight'][i] ? definition.extensions['http://h5p.org/x-api/response-weight'][i] : 1;

      // Determine how many points to award
      const choice = {
        points: isChosen ? (isCorrect ? responseWeight : responseWeight * -1) : 0
      };

      // Determine if feedback should be provided for this choice
      if (definition.extensions['http://h5p.org/x-api/choice-feedback']
          && definition.extensions['http://h5p.org/x-api/choice-feedback'][i]) {
        choice.feedback = isChosen ? definition.extensions['http://h5p.org/x-api/choice-feedback'][i].chosen : definition.extensions['http://h5p.org/x-api/choice-feedback'][i].notChosen;
      }

      feedback.answers[id] = choice; // TODO: Find a better ID solution? Needed when randomized.
      feedback.points += choice.points;
    }

    const min = 0;
    if (feedback.points < min) {
      feedback.points = min;
    }

    // Determine the weight of this task
    const weight = definition.extensions['http://h5p.org/x-api/weight'] ? definition.extensions['http://h5p.org/x-api/weight'] : 1;

    // In case no answer is the correct answer
    if (!correct.length) {
      feedback.max = weight;
      if (!response.length) {
        feedback.points = feedback.max;
      }
    }
    else {
      feedback.max = correct.length;
    }

    // Determine max score
    if (definition.extensions['http://h5p.org/x-api/choice-type'] === 'single'
        || definition.extensions['http://h5p.org/x-api/single-point']) {
      feedback.max = weight;
    }

    // Determine score if this is a single point task
    const scaled = (feedback.max === 0 ? 0 : feedback.points / feedback.max);
    const success = (100 * scaled) >= (definition.extensions['http://h5p.org/x-api/pass-percentage'] || 100);
    if (definition.extensions['http://h5p.org/x-api/single-point']) {
      feedback.points = success ? weight : min;
    }

    // Select feedback text based on the scaled score
    if (definition.extensions['http://h5p.org/x-api/overall-feedback']) {
      const scaledFlat = Math.floor(scaled * 100);
      const overallFeedback = definition.extensions['http://h5p.org/x-api/overall-feedback'];
      for (let i = 0; i < overallFeedback.length; i++) {
        if (overallFeedback[i].from <= scaledFlat
            && overallFeedback[i].to >= scaledFlat
            && overallFeedback[i].feedback !== undefined
            && overallFeedback[i].feedback.trim().length !== 0) {
          feedback.overall = overallFeedback[i].feedback;
        }
      }
    }

    // Update statement for consistency?
    result.min = min;
    result.raw = feedback.points;
    result.max = feedback.max;
    result.scaled = Math.round(result.raw / result.max * 10000) / 10000;
    result.success = success;

    return feedback;
  }
})();
