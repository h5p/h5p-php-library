/**
 * H5P.ContentType is a base class for all content types. Used by newRunnable()
 *
 * Functions here may be overridable by the libraries. In special cases,
 * it is also possible to override H5P.ContentType on a global level.
 * */
H5P.ContentType = function (standalone, library) {

  function ContentType() {};

  // Inherit from EventDispatcher.
  ContentType.prototype = new H5P.EventDispatcher();

  /**
   * Is library standalone or not? Not beeing standalone, means it is
   * included in another library
   *
   * @method isStandalone
   * @return {Boolean}
   */
  ContentType.prototype.isStandalone = function () {
    return standalone;
  };

  /**
   * Returns the file path of a file in the current library
   * @method getLibraryFilePath
   * @param  {string} filePath The path to the file relative to the library folder
   * @return {string} The full path to the file
   */
  ContentType.prototype.getLibraryFilePath = function (filePath) {
    var libraryObject = H5P.libraryFromString(library.library);
    return H5P.getLibraryPath(libraryObject.machineName + '-' + libraryObject.majorVersion + '.' + libraryObject.minorVersion) + '/' + filePath;
  };

  return ContentType;
};
