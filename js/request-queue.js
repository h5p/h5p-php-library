/**
 * Queue requests and handle them at your convenience
 *
 * @type {RequestQueue}
 */
H5P.RequestQueue = (function ($) {
  /**
   * A queue for requests, will be automatically processed when regaining connection
   *
   * @param {string} itemName Name that requests will be stored as in local storage
   * @param {string} eventName Name of event that will be triggered when a new item is added to the queue
   * @constructor
   */
  const RequestQueue = function (itemName, eventName) {
    this.processingQueue = false;

    this.itemName = itemName;
    this.eventName = eventName;

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

    H5P.externalDispatcher.trigger(this.eventName);
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
   */
  RequestQueue.prototype.resumeQueue = function () {
    // Not supported
    if (!H5PIntegration || !window.navigator || !window.localStorage) {
      return;
    }

    // Already processing
    if (this.processingQueue) {
      return;
    }

    // Application is offline, re-send when we detect a connection
    if (!window.navigator.onLine) {
      return;
    }

    // We're online, attempt to send queued requests
    const queue = this.getStoredRequests();
    const queueLength = queue.length;

    // Clear storage, failed requests will be re-added
    this.clear();

    // No items left in queue
    if (!queueLength) {
      return;
    }

    // Make sure requests are not changed while they're being handled
    this.processingQueue = true;

    // Process queue in original order
    this.processQueue(queue);
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
    }
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

    this.displayToastMessage(message);
  };

  return RequestQueue;
})(H5P.jQuery);

H5P.offlineRequestQueue = new H5P.RequestQueue('requestQueue', 'requestQueued');
