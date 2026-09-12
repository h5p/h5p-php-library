<?php
/**
 * Verifies fetchLibrariesMetadata passes the library machine name to
 * setLibraryTutorialUrl.
 *
 * This repository has no unit-test runner. Execute with:
 *   php tests/FetchLibrariesMetadataTutorialUrlTest.php
 */

require_once dirname(__DIR__) . '/h5p.classes.php';

/**
 * Minimal framework double covering only the methods exercised by
 * fetchLibrariesMetadata when the site is already registered and usage
 * statistics are disabled.
 */
class H5PFetchLibrariesMetadataFrameworkStub {
  public $tutorialCalls = array();

  public function getPlatformInfo() {
    return array(
      'name' => 'test',
      'version' => '1.0',
      'h5pVersion' => '1.0',
    );
  }

  public function getOption($name, $default = NULL) {
    if ($name === 'site_uuid') {
      return 'test-site-uuid';
    }
    if ($name === 'send_usage_statistics') {
      return FALSE;
    }
    return $default;
  }

  public function setLibraryTutorialUrl($machineName, $tutorialUrl) {
    $this->tutorialCalls[] = array(
      'machineName' => $machineName,
      'tutorialUrl' => $tutorialUrl,
    );
  }
}

/**
 * Avoids H5PCore's constructor (file storage, site detection) and the Hub
 * HTTP call inside updateContentTypeCache.
 */
class H5PFetchLibrariesMetadataCoreStub extends H5PCore {
  public $contentTypeCacheResult;

  public function __construct($framework) {
    $this->h5pF = $framework;
    $this->fullPluginPath = '/tmp/h5p-test';
  }

  public function updateContentTypeCache($postData = NULL) {
    return $this->contentTypeCacheResult;
  }
}

set_error_handler(function ($errno, $errstr, $errfile, $errline) {
  throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
});

$framework = new H5PFetchLibrariesMetadataFrameworkStub();
$core = new H5PFetchLibrariesMetadataCoreStub($framework);
$core->contentTypeCacheResult = (object) array(
  'libraries' => array(
    (object) array(
      'machineName' => 'H5P.MultiChoice',
      'tutorialUrl' => 'https://example.com/multichoice',
    ),
    (object) array(
      'machineName' => 'H5P.Blanks',
    ),
  ),
);

try {
  $core->fetchLibrariesMetadata();
}
catch (ErrorException $e) {
  fwrite(STDERR, 'FAIL: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . "\n");
  exit(1);
}

$expected = array(
  array(
    'machineName' => 'H5P.MultiChoice',
    'tutorialUrl' => 'https://example.com/multichoice',
  ),
);

if ($framework->tutorialCalls !== $expected) {
  fwrite(STDERR, "FAIL: setLibraryTutorialUrl calls did not match.\n");
  fwrite(STDERR, 'Expected: ' . var_export($expected, TRUE) . "\n");
  fwrite(STDERR, 'Actual: ' . var_export($framework->tutorialCalls, TRUE) . "\n");
  exit(1);
}

fwrite(STDOUT, "PASS: setLibraryTutorialUrl received machineName H5P.MultiChoice\n");
exit(0);
