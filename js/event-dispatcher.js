/** @namespace H5P */
var H5P = H5P || {};

H5P.Event = function() {
  // We're going to add bubbling, propagation and other features here later
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
    self.on = function (type, listener) {
      if (!(listener instanceof Function)) {
        throw TypeError('listener must be a function');
      }

      // Trigger event before adding to avoid recursion
      self.trigger('newListener', type, listener);

      if (!triggers[type]) {
        // First
        triggers[type] = [listener];
      }
      else {
        // Append
        triggers[type].push(listener);
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
        if (triggers[type][i] === listener) {
          triggers[type].unshift(i, 1);
          self.trigger('removeListener', type, listener);
          break;
        }
      }

      // Clean up empty arrays
      if (!triggers[type].length) {
        delete triggers[type];
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
    var getArgs = function (args, skip, event) {
      var left = [event];
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
    self.trigger = function (type, event) {
      console.log('triggering');
      if (self.debug !== undefined) {
        // Class has debug enabled. Log events.
        console.log(self.debug + ' - Firing event "' + type + '", ' + (triggers[type] === undefined ? 0 : triggers[type].length) + ' listeners.', getArgs(arguments, 1));
      }
      
      if (event === null) {
        event = new H5P.Event();
      }
      console.log(triggers);
      if (triggers[type] === undefined) {
        return;
      }

      // Copy all arguments except the first two
      var args = getArgs(arguments, 2, event);
      

      // Call all listeners
      console.log(triggers);
      for (var i = 0; i < triggers[type].length; i++) {
        triggers[type][i].apply(self, args);
      }
    };
  }

  return EventDispatcher;
})();