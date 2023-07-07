<?php

namespace LocalCopyCat;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;

class LocalCopyCat
{
    /**
     * Initialize the plugin.
     */
    public function init()
    {
        // Enqueue scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_scripts'));

        // Register REST API routes
        add_action('rest_api_init', array($this, 'register_rest_routes'));

        // Add admin page
        add_action('admin_menu', array($this, 'add_admin_page'));
    }

    /**
     * Enqueue scripts and styles.
     */
    public function enqueue_scripts()
    {
        // Enqueue admin scripts
        wp_enqueue_script(
            'local-copycat-admin',
            plugins_url('build/admin.js', __DIR__),
            array('wp-components', 'wp-data', 'wp-edit-post', 'wp-element', 'wp-i18n', 'wp-plugins'),
            '1.0.0',
            true
        );

        // Enqueue admin styles
        wp_enqueue_style(
            'local-copycat-admin-styles',
            plugins_url('build/admin.css', __DIR__),
            array(),
            '1.0.0'
        );
    }

    /**
     * Register REST API routes.
     */
    public function register_rest_routes()
    {
        register_rest_route(
            'local-copycat/v1',
            '/data',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_data'),
//                'permission_callback' => '__return_true', // Adjust the permission callback as needed
                'permission_callback' => array($this, 'check_user_permission'),
            )
        );
    }

    /**
     * Check user permission for the REST route.
     *
     * @return bool|\WP_Error Whether the user has permission or not.
     */
    public function check_user_permission()
    {
        if (!is_user_logged_in()) {
            return new \WP_Error(
                'rest_forbidden',
                __('You must be logged in to access this endpoint.', 'local-copycat'),
                array('status' => 401)
            );
        }

        return true;
    }

    /**
     * REST API callback to get data.
     *
     * @param WP_REST_Request $request The REST API request object.
     * @return array|WP_Error The data or WP_Error object.
     */
    public function get_data($request)
    {
        // Perform logic to fetch and return data
        $data = array(
            array('name' => 'Item 1'),
            array('name' => 'Item 2'),
            array('name' => 'Item 3'),
        );

        return $data;
    }

    /**
     * Add admin page.
     */
    public function add_admin_page()
    {
        add_menu_page(
            __('Local CopyCat', 'local-copycat'),
            __('Local CopyCat', 'local-copycat'),
            'manage_options',
            'local-copycat-admin',
            array($this, 'render_admin_page'),
            'dashicons-admin-generic',
            90
        );
    }

    /**
     * Render admin page.
     */
    public function render_admin_page()
    {
        echo '<div class="wrap">';
        echo '<h1>' . __('Local CopyCat', 'local-copycat') . '</h1>';

        // Render React admin components here
        echo '<div id="local-copycat-admin-container"></div>';

        echo '</div>';
    }

    /**
     * Download the ZIP archive with selected files.
     */
    public function download_archive()
    {
        $zip = new ZipArchive();
        $archive_name = 'local-copycat-archive-' . date('Y-m-d') . '.zip';

        if ($zip->open($archive_name, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
            // Add themes folder to the archive
            if ($this->include_themes) {
                $this->add_folder_to_archive(get_template_directory(), $zip);
            }

            // Add plugins folder to the archive
            if ($this->include_plugins) {
                $this->add_folder_to_archive(WP_PLUGIN_DIR, $zip);
            }

            // Add media files to the archive
            if ($this->include_media) {
                $this->add_folder_to_archive(WP_CONTENT_DIR . '/uploads', $zip);
            }

            $zip->close();

            // Set headers for file download
            header('Content-Type: application/zip');
            header('Content-Disposition: attachment; filename=' . $archive_name);
            header('Content-Length: ' . filesize($archive_name));
            header('Pragma: no-cache');
            header('Expires: 0');

            // Send the file to the browser for download
            readfile($archive_name);

            // Delete the temporary archive file
            unlink($archive_name);
        }
    }

    /**
     * Add a folder to the ZIP archive recursively.
     *
     * @param string $folder The folder path.
     * @param ZipArchive $zip The ZipArchive object.
     */
    private function add_folder_to_archive($folder, $zip)
    {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($folder, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $local_path = substr($file->getPathname(), strlen($folder) + 1);
                $zip->addFile($file->getPathname(), $local_path);
            }
        }
    }
}