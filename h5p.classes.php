<?php
/**
 * Interface defining functions the h5p library needs the framework to implement
 */
interface H5PFrameworkInterface {
  /**
   * Show the user an error message
   * 
   * @param string $message
   *  The error message
   */
  public function setErrorMessage($message);
  
  /**
   * Show the user an information message
   * 
   * @param string $message
   *  The error message
   */
  public function setInfoMessage($message);

  /**
   * Translation function
   * 
   * @param string $message
   *  The english string to be translated. 
   * @param type $replacements
   *   An associative array of replacements to make after translation. Incidences
   *   of any key in this array are replaced with the corresponding value. Based
   *   on the first character of the key, the value is escaped and/or themed:
   *    - !variable: inserted as is
   *    - @variable: escape plain text to HTML
   *    - %variable: escape text and theme as a placeholder for user-submitted
   *      content
   * @return string Translated string
   */
  public function t($message, $replacements = array());
  
  /**
   * Get the Path to the last uploaded h5p
   * 
   * @return string Path to the folder where the last uploaded h5p for this session is located.
   */
  public function getUploadedH5pFolderPath();
  
  /**
   * @return string Path to the folder where all h5p files are stored
   */
  public function getH5pPath();
  
  /**
   * Get the path to the last uploaded h5p file
   * 
   * @return string Path to the last uploaded h5p
   */
  public function getUploadedH5pPath();
  
  /**
   * Get id to an excisting library
   * 
   * @param string $machineName
   *  The librarys machine name
   * @param int $majorVersion
   *  The librarys major version
   * @param int $minorVersion
   *  The librarys minor version
   * @return int
   *  The id of the specified library or FALSE
   */
  public function getLibraryId($machineName, $majorVersion, $minorVersion);
  
  /**
   * Is the library a patched version of an excisting library?
   * 
   * @param object $library
   *  The library data for a library we are checking
   * @return boolean
   *  TRUE if the library is a patched version of an excisting library
   *  FALSE otherwise
   */
  public function isPatchedLibrary($library);
  
  /**
   * Store data about a library
   * 
   * Also fills in the libraryId in the libraryData object if the object is new
   * 
   * @param object $libraryData
   *  Object holding the information that is to be stored
   */
  public function saveLibraryData(&$libraryData);
  
  /**
   * Stores contentData
   * 
   * @param int $contentId
   *  Framework specific id identifying the content
   * @param string $contentJson
   *  The content data that is to be stored
   * @param array $mainJsonData
   *  The data extracted from the h5p.json file
   * @param int $contentMainId
   *  Any contentMainId defined by the framework, for instance to support revisioning
   */
  public function saveContentData($contentId, $contentJson, $mainJsonData, $mainLibraryId, $contentMainId = NULL);
  
  /**
   * Save what libraries a library is dependending on
   * 
   * @param int $libraryId
   *  Library Id for the library we're saving dependencies for
   * @param array $dependencies
   *  List of dependencies in the format used in library.json
   * @param string $dependency_type
   *  What type of dependency this is, for instance it might be an editor dependency
   */
  public function saveLibraryDependencies($libraryId, $dependencies, $dependency_type);

  /**
   * Copies library usage
   *
   * @param int $contentId
   *  Framework specific id identifying the content
   * @param int $copyFromId
   *  Framework specific id identifying the content to be copied
   * @param int $contentMainId
   *  Framework specific main id for the content, typically used in frameworks
   *  That supports versioning. (In this case the content id will typically be
   *  the version id, and the contentMainId will be the frameworks content id
   */
  public function copyLibraryUsage($contentId, $copyFromId, $contentMainId = NULL);

  /**
   * Deletes content data
   *
   * @param int $contentId
   *  Framework specific id identifying the content
   */
  public function deleteContentData($contentId);

  /**
   * Delete what libraries a content item is using
   * 
   * @param int $contentId
   *  Content Id of the content we'll be deleting library usage for
   */
  public function deleteLibraryUsage($contentId);
  
  /**
   * Saves what libraries the content uses
   *
   * @param int $contentId
   *  Framework specific id identifying the content
   * @param array $librariesInUse
   *  List of libraries the content uses. Libraries consist of arrays with:
   *   - libraryId stored in $librariesInUse[<place>]['library']['libraryId']
   *   - libraryId stored in $librariesInUse[<place>]['preloaded']
   */
  public function saveLibraryUsage($contentId, $librariesInUse);


  /**
   * Loads a library
   *
   * @param string $machineName
   * @param int $majorVersion
   * @param int $minorVersion
   * @return array|FALSE
   *  Array representing the library with dependency descriptions
   *  FALSE if the library doesn't exist
   */
  public function loadLibrary($machineName, $majorVersion, $minorVersion);

  /**
   * Delete all dependencies belonging to given library
   *
   * @param int $libraryId
   *  Library Id
   */
  public function deleteLibraryDependencies($libraryId);
}

/**
 * This class is used for validating H5P files
 */
class H5PValidator {
  public $h5pF;
  public $h5pC;

  // Schemas used to validate the h5p files
  private $h5pRequired = array(
    'title' => '/^.{1,255}$/',
    'language' => '/^[a-z]{1,5}$/',
    'preloadedDependencies' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'mainLibrary' => '/^[$a-z_][0-9a-z_\.$]{1,254}$/i',
    'embedTypes' => array('iframe', 'div'),
  );

  private $h5pOptional = array(
    'contentType' => '/^.{1,255}$/',
    'description' => '/^.{1,}$/',
    'author' => '/^.{1,255}$/',
    'license' => '/^(cc-by|cc-by-sa|cc-by-nd|cc-by-nc|cc-by-nc-sa|cc-by-nc-nd|pd|cr|MIT)$/',
    'dynamicDependencies' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'externalResources' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
      'url' => '/^http:\/\/[a-z_\-\.0-9]+\.[a-z]{2, 10}$/i',
      'type' => '/^(css|js)$/',
    ),
    'w' => '/^[0-9]{1,4}$/',
    'h' => '/^[0-9]{1,4}$/',
    'metaKeywords' => '/^.{1,}$/',
    'metaDescription' => '/^.{1,}$/k',
  );

  // Schemas used to validate the library files
  private $libraryRequired = array(
    'title' => '/^.{1,255}$/',
    'majorVersion' => '/^[0-9]{1,5}$/',
    'minorVersion' => '/^[0-9]{1,5}$/',
    'patchVersion' => '/^[0-9]{1,5}$/',
    'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
    'runnable' => '/^(0|1)$/',
  );

  private $libraryOptional  = array(
    'author' => '/^.{1,255}$/',
    'license' => '/^(cc-by|cc-by-sa|cc-by-nd|cc-by-nc|cc-by-nc-sa|cc-by-nc-nd|pd|cr|MIT)$/',
    'description' => '/^.{1,}$/',
    'dynamicDependencies' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'preloadedDependencies' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'editorDependencies' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'externalResources' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
      'url' => '/^http:\/\/[a-z_\-\.0-9]+\.[a-z]{2, 10}$/i',
      'type' => '/^(css|js)$/',
    ),
    'preloadedJs' => array(
      'path' => '/^((\\\|\/)?[a-z_\-\s0-9\.]+)+\.js$/i',
    ),
    'preloadedCss' => array(
      'path' => '/^((\\\|\/)?[a-z_\-\s0-9\.]+)+\.css$/i',
    ),
    'dropLibraryCss' => array(
      'machineName' => '/^[\w0-9\-\.]{1,255}$/i',
    ),
    'w' => '/^[0-9]{1,4}$/',
    'h' => '/^[0-9]{1,4}$/',
    'embedTypes' => array('iframe', 'div'),
    'fullscreen' => '/^(0|1)$/',
  );

  /**
   * Constructor for the H5PValidator
   *
   * @param object $H5PFramework
   *  The frameworks implementation of the H5PFrameworkInterface
   */
  public function __construct($H5PFramework, $H5PCore) {
    $this->h5pF = $H5PFramework;
    $this->h5pC = $H5PCore;
  }

  /**
   * Validates a .h5p file
   *
   * @return boolean
   *  TRUE if the .h5p file is valid
   */
  public function isValidPackage() {
    // Create a temporary dir to extract package in.
    $tmp_dir = $this->h5pF->getUploadedH5pFolderPath();
    $tmp_path = $this->h5pF->getUploadedH5pPath();

    $valid = TRUE;

    // Extract and then remove the package file.
    $zip = new ZipArchive;
    if ($zip->open($tmp_path) === true) {
      $zip->extractTo($tmp_dir);
      $zip->close();
    }
    else {
      $this->h5pF->setErrorMessage($this->h5pF->t('The file you uploaded is not a valid HTML5 Package.'));
      $this->h5pC->delTree($tmp_dir);
      return;
    }
    unlink($tmp_path);

    // Process content and libraries
    $libraries = array();
    $files = scandir($tmp_dir);
    $mainH5pData;
    $libraryJsonData;
    $mainH5pExists = $imageExists = $contentExists = FALSE;
    foreach ($files as $file) {
      if (in_array(substr($file, 0, 1), array('.', '_'))) {
        continue;
      }
      $file_path = $tmp_dir . DIRECTORY_SEPARATOR . $file;
      // Check for h5p.json file.
      if (strtolower($file) == 'h5p.json') {
        $mainH5pData = $this->getJsonData($file_path);
        if ($mainH5pData === FALSE) {
          $valid = FALSE;
          $this->h5pF->setErrorMessage($this->h5pF->t('Could not find or parse the main h5p.json file'));
        }
        else {
          $validH5p = $this->isValidH5pData($mainH5pData, $file, $this->h5pRequired, $this->h5pOptional);
          if ($validH5p) {
            $mainH5pExists = TRUE;
          }
          else {
            $valid = FALSE;
            $this->h5pF->setErrorMessage($this->h5pF->t('Could not find or parse the main h5p.json file'));
          }
        }
      }
      // Check for h5p.jpg?
      elseif (strtolower($file) == 'h5p.jpg') {
        $imageExists = TRUE;
      }
      // Content directory holds content.
      elseif ($file == 'content') {
        if (!is_dir($file_path)) {
          $this->h5pF->setErrorMessage($this->h5pF->t('Invalid content folder'));
          $valid = FALSE;
          continue;
        }
        $contentJsonData = $this->getJsonData($file_path . DIRECTORY_SEPARATOR . 'content.json');
        if ($contentJsonData === FALSE) {
          $this->h5pF->setErrorMessage($this->h5pF->t('Could not find or parse the content.json file'));
          $valid = FALSE;
          continue;
        }
        else {
          $contentExists = TRUE;
          // In the future we might let the librarys provide validation functions for content.json
        }
      }

      // The rest should be library folders
      else {
         if (!is_dir($file_path)) {
          // Ignore this. Probably a file that shouldn't have been included.
          continue;
        }
        if (preg_match('/^[\w0-9\-\.]{1,255}$/i', $file) === 0) {
          $this->h5pF->setErrorMessage($this->h5pF->t('Invalid library name: %name', array('%name' => $file)));
          $valid = FALSE;
          continue;
        }
        $h5pData = $this->getJsonData($file_path . DIRECTORY_SEPARATOR . 'library.json');
        if ($h5pData === FALSE) {
          $this->h5pF->setErrorMessage($this->h5pF->t('Could not find library.json file with valid json format for library %name', array('%name' => $file)));
          $valid = FALSE;
          continue;
        }

        // validate json if a semantics file is provided
        $semanticsPath = $file_path . DIRECTORY_SEPARATOR . 'semantics.json';
        if (file_exists($semanticsPath)) {
          $semantics = $this->getJsonData($semanticsPath, TRUE);
          if ($semantics === FALSE) {
            $this->h5pF->setErrorMessage($this->h5pF->t('Invalid semantics.json file has been included in the library %name', array('%name' => $file)));
            $valid = FALSE;
            continue;
          }
          else {
            $h5pData['semantics'] = $semantics;
          }
        }
        
        $validLibrary = $this->isValidH5pData($h5pData, $file, $this->libraryRequired, $this->libraryOptional);

        if (isset($h5pData['preloadedJs'])) {
          $validLibrary = $this->isExistingFiles($h5pData['preloadedJs'], $tmp_dir, $file) && $validLibrary;
        }
        if (isset($h5pData['preloadedCss'])) {
          $validLibrary = $this->isExistingFiles($h5pData['preloadedCss'], $tmp_dir, $file) && $validLibrary;
        }
        if ($validLibrary) {
          $libraries[$file] = $h5pData;
        }
        $valid = $validLibrary && $valid;
      }
    }
    if (!$contentExists) {
      $this->h5pF->setErrorMessage($this->h5pF->t('A valid content folder is missing'));
      $valid = FALSE;
    }
    if (!$mainH5pExists) {
      $this->h5pF->setErrorMessage($this->h5pF->t('A valid main h5p.json file is missing'));
      $valid = FALSE;
    }
    if ($valid) {
      $this->h5pC->librariesJsonData = $libraries;
      $this->h5pC->mainJsonData = $mainH5pData;
      $this->h5pC->contentJsonData = $contentJsonData;
      
      $libraries['mainH5pData'] = $mainH5pData; // Check for the dependencies in h5p.json as well as in the libraries
      $missingLibraries = $this->getMissingLibraries($libraries);
      foreach ($missingLibraries as $missing) {
        if ($this->h5pF->getLibraryId($missing['machineName'], $missing['majorVersion'], $missing['minorVersion'])) {
          unset($missingLibraries[$missing['machineName']]);
        }
      }
      if (!empty($missingLibraries)) {
        foreach ($missingLibraries as $library) {
          $this->h5pF->setErrorMessage($this->h5pF->t('Missing required library @library', array('@library' => $this->h5pC->libraryToString($library))));
        }
      }
      $valid = empty($missingLibraries) && $valid;
    }
    if (!$valid) {
      $this->h5pC->delTree($tmp_dir);
    }
    return $valid;
  }

  /**
   * Use the dependency declarations to find any missing libraries
   *
   * @param array $libraries
   *  A multidimensional array of libraries keyed with machineName first and majorVersion second
   * @return array
   *  A list of libraries that are missing keyed with machineName and holds objects with
   *  machineName, majorVersion and minorVersion properties
   */
  private function getMissingLibraries($libraries) {
    $missing = array();
    foreach ($libraries as $library) {
      if (isset($library['preloadedDependencies'])) {
        $missing = array_merge($missing, $this->getMissingDependencies($library['preloadedDependencies'], $libraries));
      }
      if (isset($library['dynamicDependencies'])) {
        $missing = array_merge($missing, $this->getMissingDependencies($library['dynamicDependencies'], $libraries));
      }
      if (isset($library['editorDependencies'])) {
        $missing = array_merge($missing, $this->getMissingDependencies($library['editorDependencies'], $libraries));
      }
    }
    return $missing;
  }

  /**
   * Helper function for getMissingLibraries, searches for dependency required libraries in
   * the provided list of libraries
   *
   * @param array $dependencies
   *  A list of objects with machineName, majorVersion and minorVersion properties
   * @param array $libraries
   *  An array of libraries keyed with machineName
   * @return
   *  A list of libraries that are missing keyed with machineName and holds objects with
   *  machineName, majorVersion and minorVersion properties
   */
  private function getMissingDependencies($dependencies, $libraries) {
    $missing = array();
    foreach ($dependencies as $dependency) {
      if (isset($libraries[$dependency['machineName']])) {
        if (!$this->h5pC->isSameVersion($libraries[$dependency['machineName']], $dependency)) {
          $missing[$dependency['machineName']] = $dependency;
        }
      }
      else {
        $missing[$dependency['machineName']] = $dependency;
      }
    }
    return $missing;
  }

  /**
   * Figure out if the provided file paths exists
   *
   * Triggers error messages if files doesn't exist
   *
   * @param array $files
   *  List of file paths relative to $tmp_dir
   * @param string $tmp_dir
   *  Path to the directory where the $files are stored.
   * @param string $library
   *  Name of the library we are processing
   * @return boolean
   *  TRUE if all the files excists
   */
  private function isExistingFiles($files, $tmp_dir, $library) {
    foreach ($files as $file) {
      $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $file['path']);
      if (!file_exists($tmp_dir . DIRECTORY_SEPARATOR . $library . DIRECTORY_SEPARATOR . $path)) {
        $this->h5pF->setErrorMessage($this->h5pF->t('The file "%file" is missing from library: "%name"', array('%file' => $path, '%name' => $library)));
        return FALSE;
      }
    }
    return TRUE;
  }

  /**
   * Validates h5p.json and library.json data
   *
   * Error messages are triggered if the data isn't valid
   *
   * @param array $h5pData
   *  h5p data
   * @param string $library_name
   *  Name of the library we are processing
   * @param array $required
   *  Validation pattern for required properties
   * @param array $optional
   *  Validation pattern for optional properties
   * @return boolean
   *  TRUE if the $h5pData is valid
   */
  private function isValidH5pData($h5pData, $library_name, $required, $optional) {
    $valid = $this->isValidRequiredH5pData($h5pData, $required, $library_name);
    $valid = $this->isValidOptionalH5pData($h5pData, $optional, $library_name) && $valid;
    return $valid;
  }

  /**
   * Helper function for isValidH5pData
   *
   * Validates the optional part of the h5pData
   *
   * Triggers error messages
   *
   * @param array $h5pData
   *  h5p data
   * @param array $requirements
   *  Validation pattern
   * @param string $library_name
   *  Name of the library we are processing
   * @return boolean
   *  TRUE if the optional part of the $h5pData is valid
   */
  private function isValidOptionalH5pData($h5pData, $requirements, $library_name) {
    $valid = TRUE;

    foreach ($h5pData as $key => $value) {
      if (isset($requirements[$key])) {
        $valid = $this->isValidRequirement($value, $requirements[$key], $library_name, $key) && $valid;
      }
      // Else: ignore, a package can have parameters that this library doesn't care about, but that library
      // specific implementations does care about...
    }

    return $valid;
  }

  /**
   * Va(lidate a requirement given as regexp or an array of requirements
   *
   * @param mixed $h5pData
   *  The data to be validated
   * @param mixed $requirement
   *  The requirement the data is to be validated against, regexp or array of requirements
   * @param string $library_name
   *  Name of the library we are validating(used in error messages)
   * @param string $property_name
   *  Name of the property we are validating(used in error messages)
   * @return boolean
   *  TRUE if valid, FALSE if invalid
   */
  private function isValidRequirement($h5pData, $requirement, $library_name, $property_name) {
    $valid = TRUE;

    if (is_string($requirement)) {
      if ($requirement == 'boolean') {
        if (!is_bool($h5pData)) {
         $this->h5pF->setErrorMessage($this->h5pF->t("Invalid data provided for %property in %library. Boolean expected.", array('%property' => $property_name, '%library' => $library_name)));
         $valid = FALSE;
        }
      }
      else {
        // The requirement is a regexp, match it against the data
        if (is_string($h5pData) || is_int($h5pData)) {
          if (preg_match($requirement, $h5pData) === 0) {
             $this->h5pF->setErrorMessage($this->h5pF->t("Invalid data provided for %property in %library", array('%property' => $property_name, '%library' => $library_name)));
             $valid = FALSE;
          }
        }
        else {
          $this->h5pF->setErrorMessage($this->h5pF->t("Invalid data provided for %property in %library", array('%property' => $property_name, '%library' => $library_name)));
          $valid = FALSE;
        }
      }
    }
    elseif (is_array($requirement)) {
      // We have sub requirements
      if (is_array($h5pData)) {
        if (is_array(current($h5pData))) {
          foreach ($h5pData as $sub_h5pData) {
            $valid = $this->isValidRequiredH5pData($sub_h5pData, $requirement, $library_name) && $valid;
          }
        }
        else {
          $valid = $this->isValidRequiredH5pData($h5pData, $requirement, $library_name) && $valid;
        }
      }
      else {
        $this->h5pF->setErrorMessage($this->h5pF->t("Invalid data provided for %property in %library", array('%property' => $property_name, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    else {
      $this->h5pF->setErrorMessage($this->h5pF->t("Can't read the property %property in %library", array('%property' => $property_name, '%library' => $library_name)));
      $valid = FALSE;
    }
    return $valid;
  }

  /**
   * Validates the required h5p data in libraray.json and h5p.json
   * 
   * @param mixed $h5pData
   *  Data to be validated
   * @param array $requirements
   *  Array with regexp to validate the data against
   * @param string $library_name
   *  Name of the library we are validating (used in error messages)
   * @return boolean
   *  TRUE if all the required data exists and is valid, FALSE otherwise
   */
  private function isValidRequiredH5pData($h5pData, $requirements, $library_name) {
    $valid = TRUE;
    foreach ($requirements as $required => $requirement) {
      if (is_int($required)) {
        // We have an array of allowed options
        return $this->isValidH5pDataOptions($h5pData, $requirements, $library_name);
      }
      if (isset($h5pData[$required])) {
        $valid = $this->isValidRequirement($h5pData[$required], $requirement, $library_name, $required) && $valid;
      }
      else {
        $this->h5pF->setErrorMessage($this->h5pF->t('The required property %property is missing from %library', array('%property' => $required, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    return $valid;
  }

  /**
   * Validates h5p data against a set of allowed values(options)
   * 
   * @param array $selected
   *  The option(s) that has been specified
   * @param array $allowed
   *  The allowed options
   * @param string $library_name
   *  Name of the library we are validating (used in error messages)
   * @return boolean
   *  TRUE if the specified data is valid, FALSE otherwise
   */
  private function isValidH5pDataOptions($selected, $allowed, $library_name) {
    $valid = TRUE;
    foreach ($selected as $value) {
      if (!in_array($value, $allowed)) {
        $this->h5pF->setErrorMessage($this->h5pF->t('Illegal option %option in %library', array('%option' => $value, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    return $valid;
  }

  /**
   * Fetch json data from file
   * 
   * @param string $file_path
   *  Path to the file holding the json string
   * @param boolean $return_as_string
   *  If true the json data will be decoded in order to validate it, but will be
   *  returned as string
   * @return mixed
   *  FALSE if the file can't be read or the contents can't be decoded
   *  string if the $return as string parameter is set
   *  array otherwise
   */
  private function getJsonData($file_path, $return_as_string = FALSE) {
    $json = file_get_contents($file_path);
    if (!$json) {
      return FALSE;
    }
    $jsonData = json_decode($json, TRUE);
    if (!$jsonData) {
      return FALSE;
    }
    return $return_as_string ? $json : $jsonData;
  }

  /**
   * Helper function that copies an array
   * 
   * @param array $array
   *  The array to be copied
   * @return array
   *  Copy of $array. All objects are cloned
   */
  private function arrayCopy(array $array) {
    $result = array();
    foreach ($array as $key => $val) {
      if (is_array($val)) {
        $result[$key] = arrayCopy($val);
      }
      elseif (is_object($val)) {
        $result[$key] = clone $val;
      }
      else {
        $result[$key] = $val;
      }
    }
    return $result;
  }
}

/**
 * This class is used for saving H5P files
 */
class H5PStorage {
  
  public $h5pF;
  public $h5pC;

  /**
   * Constructor for the H5PStorage
   *
   * @param object $H5PFramework
   *  The frameworks implementation of the H5PFrameworkInterface
   */
  public function __construct($H5PFramework, $H5PCore) {
    $this->h5pF = $H5PFramework;
    $this->h5pC = $H5PCore;
  }
  
  /**
   * Saves a H5P file
   * 
   * @param int $contentId
   *  The id of the content we are saving
   * @param int $contentMainId
   *  The main id for the content we are saving. This is used if the framework
   *  we're integrating with uses content id's and version id's
   */
  public function savePackage($contentId, $contentMainId = NULL) {
    // Save the libraries we processed during validation
    foreach ($this->h5pC->librariesJsonData as $key => &$library) {
      $libraryId = $this->h5pF->getLibraryId($key, $library['majorVersion'], $library['minorVersion']);
      $library['saveDependencies'] = TRUE;
      if (!$libraryId) {
        $new = TRUE;
      }
      elseif ($this->h5pF->isPatchedLibrary($library)) {
        $new = FALSE;
        $library['libraryId'] = $libraryId;
      }
      else {
        $library['libraryId'] = $libraryId;
        // We already have the same or a newer version of this library
        $library['saveDependencies'] = FALSE;
        continue;
      }
      $this->h5pF->saveLibraryData($library, $new);
      
      $current_path = $this->h5pF->getUploadedH5pFolderPath() . DIRECTORY_SEPARATOR . $key;
      $destination_path = $this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'libraries' . DIRECTORY_SEPARATOR . $this->h5pC->libraryToString($library, TRUE);
      $this->h5pC->delTree($destination_path);
      rename($current_path, $destination_path);
    }

    foreach ($this->h5pC->librariesJsonData as $key => &$library) {
      if ($library['saveDependencies']) {
        $this->h5pF->deleteLibraryDependencies($library['libraryId']);
        if (isset($library['preloadedDependencies'])) {
          $this->h5pF->saveLibraryDependencies($library['libraryId'], $library['preloadedDependencies'], 'preloaded');
        }
        if (isset($library['dynamicDependencies'])) {
          $this->h5pF->saveLibraryDependencies($library['libraryId'], $library['dynamicDependencies'], 'dynamic');
        }
        if (isset($library['editorDependencies'])) {
          $this->h5pF->saveLibraryDependencies($library['libraryId'], $library['editorDependencies'], 'editor');
        }
      }
    }
    // Move the content folder
    $current_path = $this->h5pF->getUploadedH5pFolderPath() . DIRECTORY_SEPARATOR . 'content';
    $destination_path = $this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . $contentId;
    rename($current_path, $destination_path);

    // Save what libraries is beeing used by this package/content
    $librariesInUse = array();
    $this->getLibraryUsage($librariesInUse, $this->h5pC->mainJsonData);
    $this->h5pF->saveLibraryUsage($contentId, $librariesInUse);
    $this->h5pC->delTree($this->h5pF->getUploadedH5pFolderPath());
    
    // Save the data in content.json
    $contentJson = file_get_contents($destination_path . DIRECTORY_SEPARATOR . 'content.json');
    $mainLibraryId = $librariesInUse[$this->h5pC->mainJsonData['mainLibrary']]['library']['libraryId'];
    $this->h5pF->saveContentData($contentId, $contentJson, $this->h5pC->mainJsonData, $mainLibraryId, $contentMainId);
  }

  /**
   * Delete an H5P package
   * 
   * @param int $contentId
   *  The content id
   */
  public function deletePackage($contentId) {
    $this->h5pC->delTree($this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . $contentId);
    $this->h5pF->deleteContentData($contentId);
  }

  /**
   * Update an H5P package
   * 
   * @param int $contentId
   *  The content id
   * @param int $contentMainId
   *  The content main id (used by frameworks supporting revisioning)
   */
  public function updatePackage($contentId, $contentMainId = NULL) {
    $this->deletePackage($contentId);
    $this->savePackage($contentId, $contentMainId);
  }

  /**
   * Copy/clone an H5P package
   * 
   * May for instance be used if the content is beeing revisioned without
   * uploading a new H5P package
   * 
   * @param int $contentId
   *  The new content id
   * @param int $copyFromId
   *  The content id of the content that should be cloned
   * @param int $contentMainId
   *  The main id of the new content (used in frameworks that support revisioning)
   */
  public function copyPackage($contentId, $copyFromId, $contentMainId = NULL) {
    $source_path = $this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . $copyFromId;
    $destination_path = $this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . $contentId;
    $this->h5pC->copyTree($source_path, $destination_path);

    $this->h5pF->copyLibraryUsage($contentId, $copyFromId, $contentMainId);
  }

  /**
   * Identify what libraries are beeing used taking all dependencies into account
   * 
   * @param array $librariesInUse
   *  List of libraries in use, indexed by machineName
   * @param array $jsonData
   *  library.json og h5p.json data holding dependency information
   * @param boolean $dynamic
   *  Whether or not the current library is a dynamic dependency
   */
  public function getLibraryUsage(&$librariesInUse, $jsonData, $dynamic = FALSE) {
    if (isset($jsonData['preloadedDependencies'])) {
      foreach ($jsonData['preloadedDependencies'] as $preloadedDependency) {
        $library = $this->h5pF->loadLibrary($preloadedDependency['machineName'], $preloadedDependency['majorVersion'], $preloadedDependency['minorVersion']);
        $librariesInUse[$preloadedDependency['machineName']] = array(
          'library' => $library,
          'preloaded' => $dynamic ? 0 : 1,
        );
        $this->getLibraryUsage($librariesInUse, $library, $dynamic);
      }
    }
    if (isset($jsonData['dynamicDependencies'])) {
      foreach ($jsonData['dynamicDependencies'] as $dynamicDependency) {
        if (!isset($librariesInUse[$dynamicDependency['machineName']])) {
          $library = $this->h5pF->loadLibrary($dynamicDependency['machineName'], $dynamicDependency['majorVersion'], $dynamicDependency['minorVersion']);
          $librariesInUse[$dynamicDependency['machineName']] = array(
            'library' => $library,
            'preloaded' => 0,
          );
        }
        $this->getLibraryUsage($librariesInUse, $library, TRUE);
      }
    }
  }
}

/**
 * Functions and storage shared by the other H5P classes
 */
class H5PCore {
  
  public static $styles = array(
    'styles/h5p.css',
  );
  public static $scripts = array(
    'js/jquery.js',
    'js/h5p.js',
    'js/flowplayer-3.2.12.min.js',
  );
  
  public $h5pF;
  public $librariesJsonData;
  public $contentJsonData;
  public $mainJsonData;

  /**
   * Constructor for the H5PCore
   *
   * @param object $H5PFramework
   *  The frameworks implementation of the H5PFrameworkInterface
   */
  public function __construct($H5PFramework) {
    $this->h5pF = $H5PFramework;
  }
  
  /**
   * Check if a library is of the version we're looking for
   * 
   * Same verision means that the majorVersion and minorVersion is the same
   * 
   * @param array $library
   *  Data from library.json
   * @param array $dependency
   *  Definition of what library we're looking for
   * @return boolean
   *  TRUE if the library is the same version as the dependency
   *  FALSE otherwise
   */
  public function isSameVersion($library, $dependency) {
    if ($library['majorVersion'] != $dependency['majorVersion']) {
      return FALSE;
    }
    if ($library['minorVersion'] != $dependency['minorVersion']) {
      return FALSE;
    }
    return TRUE;
  }

  /**
   * Recursive function for removing directories.
   *
   * @param string $dir
   *  Path to the directory we'll be deleting
   * @return boolean
   *  Indicates if the directory existed.
   */
  public function delTree($dir) {
    if (!is_dir($dir)) {
      return;
    }
    $files = array_diff(scandir($dir), array('.','..'));
    foreach ($files as $file) {
      (is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file");
    }
    return rmdir($dir);
  }

  /**
   * Recursive function for copying directories.
   *
   * @param string $source
   *  Path to the directory we'll be copying
   * @return boolean
   *  Indicates if the directory existed.
   */
  public function copyTree($source, $destination) {
    $dir = opendir($source);
    @mkdir($destination);
    while (false !== ($file = readdir($dir))) {
        if (($file != '.') && ($file != '..')) {
            if (is_dir($source . '/' . $file)) {
              $this->copyTree($source . '/' . $file, $destination . '/' . $file);
            }
            else {
              copy($source . '/' . $file,$destination . '/' . $file);
            }
        }
    }
    closedir($dir);
  }

  /**
   * Writes library data as string on the form {machineName} {majorVersion}.{minorVersion}
   *
   * @param array $library
   *  With keys machineName, majorVersion and minorVersion
   * @return string
   *  On the form {machineName} {majorVersion}.{minorVersion}
   */
  public function libraryToString($library, $folderName = FALSE) {
    return $library['machineName'] . ($folderName ? '-' : ' ') . $library['majorVersion'] . '.' . $library['minorVersion'];
  }
}
?>