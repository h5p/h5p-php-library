var H5PDataView = (function ($) {

  /**
   * Initialize a new H5P data view.
   *
   * @param {Object} container
   * @param {String} source URL for data
   * @param {Array} headers for data
   * @param {Object} l10n translations
   */
  function H5PDataView(container, source, headers, l10n, classes, filters) {
    var self = this;

    self.$container = $(container).addClass('h5p-data-view').html('');

    self.source = source;
    self.headers = headers;
    self.l10n = l10n;
    self.classes = (classes === undefined ? {} : classes);
    self.filters = (filters === undefined ? [] : filters);

    self.limit = 20;
    self.offset = 0;
    self.filterOn = [];

    self.loadData();
  }

  /**
   * Load data for view.
   *
   * @param {Number} offset data collection offset
   */
  H5PDataView.prototype.loadData = function () {
    var self = this;

    // Throbb
    self.setMessage(H5PUtils.throbber(self.l10n.loading));

    // Create URL
    var url = self.source;
    url += (url.indexOf('?') === -1 ? '?' : '&') + 'offset=' + self.offset + '&limit=' + self.limit;

    // Add sorting
    if (self.sortBy !== undefined && self.sortDir !== undefined) {
      url += '&sortBy=' + self.sortBy + '&sortDir=' + self.sortDir;
    }

    // Add filters
    for (var i = 0; i < self.filterOn.length; i++) {
      if (self.filterOn[i] === undefined) {
        continue;
      }

      url += '&filters[' + i + ']=' + encodeURIComponent(self.filterOn[i]);
    }

    // Fire ajax request
    $.ajax({
      dataType: 'json',
      cache: true,
      url: url
    }).fail(function () {
      // Error handling
      self.setMessage($('<p/>', {text: self.l10n.ajaxFailed}));
    }).done(function (data) {
      if (!data.rows.length) {
        self.setMessage($('<p/>', {text: self.l10n.noData}));
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
   * @public
   * @param {jQuery} $message wrapper with message
   */
  H5PDataView.prototype.setMessage = function ($message) {
    var self = this;

    if (self.table === undefined) {
      self.$container.html('').append($message);
    }
    else {
      self.table.setBody($message);
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
      // Clear out container
      self.$container.html('');

      // Add filters
      self.addFilters();

      // Create new table
      self.table = new H5PUtils.Table(self.classes, self.headers);
      self.table.setHeaders(self.headers, function (col, dir) {
        // Sorting column or direction has changed callback.
        self.sortBy = col;
        self.sortDir = dir;
        self.loadData();
      });
      self.table.appendTo(self.$container);
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
        self.offset = offset;
        self.loadData();
      }, self.l10n);

      self.pagination.appendTo($pagerContainer);
      self.table.setFoot($pagerContainer);
    }
    else {
      // Update existing widget
      self.pagination.update(num, self.limit);
    }
  };

  /**
   * Add filters.
   * @public
   */
  H5PDataView.prototype.addFilters = function () {
    var self = this;

    for (var i = 0; i < self.filters.length; i++) {
      if (self.filters[i] === true) {
        // Add text input filter for col i
        self.addTextFilter(i);
      }
    }
  };

  /**
   * Add text filter for given col num.

   * @public
   * @param {Number} col
   */
  H5PDataView.prototype.addTextFilter = function (col) {
    var self = this;

    /**
     * Find input value and filter on it.
     * @private
     */
    var search = function () {
      var filterOn = $input.val().replace(/^\s+|\s+$/g, '');
      if (filterOn === '') {
        filterOn = undefined;
      }
      if (filterOn !== self.filterOn[col]) {
        self.filterOn[col] = filterOn;
        self.loadData();
      }
    };

    // Add text field for filtering
    var typing;
    var $input = $('<input/>', {
      type: 'text',
      placeholder: self.l10n.search,
      on: {
        'blur': function () {
          clearTimeout(typing);
          search();
        },
        'keyup': function (event) {
          if (event.keyCode === 13) {
            clearTimeout(typing);
            search();
            return false;
          }
          else {
            clearTimeout(typing);
            typing = setTimeout(function () {
              search();
            }, 500);
          }
        }
      }
    }).appendTo(self.$container);
  };

  return H5PDataView;
})(H5P.jQuery);
