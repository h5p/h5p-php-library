<?php

/**
 *
 */

namespace H5P;

/**
 *
 */
class DefaultStorage implements \H5P\FileStorage {
  private $path;

  /**
   * The great Constructor!
   */
  function __construct($path) {
    // Set H5P storage path
    $this->path = $path;

    // TODO: Check if Dirs are ready? Perhaps in each function?
  }

  /**
   * Store the library folder.
   *
   * @param array $library
   *  Library properties
   */
  public function saveLibrary($library) {
    $dest = $this->path . '/libraries/' . \H5PCore::libraryToString($library, TRUE);

    // Make sure destination dir doesn't exist
    \H5PCore::deleteFileTree($dest);

    // Move library folder
    self::copyFileTree($library['uploadDirectory'], $dest);
  }

  /**
   * Store the content folder.
   *
   * @param string $source
   *  Path on file system to content directory.
   * @param int $id
   *  What makes this content unique.
   */
  public function saveContent($source, $id) {
    self::copyFileTree($source, $this->path . '/content/' . $id);
  }

  /**
   * Remove content folder.
   *
   * @param int $id
   *  Content identifier
   */
  public function deleteContent($id) {
    // TODO
  }

  /**
   * Creates a stored copy of the content folder.
   *
   * @param string $id
   *  Identifier of content to clone.
   * @param int $newId
   *  The cloned content's identifier
   */
  public function cloneContent($id, $newId) {
    $path = $this->path . '/content/';
    self::copyFileTree($path . $id, $path . $newId);
  }

  /**
   * Get path to a new unique tmp folder.
   *
   * @return string
   *  Path
   */
  public function getTmpPath() {
    // TODO
  }

  /**
   * Fetch content folder and save in target directory.
   *
   * @param int $id
   *  Content identifier
   * @param string $target
   *  Where the content folder will be saved
   */
  public function exportContent($id, $target) {
    self::copyFileTree($this->path . '/content/' . $id, $target);
  }

  /**
   * Fetch library folder and save in target directory.
   *
   * @param array $library
   *  Library properties
   * @param string $target
   *  Where the library folder will be saved
   */
  public function exportLibrary($library, $target) {
    // TODO
  }

  /**
   * Save export in file system
   *
   * @param string $source
   *  Path on file system to temporary export file.
   * @param string $filename
   *  Name of export file.
   */
  public function saveExport($source, $filename) {
    // TODO
  }

  /**
   * Removes given export file
   *
   * @param string $filename
   */
  public function removeExport($filename) {
    // TODO
  }

  /**
   * Recursive function for copying directories.
   *
   * @param string $source
   *  From path
   * @param string $destination
   *  To path
   * @return boolean
   *  Indicates if the directory existed.
   */
  private static function copyFileTree($source, $destination) {
    if (!self::dirReady($destination)) {
      throw new \Exception('unabletocopy');
    }

    $dir = opendir($source);
    if ($dir === FALSE) {
      trigger_error('Unable to open directory ' . $source, E_USER_WARNING);
      throw new \Exception('unabletocopy');
    }

    while (false !== ($file = readdir($dir))) {
      if (($file != '.') && ($file != '..') && $file != '.git' && $file != '.gitignore') {
        if (is_dir($source . DIRECTORY_SEPARATOR . $file)) {
          self::copyFileTree($source . DIRECTORY_SEPARATOR . $file, $destination . DIRECTORY_SEPARATOR . $file);
        }
        else {
          copy($source . DIRECTORY_SEPARATOR . $file,$destination . DIRECTORY_SEPARATOR . $file);
        }
      }
    }
    closedir($dir);
  }

  /**
   * Recursive function that makes sure the specified directory exists and
   * is writable.
   *
   * @param string $path
   * @return bool
   */
  private static function dirReady($path) {
    if (!file_exists($path)) {
      $parent = preg_replace("/\/[^\/]+\/?$/", '', $path);
      if (!self::dirReady($parent)) {
        return FALSE;
      }

      mkdir($path, 0777, true);
    }

    if (!is_dir($path)) {
      trigger_error('Path is not a directory ' . $path, E_USER_WARNING);
      return FALSE;
    }

    if (!is_writable($path)) {
      trigger_error('Unable to write to ' . $path . ' – check directory permissions –', E_USER_WARNING);
      return FALSE;
    }

    return TRUE;
  }
}
