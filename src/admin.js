import {__} from '@wordpress/i18n';
import {useEffect, useState, createRoot} from '@wordpress/element';
import {Button, PanelBody, Panel, PanelRow, Spinner, ToggleControl, Notice, Animate} from '@wordpress/components';
import {info, archive, people} from '@wordpress/icons';
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
    const [downloadEnabled, setDownloadEnabled] = useState(false);
    const [archives, setArchives] = useState([]);
    const {nonce} = local_copycat_admin;


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

    const fetchArchives = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/archives'});
            setArchives(response);
        } catch (error) {
            console.error('Error fetching archives:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la récupération des archives.', 'local-copycat'),
            });
        }
    };

    const deleteArchive = async (archiveId) => {
        console.log('Deleting archive:', archiveId);
        try {
            await apiFetch({
                path: `/local-copycat/v1/archives/${archiveId}`,
                method: 'POST',
                headers: {
                    'X-WP-Nonce': nonce,
                },
            });

            setNotice({
                status: 'success',
                message: __('L\'archive a été supprimée avec succès.', 'local-copycat'),
            });

            // Refresh the archives list
            fetchArchives();
        } catch (error) {
            console.error('Error deleting archive:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la suppression de l\'archive.', 'local-copycat'),
            });
        }
    };


    useEffect(() => {
        fetchAvailableRoles();
        fetchAllowedRoles();
        fetchArchives();
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
                path: `/local-copycat/v1/create-archive-task?include_theme=${includeTheme}&include_plugin=${includePlugin}&include_media=${includeMedia}`,
                method: 'GET'
            });

            if (data.task_id) {
                // Start the download process with the new task ID
                console.log('Task ID:', data.task_id);
                performArchiveTask(data.task_id);

            } else {
                console.error('Task ID not found.');
                setNotice({
                    status: 'error',
                    message: __('ID de la tâche non trouvé.', 'local-copycat'),
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

    const performArchiveTask = async (taskId) => {
        try {
            const response = await apiFetch({
                path: `/local-copycat/v1/perform-archive-task`,
                method: 'POST',
                data: {task_id: taskId},
            });

            if (response.task.completed) {
                setNotice({
                    status: 'success',
                    message: __('L\'archivage est terminé.', 'local-copycat'),
                });
                setDownloadEnabled(true);
                setDownloadUrl(`/wp-json/local-copycat/v1/download-archive/${taskId}`);
                fetchArchives();
            } else {
                setNotice({
                    status: 'success',
                    message: __('Archivage en cours...', 'local-copycat'),
                });
                // Continue the archive task
                performArchiveTask(taskId);
            }
        } catch (error) {
            console.error('Error performing archive task:', error);
            setNotice({
                status: 'error',
                message: __('Une erreur est survenue lors de la tâche d\'archivage.', 'local-copycat'),
            });
        }
    };


    const resetNotice = () => {
        setNotice(null);
    };

    return (
        <>
            {notice &&
                <Animate type="slide-in">
                    {({className}) => (
                        <Notice className={className} status={notice.status} isDismissible={true}
                                onDismiss={resetNotice}>{notice.message}</Notice>
                    )}
                </Animate>
            }
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
                            {__('Créer une archive', 'local-copycat')}
                        </Button>
                    </PanelRow>
                    <PanelRow>
                        <Button isPrimary onClick={() => window.location.href = downloadUrl} disabled={!downloadUrl}>
                            {__('Télécharger l\'archive', 'local-copycat')}
                        </Button>
                    </PanelRow>
                </PanelBody>

                <PanelBody title={__('Archives disponibles', 'local-copycat')} icon={archive} initialOpen={false}
                           className="archive_list">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Path</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {archives.map((archive) => (
                            <tr key={archive.id}>
                                <td>{archive.id}</td>
                                <td>{archive.path}</td>
                                <td>
                                    <Button isDestructive onClick={() => deleteArchive(archive.id)}>
                                        {__('Supprimer', 'local-copycat')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </PanelBody>

                <PanelBody title={__('Rôles autorisés', 'local-copycat')} icon={people} initialOpen={false}>
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
