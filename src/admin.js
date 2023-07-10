import {__} from '@wordpress/i18n';
import {useEffect, useState, createRoot} from '@wordpress/element';
import {Button, PanelBody, Panel, PanelRow, Spinner, ToggleControl} from '@wordpress/components';
import {info} from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';
import './admin.scss';

const LocalCopyCatAdmin = () => {
    // const [data, setData] = useState([]);
    const [isLoadingAvailableRoles, setIsLoadingAvailableRoles] = useState(true);
    const [isloadingAllowedRoles, setIsLoadingAllowedRoles] = useState(true);
    const [includeTheme, setIncludeTheme] = useState(true);
    const [includePlugin, setIncludePlugin] = useState(true);
    const [includeMedia, setIncludeMedia] = useState(true);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [allowedRoles, setAllowedRoles] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);

    const fetchAllowedRoles = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/allowed-roles'});
            setAllowedRoles(response);
            setIsLoadingAllowedRoles(false);
        } catch (error) {
            console.error('Error fetching allowed roles:', error);
        }

    };

    const fetchAvailableRoles = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/available-roles'});
            setAvailableRoles(response);
            setIsLoadingAvailableRoles(false);
        } catch (error) {
            console.error('Error fetching available roles:', error);
        }

    }

    useEffect(() => {
        fetchAvailableRoles();
        fetchAllowedRoles();
    }, []);

    const handleToggleRole = async (role, isChecked) => {
        const newAllowedRoles = isChecked
            ? [...allowedRoles, role]
            : allowedRoles.filter((r) => r !== role);

        await apiFetch({
            path: '/local-copycat/v1/allowed-roles',
            method: 'POST',
            data: {allowed_roles: newAllowedRoles},
        });

        setAllowedRoles(newAllowedRoles);
    };

    const handleAction = async () => {
        const selectedFiles = [];

        if (includeTheme) {
            selectedFiles.push('theme');
        }

        if (includePlugin) {
            selectedFiles.push('plugin');
        }

        if (includeMedia) {
            selectedFiles.push('media');
        }

        // Utilise les fichiers sélectionnés pour effectuer l'action souhaitée
        // Par exemple, tu peux les afficher dans la console
        console.log('Selected Files:', selectedFiles);

        try {
            const data = await apiFetch({
                path: `/local-copycat/v1/download-archive?include_theme=${includeTheme}&include_plugin=${includePlugin}&include_media=${includeMedia}`,
                method: 'GET'
            });

            console.log(data);
            if (data.archive_id) {
                // Download the archive using the new REST route
                window.location.href = `/wp-json/local-copycat/v1/download-archive/${data.archive_id}`;
            } else {
                console.error('Archive ID not found.');
            }
        } catch (error) {
            console.error('Error fetching archive ID:', error);
        }
    };

    return (
        <>
            <Panel header={__('Réglages', 'local-copycat')}>
                <PanelBody title={__('Fichiers exportés', 'local-copycat')} icon={info} initialOpen={true}>
                    <PanelRow>
                        <ToggleControl
                            label={__('Inclure le thème', 'local-copycat')}
                            checked={includeTheme}
                            onChange={setIncludeTheme}
                        />
                    </PanelRow>
                    <PanelRow>
                        <ToggleControl
                            label={__('Inclure les plugins', 'local-copycat')}
                            checked={includePlugin}
                            onChange={setIncludePlugin}
                        />
                    </PanelRow>
                    <PanelRow>
                        <ToggleControl
                            label={__('Inclure les médias', 'local-copycat')}
                            checked={includeMedia}
                            onChange={setIncludeMedia}
                        />
                    </PanelRow>
                    <PanelRow>
                        <Button isPrimary onClick={handleAction}>
                            {__('Télécharger les fichiers', 'local-copycat')}
                        </Button>
                    </PanelRow>
                    <PanelRow>
                        {downloadUrl && <a href={downloadUrl} download>{__('Télécharger le ZIP', 'local-copycat')}</a>}
                    </PanelRow>
                </PanelBody>

                <PanelBody title={__('Rôles authorisés', 'local-copycat')} initialOpen={true}>
                    {isLoadingAvailableRoles ? <Spinner/> : availableRoles.map((role) => (
                        <PanelRow key={role.slug}>
                            <ToggleControl label={role.name}
                                           onChange={() => handleToggleRole(role.slug, !allowedRoles.includes(role.slug))}
                                           checked={allowedRoles.includes(role.slug)}
                                           disabled={role.slug === 'administrator'}
                            />
                        </PanelRow>
                    ))}
                </PanelBody>

            </Panel>
        </>
    );
};

// Rendre le composant React dans le conteneur spécifié
const container = document.getElementById('local-copycat-admin-container');
if (container) {
    const root = createRoot(container);
    root.render(<LocalCopyCatAdmin/>);
}
