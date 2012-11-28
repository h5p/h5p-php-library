<?php
interface h5pFramework {
  public function setErrorMessage($message);
  public function setInfoMessage($message);
  public function t($message, $replacements);
  public function getUploadedH5pDir();
  public function getTempPath();
  public function getUploadedH5pPath();
}

class h5pValidator {
  public $h5pF;
  
  // Schemas used to validate the h5p files
  private $h5pRequired = array(
    'title' => '/^.{1,255}$/',
    'mainVersion' => '/^[0-9]{1,5}$/',
    'language' => '/^[a-z]{1,5}$/',
    'machineName' => '/^[a-z0-9\-]{1,255}$/',
    'preloadedDependencies' => array(
      'machineName' => '/^[a-z0-9\-]{1,255}$/',
      'minimumVersion' => '/^[0-9]{1,5}$/',
    ),
    'init' => '/^[$a-z_][0-9a-z_\.$]{1,254}$/i',
    'embedTypes' => array('iframe', 'div'),
  );
  
  private $h5pOptional = array(
    'contentType' => '/^.{1,255}$/',
    'utilization' => '/^.{1,}$/',
    'subVersion' => '/^[0-9]{1,5}$/',
    'author' => '/^.{1,255}$/',
    'lisence' => '/^(iframe|div)$/',
    'dynamicDependencies' => array(
      'machineName' => '/^[a-z0-9\-]{1,255}$/',
      'minimumVersion' => '/^[0-9]{1,5}$/',
    ),
    'preloadedJs' => '/^(\\[a-z_\-\s0-9\.]+)+\.(?i)(js)$/',
    'preloadedCss' => '/^(\\[a-z_\-\s0-9\.]+)+\.(?i)(js)$/',
    'w' => '/^[0-9]{1,4}$/',
    'h' => '/^[0-9]{1,4}$/',
    'metaKeywords' => '/^.{1,}$/',
    'metaDescription' => '/^.{1,}$/k',
  );

  public function __construct($h5pFramework) {
    $this->h5pF = $h5pFramework;
  }

  public function validatePackage() {
    // Requires PEAR
    require_once 'Archive/Tar.php';

    // Create a temporary dir to extract package in.
    $tmp_dir = $this->h5pFramework->getUploadedH5pDir();
    $tmp_path = $this->h5pFramework->getUploadedH5pPath();

    $valid = TRUE;

    // Extract and then remove the package file.
    $tar = new Archive_Tar($tmp_path, 'bz2');
    if (!$tar->extract($tmp_dir)) {
      $this->h5pF->setErrorMessage($this->t('The file you uploaded is not a valid HTML5 Pack.'));
      $this->rRmdir($tmp_dir);
      return;
    }
    unlink($tmp_path);

    // Process content and libraries
    $contents = array();
    $files = scandir($tmp_dir);

    $json_exists = $image_exists = $content_exists = FALSE;
    foreach ($files as $file) {
      if (in_array($file, array('.', '..'))) {
        continue;
      }
      $file_path = $tmp_dir . DIRECTORY_SEPARATOR . $file;
      if (strtolower($file) == 'h5p.json') {
        $json_exists = TRUE;
      }

      elseif (strtolower($file) == 'h5p.jpg') {
        $image_exists = TRUE;
      }
      elseif ($file == 'content') {
        $content_exists = TRUE;
        $json = file_get_contents($file_path . DIRECTORY_SEPARATOR . 'content.json');
        if (!$json) {
          $this->h5pF->setErrorMessage($this->t('Could not find content.json file'));
          $valid = FALSE;
          continue;
        }
        $contentData = json_decode($json);
        if (!$contentData) {
          $this->h5pF->setErrorMessage('Invalid content.json file format. Json is required');
          $valid = FALSE;
          continue;
        }
        // In the future we might let the librarys provide validation functions for content.json
      }
      
      elseif (strpos($file, '.') !== FALSE) {
        // Illegal file fond. This is ignored.
        continue;
      }

      else {
        if (preg_match('/[^a-z0-9\-]/', $file) === 0) {
          $this->h5pF->setErrorMessage($this->t('Invalid library name: %name', array('%name' => $file)));
          $valid = FALSE;
          continue;
        }
        $json = file_get_contents($file_path . DIRECTORY_SEPARATOR . 'h5p.json');
        if (!$json) {
          $this->h5pF->setErrorMessage($this->t('Could not find h5p.json file: %name', array('%name' => $file)));
          $valid = FALSE;
          continue;
        }
        $h5pData = json_decode($json);
        if (!$h5pData) {
          $this->h5pF->setErrorMessage($this->t('Invalid h5p.json file format: %name', array('%name' => $file)));
          $valid = FALSE;
          continue;
        }
        $valid = $this->isValidH5pData($h5pData, $file) && $valid;
        
        if (isset($h5pData->preloadedJs)) {
          $valid = $this->isExcistingFiles($h5pData->preloadedJs, $tmp_dir, $file) && $valid;
        }
        if (isset($h5pData->preloadedCss)) {
          $valid = $this->isExcistingFiles($h5pData->preloadedCss, $tmp_dir, $file) && $valid;
        }
      }
      // TODO: Store library info in array
    }
    // TODO: Check dependencies
  }
  
  private function isExcistingFiles($files, $tmp_dir, $library) {
    foreach ($files as $file_path) {
      $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $file_path);
      if (!file_exists($tmp_dir . DIRECTORY_SEPARATOR . $path)) {
        $this->h5pF->setErrorMessage('The JS file %file is missing from library: %name', array('%file' => $file_path, '%name' => $library));
        return FALSE;
      }
    }
    return TRUE;
  }
  
  private function isValidH5pData($h5pData, $library_name) {
    $valid = $this->isValidRequiredH5pData($h5pData, $this->h5pRequired, $library_name);
    $valid = $this->isValidOptionalH5pData($h5pData, $this->h5pOptional, $library_name) && $valid;
    return $valid;
  }

  private function isValidOptionalH5pData($h5pData, $requirements, $library_name) {
    $valid = TRUE;

    foreach ($h5pData as $key => $value) {
      if (isset($requirements[$key])) {
        $valid = isValidRequirement($h5pData, $requirement, $library_name, $property_name) && $valid;
      }
      // Else: ignore, a package can have parameters that this library doesn't care about, but that library
      // specific implementations does care about...
    }

    return $valid;
  }

  private function isValidRequirement($h5pData, $requirement, $library_name, $property_name) {
    $valid = TRUE;

    if (is_string($requirement)) {
      // The requirement is a regexp, match it against the data
      if (is_string($h5pData)) {
        if (preg_match($requirement, $h5pData) === 0) {
           $this->h5pF->setErrorMessage($this->t("Ivalid data provided for %property in %library", array('%property' => $property_name, '%library' => $library_name)));
           $valid = FALSE;
        }
      }
      else {
        $this->h5pF->setErrorMessage($this->t("Ivalid data provided for %property in %library", array('%property' => $property_name, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    elseif (is_array($requirement)) {
      // We have sub requirements
      if (is_array($h5pData)) {
        $valid = $this->isValidRequiredH5pData($h5pData, $requirement, $library_name) && $valid;
      }
      else {
        $this->h5pF->setErrorMessage($this->t("Ivalid data provided for %property in %library", array('%property' => $property_name, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    else {
      $this->h5pF->setErrorMessage($this->t("Can't read the property %property in %library", array('%property' => $property_name, '%library' => $library_name)));
      $valid = FALSE;
    }
    return $valid;
  }

  private function isValidRequiredH5pData($h5pData, $requirements, $library_name) {
    $valid = TRUE;
    foreach ($requirements as $required => $requirement) {
      if (is_int($required)) {
        // We have an array of allowed options
        return isValidH5pDataOptions($h5pData, $requirements, $library_name);
      }
      if (isset($h5pData[$required])) {
        $valid = validateRequirement($h5pData[$required], $requirement, $library_name, $required) && $valid;
      }
      else {
        $this->h5pF->setErrorMessage($this->t('The required property %property is missing from %library', array('%property' => $required, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    return $valid;
  }

  private function isValidH5pDataOptions($selected, $allowed, $library_name) {
    $valid = TRUE;
    foreach ($selected as $value) {
      if (!in_array($value, $allowed)) {
        $this->h5pF->setErrorMessage($this->t('Illegal option %option in %library', array('%option' => $value, '%library' => $library_name)));
        $valid = FALSE;
      }
    }
    return $valid;
  }

  /**
   * Recursive function for removing directories.
   *
   * @param string $dir Directory.
   * @return boolean Indicates if the directory existed.
   */
  private function rRmdir($dir) {
     if (is_dir($dir)) {
       $files = scandir($dir);
       for ($i = 2, $s = count($files); $i < $s; $i++) {
         $file = $dir . DIRECTORY_SEPARATOR . $files[$i];
         if (!$this->rRmdir($file)) {
           unlink($file);
         }
       }
       rmdir($dir);
       return TRUE;
     }
     else {
       return FALSE;
     }
  }
}
?>
