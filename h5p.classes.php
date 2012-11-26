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
    'title' => '^.{1,255}$',
    'mainVersion' => '^[0-9]{1,5}$',
    'language' => '^[a-z]{1,5}$',
    'machineName' => '^[a-z0-9\-]{1,255}$',
    'preloadedDependencies' => array(
      'machineName' => '^[a-z0-9\-]{1,255}$',
      'minimumVersion' => '^[0-9]{1,5}$',
    ),
    'init' => '^[$A-Z_][0-9A-Z_\.$]{1,254}$',
    'embedTypes' => array('iframe', 'div'),
  );
  
  private $h5pOptional = array(
    'contentType' => '^.{1,255}$',
    'utilization' => '^.{1,}$',
    'subVersion' => '^[0-9]{1,5}$',
    'author' => '^.{1,255}$',
    'lisence' => '^(iframe|div)$',
    'dynamicDependencies' => array(
      'machineName' => '^[a-z0-9\-]{1,255}$',
      'minimumVersion' => '^[0-9]{1,5}$',
    ),
    'preloadedJs' => '^(\\[a-z_\-\s0-9\.]+)+\.(?i)(js)$',
    'preloadedCss' => '^(\\[a-z_\-\s0-9\.]+)+\.(?i)(js)$',
    'w' => '^[0-9]{1,4}$',
    'h' => '^[0-9]{1,4}$',
    'metaKeywords' => '^.{1,}$',
    'metaDescription' => '^.{1,}$',
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

    // Extract and then remove the package file.
    $tar = new Archive_Tar($tmp_path, 'bz2');
    if (!$tar->extract($tmp_dir)) {
      $this->setErrorMessage($this->t('The file you uploaded is not a valid HTML5 Pack.'));
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
        // TODO: Validate content
      }
      
      elseif (strpos($file, '.') !== FALSE) {
        // Illegal file fond. This is ignored.
        continue;
      }

      else {
        if (preg_match('/[^a-z0-9\-]/', $file)) {
          $this->setErrorMessage($this->t('Invalid library name: %name', array('%name' => $file)));
          $this->rRmdir($content_path);
          continue;
        }
        $json = file_get_contents($file_path . DIRECTORY_SEPARATOR . 'h5p.json');
        if (!$json) {
          $this->setErrorMessage($this->t('Could not find h5p.json file: %name', array('%name' => $file)));
          $this->rRmdir($file_path);
          continue;
        }
        $h5pData = json_decode($json);
        if (!$h5pData) {
          $this->setErrorMessage($this->t('Invalid h5p.json file format: %name', array('%name' => $file)));
          $this->rRmdir($file_path);
          continue;
        }
        $errors = $this->validateH5pData($h5pData);
        if ($errors !== FALSE) {
          // TODO: Print the (themed) errors
          return;
        }
        
        if (isset($h5pData->preloadedJs)) {
          if (!$this->isExcistingFiles($h5pData->preloadedJs, $tmp_dir, $file)) {
            // TODO: Handle the fact that we are missing js files
          }
        }
        if (isset($h5pData->preloadedCss)) {
          if (!$this->isExcistingFiles($h5pData->preloadedCss, $tmp_dir, $file)) {
            // TODO: Handle the fact that we are missing js files
          }
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
        $this->setErrorMessage($this->t('The JS file %file is missing from library: %name', array('%file' => $file_path, '%name' => $library)));
        $this->rRmdir($tmp_dir);
        return FALSE;
      }
    }
    return TRUE;
  }
  
  private function validateH5pData($h5pData) {
    // TODO: Use the validation arrays
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
