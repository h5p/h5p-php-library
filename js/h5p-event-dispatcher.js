/** @namespace H5P */
var H5P = H5P || {};

H5P.EventDispatcher = (function () {

  /**
   * The base of the event system.
   * Inherit this class if you want your H5P to dispatch events.
   * @class
   */
  function EventDispatcher() {
    var self = this;

    /**
     * Keep track of events and listeners for each event.
     * @private
     * @type {Object}
     */
    var events = {};

    /**
     * Add new event listener.
     *
     * @public
     * @throws {TypeError} listener must be a function
     * @param {String} type Event type
     * @param {Function} listener Event listener
     */
    self.on = function (type, listener) {
      if (!(listener instanceof Function)) {
        throw TypeError('listener must be a function');
      }

      // Trigger event before adding to avoid recursion
      self.trigger('newListener', type, listener);

      if (!events[type]) {
        // First
        events[type] = [listener];
      }
      else {
        // Append
        events[type].push(listener);
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
    self.once = function (type, listener) {
      if (!(listener instanceof Function)) {
        throw TypeError('listener must be a function');
      }

      var once = function () {
        self.off(type, once);
        listener.apply(self, arguments);
      };

      self.on(type, once);
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

      if (events[type] === undefined) {
        return;
      }

      if (listener === undefined) {
        // Remove all listeners
        delete events[type];
        self.trigger('removeListener', type);
        return;
      }

      // Find specific listener
      for (var i = 0; i < events[type].length; i++) {
        if (events[type][i] === listener) {
          events[type].unshift(i, 1);
          self.trigger('removeListener', type, listener);
          break;
        }
      }

      // Clean up empty arrays
      if (!events[type].length) {
        delete events[type];
      }
    };

    /**
     * Creates a copy of the arguments list. Skips the given number of arguments.
     *
     * @private
     * @param {Array} args List of arguments
     * @param {Number} skip Number of arguments to skip
     * @param {Array} Copy og arguments list
     */
    var getArgs = function (args, skip) {
      var left = [];
      for (var i = skip; i < args.length; i++) {
        left.push(args[i]);
      }
      return left;
    };

    /**
     * Dispatch event.
     *
     * @public
     * @param {String} type Event type
     * @param {...*} args
     */
    self.trigger = function (type) {
      if (self.debug !== undefined) {
        // Class has debug enabled. Log events.
        console.log(self.debug + ' - Firing event "' + type + '", ' + (events[type] === undefined ? 0 : events[type].length) + ' listeners.', getArgs(arguments, 1));
      }

      if (events[type] === undefined) {
        return;
      }

      // Copy all arguments except the first
      var args = getArgs(arguments, 1);

      // Call all listeners
      for (var i = 0; i < events[type].length; i++) {
        events[type][i].apply(self, args);
      }
    };
  }

  return EventDispatcher;
})();
