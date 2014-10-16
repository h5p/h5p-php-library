var H5PUtils = H5PUtils || {};

(function ($) {
  /**
   * Generic function for creating a table including the headers
   *
   * @param {array} headers List of headers
   */
  H5PUtils.createTable = function (headers) {
    var $table = $('<table class="h5p-admin-table' + (H5PIntegration.extraTableClasses !== undefined ? ' ' + H5PIntegration.extraTableClasses : '') + '"></table>');

    if(headers) {
      var $thead = $('<thead></thead>');
      var $tr = $('<tr></tr>');

      $.each(headers, function (index, value) {
        if (!(value instanceof Object)) {
          value = {
            html: value
          };
        }

        $('<th/>', value).appendTo($tr);
      });

      $table.append($thead.append($tr));
    }

    return $table;
  };

  /**
   * Generic function for creating a table row
   *
   * @param {array} rows Value list. Object name is used as class name in <TD>
   */
  H5PUtils.createTableRow = function (rows) {
    var $tr = $('<tr></tr>');

    $.each(rows, function (index, value) {
      if (!(value instanceof Object)) {
        value = {
          html: value
        };
      }

        $('<td/>', value).appendTo($tr);
    });

    return $tr;
  };

  /**
   * Generic function for creating a field containing label and value
   *
   * @param {string} label The label displayed in front of the value
   * @param {string} value The value
   */
  H5PUtils.createLabeledField = function (label, value) {
    var $field = $('<div class="h5p-labeled-field"></div>');

    $field.append('<div class="h5p-label">' + label + '</div>');
    $field.append('<div class="h5p-value">' + value + '</div>');

    return $field;
  };

  /**
   * Replaces placeholder fields in translation strings
   *
   * @param {string} template The translation template string in the following format: "$name is a $sex"
   * @param {array} replacors An js object with key and values. Eg: {'$name': 'Frode', '$sex': 'male'}
   */
  H5PUtils.translateReplace = function (template, replacors) {
    $.each(replacors, function (key, value) {
      template = template.replace(new RegExp('\\'+key, 'g'), value);
    });
    return template;
  };

  /**
   * Get throbber with given text.
   *
   * @param {String} text
   * @returns {$}
   */
  H5PUtils.throbber = function (text) {
    return $('<div/>', {
      class: 'h5p-throbber',
      text: text
    });
  };

  /**
   * Makes it possbile to rebuild all content caches from admin UI.
   * @param {Object} notCached
   * @returns {$}
   */
  H5PUtils.getRebuildCache = function (notCached) {
    var $container = $('<div class="h5p-admin-rebuild-cache"><p class="message">' + notCached.message + '</p><p class="progress">' + notCached.progress + '</p></div>');
    var $button = $('<button>' + notCached.button + '</button>').appendTo($container).click(function () {
      var $spinner = $('<div/>', {class: 'h5p-spinner'}).replaceAll($button);
      var parts = ['|', '/', '-', '\\'];
      var current = 0;
      var spinning = setInterval(function () {
        $spinner.text(parts[current]);
        current++;
        if (current === parts.length) current = 0;
      }, 100);

      var $counter = $container.find('.progress');
      var build = function () {
        $.post(notCached.url, function (left) {
          if (left === '0') {
            clearInterval(spinning);
            $container.remove();
            location.reload();
          }
          else {
            var counter = $counter.text().split(' ');
            counter[0] = left;
            $counter.text(counter.join(' '));
            build();
          }
        });
      };
      build();
    });

    return $container;
  };

  /**
   * Generic table class with useful helpers.
   *
   * @param {Object} classes to use for styling
   * @param {Array} cols headers
   */
  H5PUtils.Table = function (classes, cols) {
    // Create basic table
    var tableOptions = {};
    if (classes.table !== undefined) {
      tableOptions['class'] = classes.table;
    }
    var $table = $('<table/>', tableOptions);
    var $thead = $('<thead/>').appendTo($table);
    var $tfoot = $('<tfoot/>').appendTo($table);
    var $tbody = $('<tbody/>').appendTo($table);

    // Set cols - create header
    var $tr = $('<tr/>').appendTo($thead);
    for (var i = 0; i < cols.length; i++) {
      $('<th>', {
        html: cols[i]
      }).appendTo($tr);
    }

    /**
     * Public.
     *
     * @param {Array} rows with cols
     */
    this.setRows = function (rows) {
      var $newTbody = $('<tbody/>');

      for (var i = 0; i < rows.length; i++) {
        var $tr = $('<tr/>').appendTo($newTbody);

        for (var j = 0; j < rows[i].length; j++) {
          $('<td>', {
            html: rows[i][j]
          }).appendTo($tr);
        }
      }

      $tbody.replaceWith($newTbody);
      $tbody = $newTbody;
    };

    /**
     * Public.
     *
     * @param {jQuery} $content custom
     */
    this.setBody = function ($content) {
      var $newTbody = $('<tbody/>');
      var $tr = $('<tr/>').appendTo($newTbody);
      $('<td>', {
        colspan: cols.length
      }).append($content).appendTo($tr);
      $tbody.replaceWith($newTbody);
      $tbody = $newTbody;
    };

    /**
     * Public.
     *
     * @param {jQuery} $content custom
     */
    this.setFoot = function ($content) {
      var $newTfoot = $('<tfoot/>');
      var $tr = $('<tr/>').appendTo($newTfoot);
      $('<td>', {
        colspan: cols.length
      }).append($content).appendTo($tr);
      $tfoot.replaceWith($newTfoot);
    };


    /**
     * Public.
     *
     * @param {jQuery} $container
     */
    this.appendTo = function ($container) {
      $table.appendTo($container);
    };
  };

  /**
   * Generic pagination class.
   *
   * @param {Number} num total items
   * @param {Number} limit items per page
   * @param {Function} goneTo page callback
   */
  H5PUtils.Pagination = function (num, limit, goneTo, l10n) {
    var current = 0;
    var pages = Math.ceil(num / limit);

    // Create components

    // Previous button
    var $left = $('<button/>', {
      html: '&lt;',
      'class': 'button',
      title: l10n.previousPage
    }).click(function () {
      goTo(current - 1);
    });

    // Current page text
    var $text = $('<span/>').click(function () {
      $input.width($text.width()).show().val(current + 1).focus();
      $text.hide();
    });

    // Jump to page input
    var $input = $('<input/>', {
      type: 'number',
      min : 1,
      max: pages,
      on: {
        'blur': function () {
          gotInput();
        },
        'keyup': function (event) {
          if (event.keyCode === 13) {
            gotInput();
            return false;
          }
        }
      }
    }).hide();

    // Next button
    var $right = $('<button/>', {
      html: '&gt;',
      'class': 'button',
      title: l10n.nextPage
    }).click(function () {
      goTo(current + 1);
    });

    /**
     * Private. Input box value may have changed.
     */
    var gotInput = function () {
      var page = parseInt($input.hide().val());
      if (!isNaN(page)) {
        goTo(page - 1);
      }
      $text.show();
    };

    /**
     * Private. Update UI elements.
     */
    var updateUI = function () {
      var next = current + 1;

      // Disable or enable buttons
      $left.attr('disabled', current === 0);
      $right.attr('disabled', next === pages);

      // Update counter
      $text.html(l10n.currentPage.replace('$current', next).replace('$total', pages));
    };

    /**
     * Private. Try to go to the requested page.
     *
     * @param {Number} page
     */
    var goTo = function (page) {
      if (page === current || page < 0 || page >= pages) {
        return; // Invalid page number
      }
      current = page;

      updateUI();

      // Fire callback
      goneTo(page * limit);
    };

    /**
     * Public. Update number of items and limit.
     *
     * @param {Number} newNum
     * @param {Number} newLimit
     */
    this.update = function (newNum, newLimit) {
      if (newNum !== num || newLimit !== limit) {
        // Update num and limit
        num = newNum;
        limit = newLimit;
        pages = Math.ceil(num / limit);
        $input.attr('max', pages);

        if (current >= pages) {
          // Content is gone, move to last page.
          goTo(pages - 1);
          return;
        }

        updateUI();
      }
    };

    /**
     * Public. Append the pagination widget to the given item.
     *
     * @param {jQuery} $container
     */
    this.appendTo = function ($container) {
      $left.add($text).add($input).add($right).appendTo($container);
    };

    // Update UI
    updateUI();
  };

})(H5P.jQuery);
