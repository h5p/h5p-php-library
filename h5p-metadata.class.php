<?php
/**
 * Utility class for handling metadata
 */
abstract class H5PMetadata {

  const FIELDS = array(
    'title' => array(
      'type' => 'text',
      'maxLength' => 255
    ),
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
   * JSON encode metadata
   *
   * @param object $content
   * @return string
   */
  public static function toJSON($content) {
    // Note: deliberatly creating JSON string "manually" to improve performance
    return
      '{"title":' . (isset($content->title) ? json_encode($content->title) : 'null') .
      ',"authors":' . (isset($content->authors) ? $content->authors : 'null') .
      ',"source":' . (isset($content->source) ? '"' . $content->source . '"' : 'null') .
      ',"license":' . (isset($content->license) ? '"' . $content->license . '"' : 'null') .
      ',"licenseVersion":' . (isset($content->license_version) ? '"' . $content->license_version . '"' : 'null') .
      ',"licenseExtras":' . (isset($content->license_extras) ? json_encode($content->license_extras) : 'null') .
      ',"yearFrom":' . (isset($content->year_from) ? $content->year_from : 'null') .
      ',"yearTo":' .  (isset($content->year_to) ? $content->year_to : 'null') .
      ',"changes":' . (isset($content->changes) ? $content->changes : 'null') .
      ',"authorComments":' . (isset($content->author_comments) ? json_encode($content->author_comments) : 'null') . '}';
  }


  /**
   * Make the metadata into an associative array keyed by the property names
   * @param mixed $metadata Array or object containing metadata
   * @param bool $include_title
   * @param array $types
   * @return array
   */
  public static function toDBArray($metadata, $include_title = true, &$types = array()) {
    $fields = array();

    if (!is_array($metadata)) {
      $metadata = (array) $metadata;
    }

    foreach (self::FIELDS as $key => $config) {

      if ($key === 'title' && !$include_title) {
        continue;
      }

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
