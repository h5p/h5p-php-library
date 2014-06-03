(function ($) {
  var info, outData, $container, $throbber, throbberText, majorVersion, minorVersion;

  /**
   * Generate html for version select.
   *  
   * @param {Object} versions
   * @returns {String}
   */
  var getVersionSelect = function (versions) {
    var html = '';
    for (var id in versions) {
      html += '<option value="' + id + '">' + versions[id] + '</option>';
    }
    if (html !== '') {
      html = '<select>' + html + '</select>';
      return html;
    }
  };
  
  /**
   * Process the current batch of parameters.
   * 
   * @param {Object} params
   */
  var processParameters = function (inData) {
    var upgraded = {};
    
    var i = 0;
    for (var id in inData.params) {
      if (!inData.params.hasOwnProperty(id)) {
        continue;
      }
      
      var param = JSON.parse(inData.params[id]);
      for (var major in H5PUpgrades) {
        if (!H5PUpgrades.hasOwnProperty(major) || major < info.majorVersion || major > majorVersion) {
          continue;
        }
        
        for (var minor in H5PUpgrades[major]) {
          if (!H5PUpgrades[major].hasOwnProperty(major) || minor <= info.minorVersion || minor > minorVersion) {
            continue;
          }

          param = H5PUpgrades[major][minor](param);
        }
      }
      upgraded[id] = JSON.stringify(param);
      
      i++;
      $throbber.text(throbberText + Math.round((info.total - inData.left + i) / (info.total / 100)) + ' %') ;
    }
    
    outData.params = JSON.stringify(upgraded);
    outData.token = inData.token;

    // Get next round of data to process.
    getParameters();
  };
  
  /**
   * Handles errors while processing parameters.
   * 
   * @param {Object} params
   */
  var process = function (inData) {
    // Script is loaded. Start processing.
    try {
      processParameters(inData);
    }
    catch (err) {
      $container.html('An error occurred while processing parameters: ' + err);
    }
  };

  /**
   * Get the next batch of parameters.
   */
  var getParameters = function () {
    $.post(info.url, outData, function (inData) {
      if (!(inData instanceof Object)) {
        // Print errors from backend
        $container.html(inData);
        return;
      } 
      if (inData.left === '0') {
        $container.html(info.done);
        return;
      }
      
      if (inData.script !== undefined) {
        $.ajax({
          dataType: 'script',
          cache: true,
          url: inData.script
        }).done(function () {
          // Start processing
          process(inData);
        }).fail(function () {
          $container.html('Error: Could not load upgrade script.');
        });
        return;
      }
      
      // Continue processing
      process(inData);
    });
  };

  // Initialize
  $(document).ready(function () {
    // Get library info
    info = H5PIntegration.getLibraryInfo();
    
    // Get and reset container
    $container = $('#h5p-admin-container').html('<p>' + info.message + '</p>');
    
    // Make it possible to select version
    var $version = $(getVersionSelect(info.versions)).appendTo($container);
    
    // Add "go" button
    $('<button/>', {
      class: 'h5p-admin-upgrade-button',
      text: info.buttonLabel,
      click: function () {
        outData = {
          libraryId: $version.val(),
          token: info.token
        };
        
        // Get version
        var version = info.versions[outData.libraryId];
        var versionLevels = version.split('.', 3);
        majorVersion = versionLevels[0];
        minorVersion = versionLevels[1];
        
        throbberText = 'Upgrading to ' + version + '...';
        $throbber = H5PUtils.throbber(throbberText);
        $container.html('').append($throbber);
        
        // Start upgrade progress
        getParameters();
      }
    }).appendTo($container);
  });  
})(H5P.jQuery);