<?php
/**
 * Verifies H5PValidator::isValidPackage skips zip directory records
 * (names ending in /) instead of treating them as files with no extension.
 *
 * This repository has no unit-test runner. Execute with:
 *   php tests/H5PValidatorDirectoryRecordsTest.php
 */

require_once dirname(__DIR__) . '/h5p.classes.php';

class H5PDirectoryRecordsFrameworkStub {
  public $errors = array();
  public $folder;
  public $path;

  public function setErrorMessage($message, $code = NULL) {
    $this->errors[] = array(
      'message' => $message,
      'code' => $code,
    );
  }

  public function setInfoMessage($message) {}

  public function t($message, $replacements = array()) {
    return strtr($message, $replacements);
  }

  public function getUploadedH5pFolderPath() {
    return $this->folder;
  }

  public function getUploadedH5pPath() {
    return $this->path;
  }

  public function getWhitelist($isLibrary, $defaultContentWhitelist, $defaultLibraryWhitelist) {
    return $isLibrary ? $defaultContentWhitelist . ' ' . $defaultLibraryWhitelist : $defaultContentWhitelist;
  }

  public function getLibraryId($machineName, $majorVersion = NULL, $minorVersion = NULL) {
    return FALSE;
  }

  public function libraryHasUpgrade($library) {
    return FALSE;
  }
}

class H5PDirectoryRecordsFileStorageStub {
  public function saveFileFromZip($path, $file, $stream) {
    $filePath = $path . '/' . $file;
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
      mkdir($dir, 0777, TRUE);
    }
    return file_put_contents($filePath, $stream);
  }
}

class H5PDirectoryRecordsCoreStub {
  public $disableFileCheck;
  public $maxFileSize;
  public $maxTotalSize;
  public $fs;
  public $librariesJsonData;
  public $mainJsonData;
  public $contentJsonData;

  public function mayUpdateLibraries() {
    return TRUE;
  }

  public function getLibraryId($library, $libString = NULL) {
    return FALSE;
  }
}

function h5pDirectoryRecordsJson() {
  $h5p = json_encode(array(
    'title' => 'Test',
    'language' => 'en',
    'mainLibrary' => 'Mylib',
    'embedTypes' => array('div'),
    'preloadedDependencies' => array(
      array(
        'machineName' => 'Mylib',
        'majorVersion' => 1,
        'minorVersion' => 0,
      ),
    ),
  ));
  $library = json_encode(array(
    'title' => 'Mylib',
    'machineName' => 'Mylib',
    'majorVersion' => 1,
    'minorVersion' => 0,
    'patchVersion' => 0,
    'runnable' => 1,
  ));
  return array($h5p, $library);
}

function h5pDirectoryRecordsWritePackage($path, $includeDirs, $extraFiles = array()) {
  list($h5p, $library) = h5pDirectoryRecordsJson();
  if (file_exists($path)) {
    unlink($path);
  }
  $zip = new ZipArchive();
  if ($zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== TRUE) {
    fwrite(STDERR, "FAIL: Unable to create test package $path\n");
    exit(1);
  }
  $zip->addFromString('h5p.json', $h5p);
  if ($includeDirs) {
    $zip->addEmptyDir('content');
    $zip->addEmptyDir('Mylib');
  }
  $zip->addFromString('content/content.json', '{}');
  $zip->addFromString('Mylib/library.json', $library);
  $zip->addFromString('Mylib/semantics.json', '[]');
  foreach ($extraFiles as $name => $contents) {
    $zip->addFromString($name, $contents);
  }
  $names = array();
  for ($i = 0; $i < $zip->numFiles; $i++) {
    $names[] = $zip->statIndex($i)['name'];
  }
  $zip->close();
  return $names;
}

function h5pDirectoryRecordsValidate($folder, $path) {
  if (is_dir($folder)) {
    H5PCore::deleteFileTree($folder);
  }
  mkdir($folder, 0777, TRUE);

  $framework = new H5PDirectoryRecordsFrameworkStub();
  $framework->folder = $folder;
  $framework->path = $path;
  $core = new H5PDirectoryRecordsCoreStub();
  $core->fs = new H5PDirectoryRecordsFileStorageStub();
  $validator = new H5PValidator($framework, $core);
  $valid = $validator->isValidPackage();
  return array($valid, $framework->errors);
}

function h5pDirectoryRecordsFail($message) {
  fwrite(STDERR, 'FAIL: ' . $message . "\n");
  exit(1);
}

function h5pDirectoryRecordsErrorSummary($errors) {
  $parts = array();
  foreach ($errors as $error) {
    $parts[] = $error['code'] . ': ' . $error['message'];
  }
  return implode(' | ', $parts);
}

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
  throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

$tmp = sys_get_temp_dir() . '/h5p-dir-records-' . getmypid();
$folder = $tmp . '/extract';
$path = $tmp . '/pkg.h5p';
mkdir($tmp, 0777, TRUE);

$names = h5pDirectoryRecordsWritePackage($path, TRUE);
if (!in_array('content/', $names, TRUE) || !in_array('Mylib/', $names, TRUE)) {
  h5pDirectoryRecordsFail('ZipArchive::addEmptyDir did not emit content/ and Mylib/ records. Names: ' . implode(', ', $names));
}

try {
  list($valid, $errors) = h5pDirectoryRecordsValidate($folder, $path);
}
catch (ErrorException $e) {
  h5pDirectoryRecordsFail($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
}

if ($valid !== TRUE) {
  h5pDirectoryRecordsFail('Package with zip directory records should be accepted. Errors: ' . h5pDirectoryRecordsErrorSummary($errors));
}

$names = h5pDirectoryRecordsWritePackage($path, FALSE);
foreach ($names as $name) {
  if (substr($name, -1) === '/') {
    h5pDirectoryRecordsFail('File-only package unexpectedly contains directory record ' . $name);
  }
}
list($valid, $errors) = h5pDirectoryRecordsValidate($folder, $path);
if ($valid !== TRUE) {
  h5pDirectoryRecordsFail('File-only package should still be accepted. Errors: ' . h5pDirectoryRecordsErrorSummary($errors));
}

$names = h5pDirectoryRecordsWritePackage($path, TRUE, array('Mylib/payload.exe' => 'MZ'));
list($valid, $errors) = h5pDirectoryRecordsValidate($folder, $path);
if ($valid !== FALSE) {
  h5pDirectoryRecordsFail('Package with a .exe library file should be rejected');
}
$codes = array();
foreach ($errors as $error) {
  $codes[] = $error['code'];
}
if (!in_array('not-in-whitelist', $codes, TRUE)) {
  h5pDirectoryRecordsFail('Disallowed .exe should be not-in-whitelist, got: ' . implode(', ', $codes));
}

H5PCore::deleteFileTree($tmp);

fwrite(STDOUT, "PASS: zip directory records skipped; file-only packages and disallowed extensions unchanged\n");
exit(0);
