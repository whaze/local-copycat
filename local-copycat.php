<?php
/*
Plugin Name: LocalCopyCat
Plugin URI: https://www.example.com/
Description: Un plugin pour dupliquer facilement un site WordPress en local.
Version: 1.0.0
Author: Whaze
Author URI: https://jeromebuquet.com/
License: GPL2
Domain Name: local-copycat
*/

// Charger l'autoloader
use LocalCopyCat\LocalCopyCat;

require plugin_dir_path( __FILE__ ) . 'vendor/autoload.php';

// Instancier la classe principale du plugin
add_action( 'plugins_loaded', 'local_copycat_init' );
function local_copycat_init(): void {
	$local_copycat = new LocalCopyCat();
	$local_copycat->init();
}

// Register deactivation hook
register_deactivation_hook( __FILE__, function () {
	LocalCopyCat::deactivate_plugin();
} );
