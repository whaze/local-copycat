# LocalCopyCat

LocalCopyCat is a WordPress plugin that allows you to easily duplicate an existing WordPress site for local development.
It provides the ability to create a ZIP archive of the site's files and a database dump, making it convenient to set up
a local environment for development or testing purposes.

## Features

- Easily duplicate a WordPress site for local development
- Download ZIP archives of the site's files and database dump
- Search and replace URLs in the database to match the local environment

## Requirements

- WordPress 5.0 or higher

## Installation

1. Download the latest release of the plugin from the [Releases](https://github.com/whaze/releases)
   page.
2. Upload the plugin files to the `wp-content/plugins/` directory on your WordPress site.
3. Activate the plugin through the WordPress admin interface.

## Development

To contribute to the development of LocalCopyCat or customize it for your needs, follow the steps below:

### Prerequisites

- Node.js (https://nodejs.org)
- Composer (https://getcomposer.org)

### Setup

1. Clone the repository or download the source code.
2. Install PHP dependencies by running `composer install` in the plugin root directory.
3. Install JavaScript dependencies by running `npm install` in the plugin root directory.

### Build Assets

To compile the JavaScript and SCSS assets, run the following commands:

- For development: `npm run start`
- For production (minified): `npm run build`

The compiled assets will be located in the `build` directory.

### Contributing

Contributions to LocalCopyCat are welcome! If you have any suggestions, bug reports, or feature requests, please create
an issue in the [Issue Tracker](https://github.com/your-plugin-repository/issues) or submit a pull request.

## License

LocalCopyCat is released under the [GPL-2.0 License](https://www.gnu.org/licenses/gpl-2.0.html).

## Credits

Whaze \o/

