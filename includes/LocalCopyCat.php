<?php

namespace LocalCopyCat;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;

class LocalCopyCat
{
    private $include_media;
    private $include_plugins;
    private $include_themes;

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
            '/download-archive',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'download_archive'),
                'permission_callback' => array($this, 'check_user_permission'),
                'args' => array(
                    'include_theme' => array(
                        'type' => 'boolean',
                        'default' => true,
                        'sanitize_callback' => 'rest_sanitize_boolean',
                        'validate_callback' => 'rest_validate_request_arg',
                    ),
                    'include_plugin' => array(
                        'type' => 'boolean',
                        'default' => true,
                        'sanitize_callback' => 'rest_sanitize_boolean',
                        'validate_callback' => 'rest_validate_request_arg',
                    ),
                    'include_media' => array(
                        'type' => 'boolean',
                        'default' => true,
                        'sanitize_callback' => 'rest_sanitize_boolean',
                        'validate_callback' => 'rest_validate_request_arg',
                    ),
                ),
            )
        );

        register_rest_route(
            'local-copycat/v1',
            '/available-roles',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_available_roles'),
                'permission_callback' => array($this, 'check_user_permission'),
            )
        );

        register_rest_route(
            'local-copycat/v1',
            '/allowed-roles',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'get_allowed_roles'),
                'permission_callback' => array($this, 'check_user_permission'),
            )
        );

        register_rest_route(
            'local-copycat/v1',
            '/allowed-roles',
            array(
                'methods' => 'POST',
                'callback' => array($this, 'update_allowed_roles'),
                'permission_callback' => array($this, 'check_user_permission'),
            )
        );

        register_rest_route(
            'local-copycat/v1',
            '/download-archive/(?P<id>[a-zA-Z0-9]+)',
            array(
                'methods' => 'GET',
                'callback' => array($this, 'serve_archive'),
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

        $user = wp_get_current_user();
        $allowed_roles = get_option('local_copycat_allowed_roles', array('administrator'));

        if (array_intersect($allowed_roles, $user->roles)) {
            return true;
        } else {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to access this endpoint.', 'local-copycat'),
                array('status' => 403)
            );
        }

    }

    public function get_available_roles()
    {
        $roles = array();
        foreach (wp_roles()->roles as $role => $details) {
            $roles[] = ['slug' => $role, 'name' => $details['name']];
        }


        return $roles;
    }

    public function get_allowed_roles()
    {
        return get_option('local_copycat_allowed_roles', array('administrator'));
    }

    public function update_allowed_roles(\WP_REST_Request $request)
    {
        $allowed_roles = $request->get_param('allowed_roles');

        if (!is_array($allowed_roles)) {
            return new \WP_Error(
                'invalid_param',
                __('The allowed_roles parameter must be an array.', 'local-copycat'),
                array('status' => 400)
            );
        }

        // s'assurer que $allowed_roles contient toujours au minimum le rôle administrateur
        if (!in_array('administrator', $allowed_roles)) {
            $allowed_roles[] = 'administrator';
        }

        update_option('local_copycat_allowed_roles', $allowed_roles);

        return $allowed_roles;
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
     *
     * @param \WP_REST_Request $request The request object.
     */
    public function download_archive(\WP_REST_Request $request)
    {
        $this->include_themes = $request->get_param('include_theme');
        $this->include_plugins = $request->get_param('include_plugin');
        $this->include_media = $request->get_param('include_media');

        $zip = new ZipArchive();
        $archive_name = 'local-copycat-archive-' . date('Y-m-d-H-i-s') . uniqid() . '.zip';
        $archive_path = WP_CONTENT_DIR . '/uploads/' . $archive_name;

        if ($zip->open($archive_path, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
            // Add themes folder to the archive
            if ($this->include_themes) {
                $this->add_folder_to_archive(WP_CONTENT_DIR . '/themes', $zip);
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

            // Generate a unique ID for the archive
            $archive_id = wp_hash($archive_path);

            // Store the archive path in the options table
            update_option("local_copycat_archive_$archive_id", $archive_path);

            // Return the archive ID
            return new \WP_REST_Response(array('archive_id' => $archive_id), 200);
        } else {
            return new \WP_Error('archive_error', 'Error creating the archive.', array('status' => 500));
        }
    }


    public function serve_archive(\WP_REST_Request $request)
    {
        // Get the archive ID
        $archive_id = $request->get_param('id');

        // Get the archive path
        $archive_path = get_option("local_copycat_archive_$archive_id");

        if (!$archive_path || !file_exists($archive_path)) {
            return new \WP_Error('archive_not_found', 'Archive not found.', array('status' => 404));
        }

        // Serve the file
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename=' . basename($archive_path));
        header('Content-Length: ' . filesize($archive_path));
        readfile($archive_path);

        // Delete the file and the option
        unlink($archive_path);
        delete_option("local_copycat_archive_$archive_id");

        exit;
    }

    /**
     * Add a folder to the ZIP archive recursively.
     *
     * @param string $folder The folder path.
     * @param \ZipArchive $zip The ZipArchive object.
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