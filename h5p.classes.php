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

  public function __construct($h5pFramework) {
    $this->h5pF = $h5pFramework;
  }

  public function validatePackage() {
    // Requires PEAR
    require_once 'Archive/Tar.php';

    // Create a temporary dir to extract package in.
    $tmp_dir = $this->h5pFramework->getTempDir();
    $tmp_path = $this->h5pFramework->getTempPath();

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
    $tars = scandir($tmp_dir);
    for ($i = 2, $s = count($tars); $i < $s; $i++) {
      if (substr($tars[$i], -4) == '.tar') {
        $tar_file = $tmp_dir . DIRECTORY_SEPARATOR . $tars[$i];
        $tar_name = substr($tars[$i], 0, -4);
        $tar_id = md5_file($tar_file);
        $tar_time = filemtime($tar_file);

        $content_path = $files_path . DIRECTORY_SEPARATOR . $tar_id;

        // Extract content to our files dir.
        if (is_dir($content_path)) {
          continue; // We already have this content/library.
        }

        mkdir($content_path);
        $tar = new Archive_Tar($tar_file);
        if (!$tar->extract($content_path)) {
          continue; // Wasn't a valid tar file.
        }

        if (preg_match('/[^a-z0-9\-]/', $tar_name)) {
          $this->setErrorMessage($this->t('Invalid name: %name', array('%name' => $tar_name)));
          $this->rRmdir($content_path);
          continue;
        }

        // Go to extracted stuff and check it.
        $json = file_get_contents($content_path . DIRECTORY_SEPARATOR . 'index.js');
        if (!$json) {
          $this->setErrorMessage($this->t('Could not find index.js file: %name', array('%name' => $tar_name)));
          $this->rRmdir($content_path);
          continue;
        }

        $content = json_decode($json);
        if (!$content) {
          $this->setErrorMessage($this->t('Invalid index.js file format: %name', array('%name' => $tar_name)));
          $this->rRmdir($content_path);
          continue;
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
