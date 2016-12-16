H5P.ActionBar = (function ($, EventDispatcher) {
  "use strict";

  function ActionBar(displayOptions) {
    EventDispatcher.call(this);

    var self = this;

    var hasActions = false;

    // Create action bar
    var $actions = H5P.jQuery('<ul class="h5p-actions"></ul>');

    /**
     * Helper for creating action bar buttons.
     *
     * @private
     * @param {string} type
     * @param {string} customClass Instead of type class
     */
    var addActionButton = function (type, customClass) {
      var handler = function () {
        self.trigger(type);
      };
      H5P.jQuery('<li/>', {
        'class': 'h5p-button h5p-' + (customClass ? customClass : type),
        role: 'button',
        tabindex: 0,
        title: H5P.t(type + 'Description'),
        html: H5P.t(type),
        on: {
          click: handler,
          keypress: function (e) {
            if (e.which === 32) {
              handler();
              e.preventDefault(); // (since return false will block other inputs)
            }
          }
        },
        appendTo: $actions
      });

      hasActions = true;
    };

    // Register action bar buttons
    if (displayOptions.showDownload) {
      // Add export button
      addActionButton('download', 'export');
    }
    if (displayOptions.showCopyright) {
      addActionButton('copyrights');
    }
    if (displayOptions.showEmbed) {
      addActionButton('embed');
    }
    if (displayOptions.showAbout) {
      // Add about H5P button icon
      H5P.jQuery('<li><a class="h5p-link" href="http://h5p.org" target="_blank" title="' + H5P.t('h5pDescription') + '"></a></li>').appendTo($actions);
      hasActions = true;
    }

    self.getDOMElement = function () {
      return $actions;
    };

    self.hasActions = function () {
      return hasActions;
    }
  };

  ActionBar.prototype = Object.create(EventDispatcher.prototype);
  ActionBar.prototype.constructor = ActionBar;

  return ActionBar;

})(H5P.jQuery, H5P.EventDispatcher);
