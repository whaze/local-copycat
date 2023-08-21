<?php

use LocalCopyCat\LocalCopyCat;

// If uninstall is not called from WordPress, exit.

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

LocalCopyCat::deactivate_plugin();
