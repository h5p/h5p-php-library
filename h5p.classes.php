<?php

interface h5pFramework {
  public function setErrorMessage($message);
  public function setInfoMessage($message);
  public function t($message, $replacements = array());
  public function getUploadedH5pFolderPath();
  public function getH5pPath();
  public function getUploadedH5pPath();
  public function getLibraryId($machineName, $majorVersion, $minorVersion);
  public function isPatchedLibrary($library);
  public function storeLibraryData(&$libraryData);
  public function storeContentData($contentId, $contentJson, $mainJsonData, $contentMainId = NULL);
  public function deleteContentData($contentId);
  public function saveLibraryUsage($contentId, $librariesInUse);
  public function loadLibrary($machineName, $majorVersion, $minorVersion);
}

class h5pValidator {
  public $h5pF;
  public $h5pC;
  
  // Schemas used to validate the h5p files
  private $h5pRequired = array(
    'title' => '/^.{1,255}$/',
    'language' => '/^[a-z]{1,5}$/',
    'preloadedDependencies' => array(
      'machineName' => '/^[a-z0-9\-]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'init' => '/^[$a-z_][0-9a-z_\.$]{1,254}$/i',
    'embedTypes' => array('iframe', 'div'),
  );
  
  private $h5pOptional = array(
    'contentType' => '/^.{1,255}$/',
    'description' => '/^.{1,}$/',
    'author' => '/^.{1,255}$/',
    'license' => '/^(cc-by|cc-by-sa|cc-by-nd|cc-by-nc|cc-by-nc-sa|cc-by-nc-nd|pd|cr)$/',
    'dynamicDependencies' => array(
      'machineName' => '/^[a-z0-9\-]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'w' => '/^[0-9]{1,4}$/',
    'h' => '/^[0-9]{1,4}$/',
    'metaKeywords' => '/^.{1,}$/',
    'metaDescription' => '/^.{1,}$/k',
  );

  
  private $libraryRequired = array(
    'title' => '/^.{1,255}$/',
    'majorVersion' => '/^[0-9]{1,5}$/',
    'minorVersion' => '/^[0-9]{1,5}$/',
    'patchVersion' => '/^[0-9]{1,5}$/',
    'machineName' => '/^[a-z0-9\-]{1,255}$/i',
  );
  
  private $libraryOptional  = array(
    'init' => '/^[$a-z_][0-9a-z_\.$]{1,254}$/i',
    'author' => '/^.{1,255}$/',
    'license' => '/^(cc-by|cc-by-sa|cc-by-nd|cc-by-nc|cc-by-nc-sa|cc-by-nc-nd|pd|cr)$/',
    'description' => '/^.{1,}$/',
    'dynamicDependencies' => array(
      'machineName' => '/^[a-z0-9\-]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),    
    'preloadedDependencies' => array(
      'machineName' => '/^[a-z0-9\-]{1,255}$/i',
      'majorVersion' => '/^[0-9]{1,5}$/',
      'minorVersion' => '/^[0-9]{1,5}$/',
    ),
    'preloadedJs' => array(
      'path' => '/^((\\\|\/)?[a-z_\-\s0-9]+)+\.js$/i',
    ),
    'preloadedCss' => array(
      'path' => '/^((\\\|\/)?[a-z_\-\s0-9]+)+\.css$/i',
    ),
    'w' => '/^[0-9]{1,4}$/',
    'h' => '/^[0-9]{1,4}$/',
    'embedTypes' => array('iframe', 'div'),
  );

  /**
   * Constructor for the h5pValidator
   *
   * @param object $h5pFramework
   *  The frameworks implementation of the h5pFramework interface
   */
  public function __construct($h5pFramework, $h5pCore) {
    $this->h5pF = $h5pFramework;
    $this->h5pC = $h5pCore;
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
      $this->h5pF->setErrorMessage($this->h5pF->t('The file you uploaded is not a valid HTML5 Pack.'));
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
      if (in_array($file, array('.', '..'))) {
        continue;
      }
      $file_path = $tmp_dir . DIRECTORY_SEPARATOR . $file;
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

      elseif (strtolower($file) == 'h5p.jpg') {
        $imageExists = TRUE;
      }
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
      
      elseif (strpos($file, '.') !== FALSE) {
        // Illegal file fond. This is ignored.
        continue;
      }

      else {
         if (!is_dir($file_path)) {
          $this->h5pF->setErrorMessage($this->h5pF->t('Invalid library folder: %name', array('%name' => $file)));
          $valid = FALSE;
          continue;
        }
        if (preg_match('/^[a-z0-9\-]{1,255}$/i', $file) === 0) {
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
        
        $validLibrary = $this->isValidH5pData($h5pData, $file, $this->libraryRequired, $this->libraryOptional);

        if (isset($h5pData['preloadedJs'])) {
          $validLibrary = $this->isExcistingFiles($h5pData['preloadedJs'], $tmp_dir, $file) && $validLibrary;
        }
        if (isset($h5pData['preloadedCss'])) {
          $validLibrary = $this->isExcistingFiles($h5pData['preloadedCss'], $tmp_dir, $file) && $validLibrary;
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
      
      $libraries['mainH5pData'] = $mainH5pData;
      $missingLibraries = $this->getMissingLibraries($libraries);
      foreach ($missingLibraries as $missing) {
        if ($this->h5pF->getLibraryId($missing['machineName'], $missing['majorVersion'], $missing['minorVersion'])) {
          unset($missingLibraries[$missing['machineName']]);
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
        array_merge($missing, $this->getMissingDependencies($library['preloadedDependencies'], $libraries));
      }
      if (isset($library['dynamicDependencies'])) {
        array_merge($missing, $this->getMissingDependencies($library['dynamicDependencies'], $libraries));
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
  private function isExcistingFiles($files, $tmp_dir, $library) {
    foreach ($files as $file) {
      $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $file['path']);
      if (!file_exists($tmp_dir . DIRECTORY_SEPARATOR . $library . DIRECTORY_SEPARATOR . $path)) {
        $this->h5pF->setErrorMessage($this->h5pF->t('The JS file %file is missing from library: %name', array('%file' => $file_path, '%name' => $library)));
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
   * 
   *
   * @param <type> $h5pData
   * @param <type> $requirement
   * @param <type> $library_name
   * @param <type> $property_name
   * @return boolean 
   */
  private function isValidRequirement($h5pData, $requirement, $library_name, $property_name) {
    $valid = TRUE;

    if (is_string($requirement)) {
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

  private function getJsonData($file_path) {
    $json = file_get_contents($file_path);
    if (!$json) {
      return FALSE;
    }
    $jsonData = json_decode($json, TRUE);
    if (!$jsonData) {
      return FALSE;
    }
    return $jsonData;
  }

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

class h5pSaver {
  
  public $h5pF;
  public $h5pC;

  /**
   * Constructor for the h5pSaver
   *
   * @param object $h5pFramework
   *  The frameworks implementation of the h5pFramework interface
   */
  public function __construct($h5pFramework, $h5pCore) {
    $this->h5pF = $h5pFramework;
    $this->h5pC = $h5pCore;
  }
  
  public function savePackage($contentId, $contentMainId = NULL) {
    foreach ($this->h5pC->librariesJsonData as $key => &$library) {
      $libraryId = $this->h5pF->getLibraryId($key, $library['majorVersion'], $library['minorVersion']);
      if (!$libraryId) {
        $new = TRUE;
      }
      elseif ($this->h5pF->isPatchedLibrary($library)) {
        $new = FALSE;
        $library['libraryId'] = $libraryId;
      }
      else {
        // We already have the same or a newer version of this library
        continue;
      }
      $this->h5pF->storeLibraryData($library, $new);
      
      $current_path = $this->h5pF->getUploadedH5pFolderPath() . DIRECTORY_SEPARATOR . $key;
      $destination_path = $this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'libraries' . DIRECTORY_SEPARATOR . $library['libraryId'];
      $this->h5pC->delTree($destination_path);
      rename($current_path, $destination_path);
    }
    $current_path = $this->h5pF->getUploadedH5pFolderPath() . DIRECTORY_SEPARATOR . 'content';
    $destination_path = $this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . $contentId;
    rename($current_path, $destination_path);
    
    $contentJson = file_get_contents($destination_path . DIRECTORY_SEPARATOR . 'content.json');
    $this->h5pF->storeContentData($contentId, $contentJson, $this->h5pC->mainJsonData, $contentMainId);

    $librariesInUse = array();
    $this->getLibraryUsage($librariesInUse, $this->h5pC->mainJsonData);
    $this->h5pF->saveLibraryUsage($contentId, $librariesInUse);
    $this->h5pC->delTree($this->h5pF->getUploadedH5pFolderPath());
  }

  public function deletePackage($contentId) {
    $this->h5pC->delTree($this->h5pF->getH5pPath() . DIRECTORY_SEPARATOR . 'content' . DIRECTORY_SEPARATOR . $contentId);
    $this->h5pF->deleteContentData($contentId);
  }

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

class h5pCore {
  public $h5pF;
  public $librariesJsonData;
  public $contentJsonData;
  public $mainJsonData;

  /**
   * Constructor for the h5pSaver
   *
   * @param object $h5pFramework
   *  The frameworks implementation of the h5pFramework interface
   */
  public function __construct($h5pFramework) {
    $this->h5pF = $h5pFramework;
  }
  
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
   * @param string $dir Directory.
   * @return boolean Indicates if the directory existed.
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
}
?>