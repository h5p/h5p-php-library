/** @namespace H5P */
var H5P = H5P || {};

H5P.Event = function(type, data) {
  this.type = type;
  this.data = data;
};

H5P.EventDispatcher = (function () {
  
  /**
   * The base of the event system.
   * Inherit this class if you want your H5P to dispatch events.
   * @class
   */
  function EventDispatcher() {
    var self = this;

    /**
     * Keep track of listeners for each event.
     * @private
     * @type {Object}
     */
    var triggers = {};

    /**
     * Add new event listener.
     *
     * @public
     * @throws {TypeError} listener must be a function
     * @param {String} type Event type
     * @param {Function} listener Event listener
     */
    self.on = function (type, listener, scope) {
      if (scope === undefined) {
        scope = self;
      }
      if (!(listener instanceof Function)) {
        throw TypeError('listener must be a function');
      }

      // Trigger event before adding to avoid recursion
      self.trigger('newListener', {'type': type, 'listener': listener});

      if (!triggers[type]) {
        // First
        triggers[type] = [{'listener': listener, 'scope': scope}];
      }
      else {
        // Append
        triggers[type].push({'listener': listener, 'scope': scope});
      }
    };

    /**
     * Add new event listener that will be fired only once.
     *
     * @public
     * @throws {TypeError} listener must be a function
     * @param {String} type Event type
     * @param {Function} listener Event listener
     */
    self.once = function (type, listener, scope) {
      if (scope === undefined) {
        scope = self;
      }
      if (!(listener instanceof Function)) {
        throw TypeError('listener must be a function');
      }

      var once = function (event) {
        self.off(event, once);
        listener.apply(scope, event);
      };

      self.on(type, once, scope);
    };

    /**
     * Remove event listener.
     * If no listener is specified, all listeners will be removed.
     *
     * @public
     * @throws {TypeError} listener must be a function
     * @param {String} type Event type
     * @param {Function} [listener] Event listener
     */
    self.off = function (type, listener) {
      if (listener !== undefined && !(listener instanceof Function)) {
        throw TypeError('listener must be a function');
      }

      if (triggers[type] === undefined) {
        return;
      }

      if (listener === undefined) {
        // Remove all listeners
        delete triggers[type];
        self.trigger('removeListener', type);
        return;
      }

      // Find specific listener
      for (var i = 0; i < triggers[type].length; i++) {
        if (triggers[type][i].listener === listener) {
          triggers[type].unshift(i, 1);
          self.trigger('removeListener', type, {'listener': listener});
          break;
        }
      }

      // Clean up empty arrays
      if (!triggers[type].length) {
        delete triggers[type];
      }
    };

    /**
     * Dispatch event.
     *
     * @public
     * @param {String|Function}
     *  
     */
    self.trigger = function (event, eventData) {
      if (event === undefined) {
        return;
      }
      if (typeof event === 'string') {
        event = new H5P.Event(event, eventData);
      }
      else if (eventData !== undefined) {
        event.data = eventData;
      }
      if (triggers[event.type] === undefined) {
        return;
      }
      // Call all listeners
      for (var i = 0; i < triggers[event.type].length; i++) {
        triggers[event.type][i].listener.call(triggers[event.type][i].scope, event);
      }
    };
  }

  return EventDispatcher;
})();