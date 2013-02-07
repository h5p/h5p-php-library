window.H5P = window.H5P || {};

//
// Initialize H5P content
// Scans for ".h5p-content"
H5P.init = function () {
  H5P.jQuery(".h5p-content").each(function (idx, el) {
    var $el = H5P.jQuery(el);
    var contentId = $el.data('content-id');
    var obj = new (H5P.classFromName($el.data('class')))(H5P.jQuery.parseJSON(H5PIntegration.getJsonContent(contentId)), contentId);
    obj.attach($el);
  });
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

  if (typeof(x) == 'object') {
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

// Play a video. $target is jQuery object to attach video to. (Appended).
// Params are video-params from content. cp is content path. onEnded is
// function to call when finished.
//
// TODO: Try to get rid of content path.
H5P.playVideo = function ($target, params, cp, onEnded) {
  var $ = H5P.jQuery;

  var $container = $('<div class="video-container"></div>').css({
    position: "absolute",
    top: "0px",
    left: "0px",
    "z-index": "500"
  });
  var $video;
  var sources = '';
  for (var key in params) {
    sources += '<source src="' + cp + params[key] + '" type="' + key + '">';
  }
  // TODO: Width/height from somewhere.
  // TODO: Embed media player fallback for IE.
  $video = $('<video width="635" height="500">' + sources + '</video>');
  if ($video[0].canPlayType === undefined) {
    // Video is not supported. Skip to result page.
    onEnded();
    return;
  }
  // $video[0].autoplay = false;
  // $video[0].load();
  $container.append($video);

  if (params.skippable) {
    var text = params.skipButtonText ? params.skipButtonText : "Skip video";
    var $skipButton = $('<a class="button skip">' + text + '</a>').click(function (ev) {
      $container.remove();
      onEnded();
    });
    $container.append($skipButton);
  }

  // Finally, append to target.
  $target.append($container);
  $video.on('ended', function(ev) {
    // On animation finished:
    $container.remove();
    onEnded();
  });
  // Press play on tape!
  $video[0].play();
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
