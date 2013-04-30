var H5P = H5P || {};

//
// Initialize H5P content
// Scans for ".h5p-content"
H5P.init = function () {
  if (H5P.$window === undefined) {
    H5P.$window = H5P.jQuery(window);
  }
  if (H5P.$body === undefined) {
    H5P.$body = H5P.jQuery('body');
  }

  if (H5P.fullScreenBrowserPrefix === undefined) {
    if (document.cancelFullScreen) {
      H5P.fullScreenBrowserPrefix = '';
    }
    else if (document.webkitCancelFullScreen) {
      H5P.fullScreenBrowserPrefix = 'webkit';
    }
    else if (document.mozCancelFullScreen) {
      H5P.fullScreenBrowserPrefix = 'moz';
    }
    else if (document.msCancelFullScreen) {
      H5P.fullScreenBrowserPrefix = 'ms';
    }
  }

  H5P.jQuery(".h5p-content").each(function (idx, el) {
    var $el = H5P.jQuery(el);
    var contentId = $el.data('content-id');
    var obj = new (H5P.classFromName($el.data('class')))(H5P.jQuery.parseJSON(H5PIntegration.getJsonContent(contentId)), contentId);
    obj.attach($el);

    if (H5PIntegration.getFullscreen(contentId)) {
      H5P.jQuery('<div class="h5p-content-controls"><a href="#" class="h5p-enable-fullscreen">' + H5PIntegration.fullscreenText + '</a><div>').insertBefore($el).children().click(function () {
        H5P.fullScreen($el, obj);
        return false;
      });
    }
  });
};

/**
 * Enable full screen for the given h5p.
 *
 * @param {jQuery} $el Container
 * @param {object} obj H5P
 * @returns {undefined}
 */
H5P.fullScreen = function ($el, obj) {
  if (H5P.fullScreenBrowserPrefix === undefined) {
    // Create semi fullscreen.
    $el.add(H5P.$body).addClass('h5p-semi-fullscreen');
    var $disable = H5P.jQuery('<a href="#" class="h5p-disable-fullscreen">Disable fullscreen</a>').appendTo($el);
    var keyup, disableSemiFullscreen = function () {
      $el.add(H5P.$body).removeClass('h5p-semi-fullscreen');
      $disable.remove();
      H5P.$body.unbind('keyup', keyup);

      if (obj.resize !== undefined) {
        obj.resize(false);
      }

      return false;
    };
    keyup = function (event) {
      if (event.keyCode === 27) {
        disableSemiFullscreen();
      }
    };
    $disable.click(disableSemiFullscreen);
    H5P.$body.keyup(keyup);
  }
  else {
    var first, eventName = H5P.fullScreenBrowserPrefix + 'fullscreenchange';
    document.addEventListener(eventName, function () {
      if (first === undefined) {
        first = false;
        return;
      }
      $el.add(H5P.$body).removeClass('h5p-fullscreen');
      document.removeEventListener(eventName, arguments.callee, false);
    });

    if (H5P.fullScreenBrowserPrefix === '') {
      $el[0].requestFullScreen();
    }
    else {
      $el[0][H5P.fullScreenBrowserPrefix + 'RequestFullScreen']();
    }

    $el.add(H5P.$body).addClass('h5p-fullscreen');
  }

  if (obj.resize !== undefined) {
    obj.resize(true);
  }
};

H5P.getContentPath = function(contentId) {
  // TODO: Rewrite or remove... H5P.getContentPath = H5PIntegration.getContentPath would probably work f.i.
  return H5PIntegration.getContentPath(contentId);
};

//
// Used from libraries to construct instances of other libraries' objects by
// name.
//
H5P.classFromName = function(name) {
  var arr = name.split(".");
  return this[arr[arr.length-1]];
};

// Helper object for keeping coordinates in the same format all over.
H5P.Coords = function(x, y, w, h) {
  if ( !(this instanceof H5P.Coords) )
    return new H5P.Coords(x, y, w, h);

  this.x = 0;
  this.y = 0;
  this.w = 1;
  this.h = 1;

  if (typeof(x) === 'object') {
    this.x = x.x;
    this.y = x.y;
    this.w = x.w;
    this.h = x.h;
  } else {
    if (x !== undefined) {
      this.x = x;
    }
    if (y !== undefined) {
      this.y = y;
    }
    if (w !== undefined) {
      this.w = w;
    }
    if (h !== undefined) {
      this.h = h;
    }
  }
  return this;
};

/**
 *@param {string} library
 *  library in the format machineName majorVersion.minorVersion
 * @returns
 *  library as an object with machineName, majorVersion and minorVersion properties
 *  return false if the library parameter is invalid
 */
H5P.libraryFromString = function (library) {
  var regExp = /(.+)\s(\d)+\.(\d)$/g;
  var res = regExp.exec(library);
  if (res !== null) {
    return {
      'machineName': res[1],
      'majorVersion': res[2],
      'minorVersion': res[3]
    };
  }
  else {
    return false;
  }
};

/**
 * Recursivly clone the given object.
 *
 * @param {object} object Object to clone.
 * @param {type} recursive
 * @returns {object} A clone of object.
 */
H5P.cloneObject = function (object, recursive, array) {
  var clone = array !== undefined && array ? [] : {};

  for (var i in object) {
    if (object.hasOwnProperty(i)) {
      if (recursive !== undefined && recursive && typeof object[i] === 'object') {
        clone[i] = H5P.cloneObject(object[i], recursive, object[i] instanceof Array);
      }
      else {
        clone[i] = object[i];
      }
    }
  }

  return clone;
};

/**
 * Remove all empty spaces before and after the value.
 *
 * @param {String} value
 * @returns {@exp;value@call;replace}
 */
H5P.trim = function (value) {
  return value.replace(/^\s+|\s+$/g, '');
};

// We have several situations where we want to shuffle an array, extend array
// to do so.
Array.prototype.shuffle = function() {
  var i = this.length, j, tempi, tempj;
  if ( i === 0 ) return false;
  while ( --i ) {
    j       = Math.floor( Math.random() * ( i + 1 ) );
    tempi   = this[i];
    tempj   = this[j];
    this[i] = tempj;
    this[j] = tempi;
  }
  return this;
};

// Add indexOf to browsers that lack them. (IEs)
if(!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(needle) {
    for(var i = 0; i < this.length; i++) {
      if(this[i] === needle) {
        return i;
      }
    }
    return -1;
  };
}

// Simple 'contains' function. Easier to use than keep testing indexOf to -1.
Array.prototype.contains = function (needle) {
  return (this.indexOf(needle) > -1);
};

// Finally, we want to run init when document is ready.
H5P.jQuery(document).ready(function(){
  H5P.init();
});