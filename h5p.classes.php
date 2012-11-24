<?php
interface h5pFramework {
  public function setErrorMessage($message);
  public function setInfoMessage($message);
  public function t($message, $replacements);
  public function getUploadedH5pDir();
  public function getTempPath();
  public function getUploadedH5pPath();
}

class h5p {
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
        // TODO: Validate library
        if (preg_match('/[^a-z0-9\-]/', $file)) {
          $this->setErrorMessage($this->t('Invalid name: %name', array('%name' => $file)));
          $this->rRmdir($content_path);
          continue;
        }
        $json = file_get_contents($file_path . DIRECTORY_SEPARATOR . 'h5p.json');
        if (!$json) {
          $this->setErrorMessage($this->t('Could not find h5p.json file: %name', array('%name' => $file)));
          $this->rRmdir($file_path);
          continue;
        }
        $content = json_decode($json);
        if (!$content) {
          $this->setErrorMessage($this->t('Invalid h5p.json file format: %name', array('%name' => $file)));
          $this->rRmdir($file_path);
          continue;
        }
        // We have decoded the json! Check for required properties
        
      }

        if ($content->type != H5P_CONTENT && $content->type != H5P_LIBRARY) {
          $this->setErrorMessage($this->t('Invalid content type: %name', array('%name' => $tar_name)));
          $this->rRmdir($content_path);
          continue;
        }

        if ($content->type == H5P_CONTENT) {
          if (!isset($content->options)) {
            $this->setErrorMessage($this->t('Missing start options: %name', array('%name' => $tar_name)));
            $this->rRmdir($content_path);
            continue;
          }
          if (!isset($content->class)) {
            $this->setErrorMessage($this->t('Missing start class: %name', array('%name' => $tar_name)));
            $this->rRmdir($content_path);
            continue;
          }
          if (preg_match('/^[A-Z][A-Za-z0-9]*$/', $content->class)) {
            $this->setErrorMessage($this->t('Invalid class name: %name', array('%name' => $content->class)));
            $this->rRmdir($content_path);
            continue;
          }
          $content->options = json_encode($content->options);
        }
        else {
          if (!isset($content->js) || !empty($content->js)) {
            $this->setErrorMessage($this->t('Library without any JS files: %name', array('%name' => $tar_name)));
            $this->rRmdir($content_path);
            continue;
          }

          // Check if JS files exist.
          for ($j = 0, $l = count($content->js); $j < $l; $j++) {
            $content->js[$j] = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $content->js[$j]);
            if (!file_exists($content_path . DIRECTORY_SEPARATOR . $content->js[$j])) {
              $this->setErrorMessage($this->t('The JS file %file is missing from library: %name', array('%file' => $content->js[$j], '%name' => $tar_name)));
              $this->rRmdir($content_path);
              continue;
            }
          }

          // Check if CSS files exist.
          for ($j = 0, $l = count($content->css); $j < $l; $j++) {
            $content->css[$j] = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $content->css[$j]);
            if (!file_exists($content_path . DIRECTORY_SEPARATOR . $content->css[$j])) {
              $this->setErrorMessage($this->t('The CSS file %file is missing from library: %name', array('%file' => $content->css[$j], '%name' => $tar_name)));
              $this->rRmdir($content_path);
              continue;
            }
          }
        }

        $content->id = $tar_id;
        $content->name = $tar_name;
        $content->time = $tar_time;

        $contents[$content->id] = $content;
      }
    }
    

    $this->rRmdir($tmp_dir);

    foreach ($contents as &$content) {
      if ($content->type == H5P_CONTENT) {
        // Check dependencies for content
        $name = strtolower(preg_replace('/.+([A-Z])/', '-$0', $content->class));
        $missing_dependencies = h5p_find_missing_dependencies($contents, $name);
        if ($missing_dependencies) {
          $this->setErrorMessage($this->t('%name is missing the following dependencies: %dependencies', array('%name' => $content->name, '%dependencies' => implode(',', $missing_dependencies))));
        }
        else {
          // TODO: Insert stuff?
          // TODO: Insert into database
          // TODO: Insert all files into files table.
        }
      }
    }

    // TODO: rmdir for libraries that doesn't have db records.
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
