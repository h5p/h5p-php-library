<?php

/**
 * The base class for H5P events. Extend to track H5P events in your system.
 *
 * @package    H5P
 * @copyright  2016 Joubel AS
 * @license    MIT
 */
class H5PEventBase {
  // Constants
  const LOG_NONE = 0;
  const LOG_ALL = 1;
  const LOG_ACTIONS = 2;
  const LOG_EXTRAS = 4;

  // Static options
  public static $log_level = self::LOG_EXTRAS;
  public static $log_time = 2592000; // 30 Days

  // Protected variables
  protected $id, $type, $sub_type, $content_id, $content_title, $library_name, $library_version, $time;

  /**
   * Adds event type, h5p library and timestamp to event before saving it.
   *
   * Common event types with sub type:
   *  content, <none> – content view
   *           embed – viewed through embed code
   *           shortcode – viewed through internal shortcode
   *           edit – opened in editor
   *           delete – deleted
   *           create – created through editor
   *           create upload – created through upload
   *           update – updated through editor
   *           update upload – updated through upload
   *           upgrade – upgraded
   *
   *  results, <none> – view own results
   *           content – view results for content
   *           set – new results inserted or updated
   *
   *  settings, <none> – settings page loaded
   *
   *  library, <none> – loaded in editor
   *           create – new library installed
   *           update – old library updated
   *
   * @param string $type
   *  Name of event type
   * @param string $sub_type
   *  Name of event sub type
   * @param string $content_id
   *  Identifier for content affacted by the event
   * @param string $content_title
   *  Content title (makes it easier to know which content was deleted etc.)
   * @param string $library_name
   *  Name of the library affacted by the event
   * @param string $library_version
   *  Library version
   */
  function __construct($type, $sub_type = NULL, $content_id = NULL, $content_title = NULL, $library_name = NULL, $library_version = NULL) {
    $this->type = $type;
    $this->sub_type = $sub_type;
    $this->content_id = $content_id;
    $this->content_title = $content_title;
    $this->library_name = $library_name;
    $this->library_version = $library_version;
    $this->time = time();

    if (self::validLogLevel($type, $sub_type)) {
      $this->save();
    }
  }

  /**
   * Determines if the log type should be saved.
   * @param string $type
   *  Name of event type
   * @param string $sub_type
   *  Name of event sub type
   */
  public static function validLogLevel($type, $sub_type) {
    switch (self::$log_level) {
      default:
      case self::LOG_NONE:
        return FALSE;
      case self::LOG_ALL:
        return TRUE;

      case self::LOG_EXTRAS:
        // Extras help provide H5P with valuable anonymous user data!
        if ( ($type === 'content' && $sub_type === 'shortcode insert') || // Log number of shortcode inserts
             ($type === 'library' && $sub_type === NULL) || // Log number of times library is loaded in editor
             ($type === 'results' && $sub_type === 'content') ) { // Log number of times results page has been opened
          return TRUE;
        }
        // Fall through by intention!
      case self::LOG_ACTIONS:
        if ( ($type === 'content' && in_array($sub_type, array('create', 'create upload', 'update', 'update upload', 'upgrade', 'delete'))) ||
             ($type === 'library' && in_array($sub_type, array('create', 'update'))) ) {
          return TRUE; // Log actions
        }
        return FALSE;
    }
  }

  /**
   * A helper which makes it easier for some systems to save the data.
   * No NULL values, empty string or 0 used instead.
   * Used in e.g. WordPress.
   *
   * @return array with two arrays: $data, $format
   */
  protected function toArray() {
    return array(
      array(
        'created_at' => $this->time,
        'type' => $this->type,
        'sub_type' => empty($this->sub_type) ? '' : $this->sub_type,
        'content_id' => empty($this->content_id) ? 0 : $this->content_id,
        'content_title' => empty($this->content_title) ? '' : $this->content_title,
        'library_name' => empty($this->library_name) ? '' : $this->library_name,
        'library_version' => empty($this->library_version) ? '' : $this->library_version
      ),
      array(
        '%d',
        '%s',
        '%s',
        '%d',
        '%s',
        '%s',
        '%s'
      )
    );
  }

  /**
   * Store the event.
   */
  protected function save() {
    // Does nothing by default, should be overriden by plugin
  }
}
