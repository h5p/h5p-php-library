/**
 * Queue requests and handle them at your convenience
 *
 * @type {RequestQueue}
 */
H5P.RequestQueue = (function ($, EventDispatcher) {
  /**
   * A queue for requests, will be automatically processed when regaining connection
   *
   * @param {boolean} [options.showToast] Disable showing toast when losing or regaining connection
   * @constructor
   */
  const RequestQueue = function (options) {
    EventDispatcher.call(this);
    this.processingQueue = false;

    this.showToast = options ? options.showToast : false;

    // Initialize listener for when requests are added to queue
    window.addEventListener('offline', this.updateOnlineStatus.bind(this));
    window.addEventListener('online', this.updateOnlineStatus.bind(this));
  };

  /**
   * Add request to queue
   *
   * @param {string} url
   * @param {Object} data
   * @returns {boolean}
   */
  RequestQueue.prototype.add = function (url, data) {
    if (!window.localStorage) {
      return false;
    }

    let storedStatements = this.getStoredRequests();
    if (!storedStatements) {
      storedStatements = [];
    }

    storedStatements.push({
      url: url,
      data: data,
    });

    window.localStorage.setItem(this.itemName, JSON.stringify(storedStatements));

    this.trigger('requestQueued', storedStatements);
    return true;
  };

  /**
   * Get stored requests
   *
   * @returns {boolean|Array} Stored requests
   */
  RequestQueue.prototype.getStoredRequests = function () {
    if (!window.localStorage) {
      return false;
    }

    const item = window.localStorage.getItem(this.itemName);
    if (!item) {
      return [];
    }

    return JSON.parse(item);
  };

  /**
   * Clear stored requests
   *
   * @returns {boolean} True if the storage was successfully cleared
   */
  RequestQueue.prototype.clear = function () {
    if (!window.localStorage) {
      return false;
    }

    window.localStorage.removeItem(this.itemName);
    return true;
  };

  /**
   * Start processing of requests queue
   *
   * @return {boolean} Returns false if it was not possible to resume processing queue
   */
  RequestQueue.prototype.resumeQueue = function () {
    // Not supported
    if (!H5PIntegration || !window.navigator || !window.localStorage) {
      return false;
    }

    // Already processing
    if (this.processingQueue) {
      return false;
    }

    // Application is offline, re-send when we detect a connection
    if (!window.navigator.onLine) {
      return false;
    }

    // We're online, attempt to send queued requests
    const queue = this.getStoredRequests();
    const queueLength = queue.length;

    // Clear storage, failed requests will be re-added
    this.clear();

    // No items left in queue
    if (!queueLength) {
      return true;
    }

    // Make sure requests are not changed while they're being handled
    this.processingQueue = true;

    // Process queue in original order
    this.processQueue(queue);
    return true
  };

  /**
   * Process first item in the request queue
   *
   * @param {Array} queue Request queue
   */
  RequestQueue.prototype.processQueue = function (queue) {
    if (!queue.length) {
      return;
    }

    this.trigger('processingQueue');

    // Make sure the requests are processed in a FIFO order
    const request = queue.shift();

    const self = this;
    $.post(request.url, request.data)
      .fail(self.onQueuedRequestFail.bind(self, request))
      .always(self.onQueuedRequestProcessed.bind(self, queue))
  };

  /**
   * Request fail handler
   *
   * @param {Object} request
   */
  RequestQueue.prototype.onQueuedRequestFail = function (request) {
    // Queue the failed request again if we're offline
    if (!window.navigator.onLine) {
      this.add(request.url, request.data);
    }
  };

  /**
   * An item in the queue was processed
   *
   * @param {Array} queue Queue that was processed
   */
  RequestQueue.prototype.onQueuedRequestProcessed = function (queue) {
    if (queue.length) {
      this.processQueue(queue);
      return;
    }

    // Finished processing this queue
    this.processingQueue = false;
    if (!window.navigator.onLine) {
      return;
    }

    // Process next queue if items were added while processing current queue
    const requestQueue = this.getStoredRequests();
    if (requestQueue.length) {
      this.resumeQueue();
      return;
    }

    // Run empty queue callback
    this.trigger('queueEmptied');
  };

  /**
   * Display toast message on the first content of current page
   *
   * @param {string} msg Message to display
   */
  RequestQueue.prototype.displayToastMessage = function (msg) {
    H5P.attachToastTo(
      H5P.jQuery('.h5p-content:first')[0],
      msg,
      {
        position: {
          horizontal: 'centered',
          vertical: 'centered',
          noOverflowX: true
        }
      }
    );
  };

  /**
   * Update online status
   */
  RequestQueue.prototype.updateOnlineStatus = function () {
    // Lost connection
    if (!window.navigator.onLine) {
      this.displayToastMessage(H5P.t('connectionLost'));
      return;
    }

    // Re-connected, resume processing of queue
    let message = H5P.t('connectionReestablished');
    const requestQueue = this.getStoredRequests();
    if (requestQueue.length) {
      message += ' ' + H5P.t('resubmitScores');
      this.resumeQueue();
    }

    if (this.showToast) {
      this.displayToastMessage(message);
    }
  };

  return RequestQueue;
})(H5P.jQuery, H5P.EventDispatcher);