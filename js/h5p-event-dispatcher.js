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
     * Dispatch event.
     *
     * @public
     * @param {String} type Event type
     * @param {...*} args
     */
    self.trigger = function (type) {
      if (events[type] === undefined) {
        return;
      }

      // Copy all arguments except the first
      var i, args = [];
      for (i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
      }

      // Call all listeners
      for (i = 0; i < events[type].length; i++) {
        events[type][i].apply(self, args);
      }
    };
  }

  return EventDispatcher;
})();
