<?php
class H5PRequirements {

  // Set warning threshold (32 MB)
  const UPLOAD_SIZE_WARNING_THRESHOLD = 33554432;

  public static function validatePrerequisites() {
    $results = array();
    // Need mbstring
    if (!extension_loaded('mbstring')) {
      $results[] = (Object)array (
        'mandatory' => true,
        'message' => 'H5 need the mbstring php extension',
        'url' => 'https://h5p.org/h5p-php-core-prerequisites#mbstring'
      );
    }

    if (!class_exists('ZipArchive')) {
      $results[] = (Object)array (
        'mandatory' => true,
        'message' => 'Your PHP version does not support ZipArchive',
        'url' => 'https://h5p.org/h5p-php-core-prerequisites#ziparchive'
      );
    }

    // Check upload sizes:
    $maxFileUploadSize = self::getMaxFileUploadSize();
    if ($maxFileUploadSize < self::UPLOAD_SIZE_WARNING_THRESHOLD) {
      $results[] = (Object)array (
        'mandatory' => false,
        'message' => "Your webserver's file upload settings makes it impossible to upload files larger than {$maxFileUploadSize} bytes. This might be a problem when trying to upload e.g. video files",
        'url' => 'https://h5p.org/h5p-php-core-prerequisites#fileuploadsize'
      );
    }

    // Other things to check might be:
    // - php version
    // - possible to run http get/post from server to h5p.org?
    // - extension_loaded('openssl') ?

    return $results;
  }

  private static function getMaxFileUploadSize () {
    $max_upload = self::humanSizeTobytes(ini_get('upload_max_filesize'));
    //select post limit
    $max_post = self::humanSizeTobytes(ini_get('post_max_size'));
    //select memory limit
    $memory_limit = self::humanSizeTobytes(ini_get('memory_limit'));
    // return the smallest of them, this defines the real limit
    return min($max_upload, $max_post, $memory_limit);
  }

  private static function humanSizeTobytes($val) {
    $val = trim($val);
    $last = strtolower($val[strlen($val)-1]);
    switch($last)
    {
      case 'g':
      $val *= 1024;
      case 'm':
      $val *= 1024;
      case 'k':
      $val *= 1024;
    }
    return $val;
  }
}
