<!doctype html>
<html lang="<?php print $lang; ?>" class="h5p-iframe">
<head>
  <meta charset="utf-8">
  <title><?php print $content['title']; ?></title>
  <?php for ($i = 0, $s = count($scripts); $i < $s; $i++): ?>
    <script src="<?php print $scripts[$i]; ?>"></script>
  <?php endfor; ?>
  <?php for ($i = 0, $s = count($styles); $i < $s; $i++): ?>
    <link rel="stylesheet" href="<?php print $styles[$i]; ?>">
  <?php endfor; ?>
</head>
<body>
  <div class="h5p-content" data-content-id="<?php print $content['id']; ?>"></div>
  <script>
    H5P.jQuery(document).ready(function () {
      H5P.postUserStatistics = <?php print $settings['postUserStatistics'] ? 'true' : 'false'; ?>;
      H5P.ajaxPath = '<?php print $settings['ajaxPath']; ?>';
      H5P.url = '<?php print $settings['url']; ?>';
      H5P.l10n = {H5P: <?php print json_encode($settings['i18n']); ?>};
      H5P.contentDatas = {'cid-<?php print $content['id']; ?>': <?php print json_encode($contentSettings); ?>};
      H5P.user = <?php print json_encode($settings['user']); ?>;
      H5P.init();
    });
  </script>
</body>
</html>
