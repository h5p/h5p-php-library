var H5PDataView = (function ($) {

  /**
   * Initialize a new H5P data view.
   *
   * @param {Object} container
   * @param {String} source URL for data
   * @param {Array} headers for data
   * @param {Object} l10n translations
   */
  function H5PDataView(container, source, headers, l10n, classes) {
    var self = this;

    self.$container = $(container).addClass('h5p-data-view').html('');
    H5PUtils.throbber(l10n.loading).appendTo(self.$container);

    self.source = source;
    self.headers = headers;
    self.l10n = l10n;
    self.classes = (classes === undefined ? {} : classes);
    self.limit = 20;

    self.loadData();
  }

  /**
   * Load data for view.
   *
   * @param {Number} offset data collection offset
   */
  H5PDataView.prototype.loadData = function (offset) {
    var self = this;

    // Create URL
    var url = self.source;
    if (offset !== undefined) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + 'offset=' + offset + '&limit=' + self.limit;
    }

    // Fire ajax request
    $.ajax({
      dataType: 'json',
      cache: true,
      url: url
    }).fail(function () {
      // Error handling
      self.setMessage(self.l10n.ajaxFailed);
    }).done(function (data) {
      if (!data.rows.length) {
        self.setMessage(self.l10n.noData);
      }
      else {
        // Update table data
        self.updateTable(data.rows);
      }

      // Update pagination widget
      self.updatePagination(data.num);
    });
  };

  /**
   * Display the given message to the user.
   *
   * @param {String} message
   */
  H5PDataView.prototype.setMessage = function (message) {
    var self = this;

    var $message = $('<p/>', {
      text: message
    });
    if (self.table === undefined) {
      self.$container.children().replaceWith($message);
    }
    else {
      self.table.setBody($('<p/>', {text: message}));
    }
  };

  /**
   * Update table data.
   *
   * @param {Array} rows
   */
  H5PDataView.prototype.updateTable = function (rows) {
    var self = this;

    if (self.table === undefined) {
      // Create new table
      self.table = new H5PUtils.Table(self.classes, self.headers);
      self.table.appendTo(self.$container.html(''));
    }

    // Add/update rows
    self.table.setRows(rows);
  };

  /**
   * Update pagination widget.
   *
   * @param {Number} num size of data collection
   */
  H5PDataView.prototype.updatePagination = function (num) {
    var self = this;

    if (self.pagination === undefined) {
      // Create new widget
      var $pagerContainer = $('<div/>', {'class': 'h5p-pagination'});
      self.pagination = new H5PUtils.Pagination(num, self.limit, function (offset) {
        // Handle page changes in pagination widget
        self.table.setBody(H5PUtils.throbber(self.l10n.loading));
        self.loadData(offset);
      }, self.l10n);

      self.pagination.appendTo($pagerContainer);
      self.table.setFoot($pagerContainer);
    }
    else {
      // Update existing widget
      self.pagination.update(num, self.limit);
    }
  };

  return H5PDataView;
})(H5P.jQuery);
