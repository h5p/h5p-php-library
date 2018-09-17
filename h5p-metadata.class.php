<?php
/**
 * Utility class for handling metadata
 */
abstract class H5PMetadata {

  const FIELDS = array(
    'authors' => array(
      'type' => 'json'
    ),
    'changes' => array(
      'type' => 'json'
    ),
    'source' => array(
      'type' => 'text',
      'maxLength' => 255
    ),
    'license' => array(
      'type' => 'text',
      'maxLength' => 32
    ),
    'licenseVersion' => array(
      'type' => 'text',
      'maxLength' => 10
    ),
    'licenseExtras' => array(
      'type' => 'text',
      'maxLength' => 5000
    ),
    'authorComments' => array(
      'type' => 'text',
      'maxLength' => 5000
    ),
    'yearFrom' => array(
      'type' => 'int'
    ),
    'yearTo' => array(
      'type' => 'int'
    )
  );

  /**
   * Make the metadata into an associative array keyed by the property names
   * @param mixed $metadata Array or object containing metadata
   * @return array
   */
  public static function toDBArray($metadata, &$types = array()) {
    $fields = array();

    if (!is_array($metadata)) {
      $metadata = (array) $metadata;
    }

    foreach (self::FIELDS as $key => $config) {
      if (isset($metadata[$key])) {
        $value = $metadata[$key];
        $db_field_name = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $key));

        switch ($config['type']) {
          case 'text':
            if (strlen($value) > $config['maxLength']) {
              $value = mb_substr($value, 0, $config['maxLength']);
            }
            $types[] = '%s';
            break;

          case 'int':
            $value = ($value !== null) ? intval($value): null;
            $types[] = '%i';
            break;

          case 'json':
            $value = json_encode($value);
            $types[] = '%s';
            break;
        }

        $fields[$db_field_name] = $value;
      }
    }

    return $fields;
  }
}
