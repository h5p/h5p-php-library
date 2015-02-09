// H5P iframe Resizer
(function () {
  if (!window.postMessage || !window.addEventListener) {
    return; // Not supported
  }

  // Map actions to handlers
  var actionHandlers = {};

  /**
   * Prepare iframe resize.
   *
   * @private
   * @param {Object} iframe Element
   * @param {Object} data Payload
   * @param {Function} respond Send a response to the iframe
   */
  actionHandlers.hello = function (iframe, data, respond) {
    // Make iframe responsive
    iframe.style.width = '100%';

    // Tell iframe that it needs to resize when our window resizes
    var resize = function (event) {
      if (iframe.contentWindow) {
        // Limit resize calls to avoid flickering
        respond('resize');
      }
      else {
        // Frame is gone, unregister.
        window.removeEventListener('resize', resize);
      }
    };
    window.addEventListener('resize', resize, false);

    // Respond to let the iframe know we can resize it
    respond('hello');
  };

  /**
   * Prepare iframe resize.
   *
   * @private
   * @param {Object} iframe Element
   * @param {Object} data Payload
   * @param {Function} respond Send a response to the iframe
   */
  actionHandlers.prepareResize = function (iframe, data, respond) {
    responseData = {};

    // Retain parent size to avoid jumping/scrolling
    responseData.parentHeight = iframe.parentElement.style.height;
    //iframe.parentElement.style.height = iframe.parentElement.clientHeight + 'px';

    // Reset iframe height, in case content has shrinked.
    iframe.style.height = '1px';

    respond('resizePrepared', responseData);
  };

  /**
   * Resize parent and iframe to desired height.
   *
   * @private
   * @param {Object} iframe Element
   * @param {Object} data Payload
   * @param {Function} respond Send a response to the iframe
   */
  actionHandlers.resize = function (iframe, data, respond) {
    // Resize iframe so all content is visible.
    iframe.style.height = data.height + 'px';

    // Free parent
    //iframe.parentElement.style.height = data.parentHeight;
  };

  /**
   * Keyup event handler. Exits full screen on escape.
   *
   * @param {Event} event
   */
  var escape = function (event) {
    if (event.keyCode === 27) {
      exitFullScreen();
    }
  };

  // /**
  //  * Enter semi full screen.
  //  * Expands the iframe so that it covers the whole page.
  //  *
  //  * @private
  //  * @param {Object} iframe Element
  //  * @param {Object} data Payload
  //  * @param {Function} respond Send a response to the iframe
  //  */
  // actionHandlers.fullScreen = function (iframe, data, respond) {
  //   iframe.style.position = 'fixed';
  //   iframe.style.top = iframe.style.left = 0;
  //   iframe.style.zIndex = 101;
  //   iframe.style.width = iframe.style.height = '100%';
  //   document.body.addEventListener('keyup', escape, false);
  //   respond('fullScreen');
  // };
  //
  // /**
  //  * Exit semi full screen.
  //  *
  //  * @private
  //  * @param {Object} iframe Element
  //  * @param {Object} data Payload
  //  * @param {Function} respond Send a response to the iframe
  //  */
  // actionHandlers.exitFullScreen = function (iframe, data, respond) {
  //   iframe.style.position = '';
  //   iframe.style.top = iframe.style.left = '';
  //   iframe.style.zIndex = '';
  //   iframe.style.width = '100%';
  //   iframe.style.height = '';
  //   document.body.removeEventListener('keyup', escape, false);
  //   respond('exitFullScreen');
  // };


  // Listen for messages from iframes
  window.addEventListener('message', function receiveMessage(event) {
    if (event.data.context !== 'h5p') {
      return; // Only handle h5p requests.
    }

    // Find out who sent the message
    var iframe, iframes = document.getElementsByTagName('iframe');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === event.source) {
        iframe = iframes[i];
        break;
      }
    }

    if (!iframe) {
      return; // Cannot find sender
    }

    // Find action handler handler
    if (actionHandlers[event.data.action]) {
      actionHandlers[event.data.action](iframe, event.data, function (action, data) {
        if (data === undefined) {
          data = {};
        }
        data.action = action;
        data.context = 'h5p';
        event.source.postMessage(data, event.origin);
      });
    }
  }, false);
})();
