<?php
interface h5pFramework {
  function setErrorMessage($message);
  function setInfoMessage($message);
  function translate($message, $replacements);
}

class h5p {
  public $h5pFramework;
  public function __construct($h5pFramework) {
    $this->h5pFramework = $h5pFramework;
  }
}
?>
