import {__} from '@wordpress/i18n';
import {useEffect, useState, createRoot} from '@wordpress/element';
import {Button, PanelBody, Panel, PanelRow, Spinner, ToggleControl, Notice} from '@wordpress/components';
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
    const [notice, setNotice] = useState(null);

    const fetchAllowedRoles = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/allowed-roles'});
            setAllowedRoles(response);
            setIsLoadingAllowedRoles(false);
        } catch (error) {
            console.error('Error fetching allowed roles:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la récupération des rôles autorisés.', 'local-copycat'),
            });
        }

    };

    const fetchAvailableRoles = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/available-roles'});
            setAvailableRoles(response);
            setIsLoadingAvailableRoles(false);
        } catch (error) {
            console.error('Error fetching available roles:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la récupération des rôles disponibles.', 'local-copycat'),
            });
        }

    }

    useEffect(() => {
        fetchAvailableRoles();
        fetchAllowedRoles();
    }, []);

    useEffect(() => {
        let timeout;
        if (notice && notice.status === 'success') {
            timeout = setTimeout(() => {
                setNotice(null);
            }, 5000); // 10000 milliseconds = 10 seconds
        }
        // Cleanup function to clear the timeout when the component unmounts or when the notice changes
        return () => {
            clearTimeout(timeout);
        };
    }, [notice]); // Effect runs when the notice state changes

    const handleToggleRole = async (role, isChecked) => {
        try {
            const newAllowedRoles = isChecked
                ? [...allowedRoles, role]
                : allowedRoles.filter((r) => r !== role);

            await apiFetch({
                path: '/local-copycat/v1/allowed-roles',
                method: 'POST',
                data: {allowed_roles: newAllowedRoles},
            });

            setAllowedRoles(newAllowedRoles);
            setNotice({
                status: 'success',
                message: __('Les rôles autorisés ont été mis à jour avec succès.', 'local-copycat'),
            });
        } catch (error) {
            console.error('Error updating allowed roles:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la mise à jour des rôles autorisés.', 'local-copycat'),
            });
        }
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
                setNotice({
                    status: 'success',
                    message: __('Le téléchargement des fichiers a commencé.', 'local-copycat'),
                });
            } else {
                console.error('Archive ID not found.');
                setNotice({
                    status: 'error',
                    message: __('ID de l\'archive non trouvé.', 'local-copycat'),
                });
            }
        } catch (error) {
            console.error('Error fetching archive ID:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la récupération de l\'ID de l\'archive.', 'local-copycat'),
            });
        }
    };

    const resetNotice = () => {
        setNotice(null);
    };

    return (
        <>
            {notice &&
                <Notice status={notice.status} isDismissible={true} onDismiss={resetNotice}>{notice.message}</Notice>}
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
