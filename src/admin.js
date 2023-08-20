import {__} from '@wordpress/i18n';
import {useEffect, useState, createRoot} from '@wordpress/element';
import {Button, PanelBody, Panel, PanelRow, Spinner, ToggleControl} from '@wordpress/components';
import {info, archive, people} from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';
import {ToastContainer, toast} from 'react-toastify';
import './admin.scss';

const LocalCopyCatAdmin = () => {
    const [isLoadingAvailableRoles, setIsLoadingAvailableRoles] = useState(true);
    const [isloadingAllowedRoles, setIsLoadingAllowedRoles] = useState(true);
    const [includeTheme, setIncludeTheme] = useState(true);
    const [includePlugin, setIncludePlugin] = useState(false);
    const [includeMedia, setIncludeMedia] = useState(false);
    const [allowedRoles, setAllowedRoles] = useState([]);
    const [availableRoles, setAvailableRoles] = useState([]);
    const [archives, setArchives] = useState([]);
    const {nonce} = local_copycat_admin;


    const fetchAllowedRoles = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/allowed-roles'});
            setAllowedRoles(response);
            setIsLoadingAllowedRoles(false);
        } catch (error) {
            console.error('Error fetching allowed roles:', error);
            toast.error(__('Une erreur est survenue lors de la récupération des rôles autorisés.', 'local-copycat'));

        }

    };

    const fetchAvailableRoles = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/available-roles'});
            setAvailableRoles(response);
            setIsLoadingAvailableRoles(false);
        } catch (error) {
            console.error('Error fetching available roles:', error);
            toast.error(__('Une erreur est survenue lors de la récupération des rôles disponibles.', 'local-copycat'));

        }

    }

    const fetchArchives = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/archives'});
            // Sort the archives by creationDate in descending order
            const sortedArchives = response.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));
            setArchives(sortedArchives);
        } catch (error) {
            console.error('Error fetching archives:', error);
            toast.error(__('Une erreur est survenue lors de la récupération des archives.', 'local-copycat'));
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

            toast.success(__('L\'archive a été supprimée avec succès.', 'local-copycat'));


            // Refresh the archives list
            fetchArchives();
        } catch (error) {
            console.error('Error deleting archive:', error);
            toast.error(__('Une erreur est survenue lors de la suppression de l\'archive.', 'local-copycat'));

        }
    };


    useEffect(() => {
        fetchAvailableRoles();
        fetchAllowedRoles();
        fetchArchives();
    }, []);

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
            toast.success(__('Les rôles autorisés ont été mis à jour avec succès.', 'local-copycat'));
        } catch (error) {
            console.error('Error updating allowed roles:', error);
            toast.error(__('Une erreur est survenue lors de la mise à jour des rôles autorisés.', 'local-copycat'));
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
                toast.error(__('ID de la tâche non trouvé.', 'local-copycat'));
            }
        } catch (error) {
            console.error('Error fetching archive ID:', error);
            toast.error(__('Une erreur est survenue lors de la récupération de l\'ID de l\'archive.', 'local-copycat'));
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
                toast.success(__('L\'archivage est terminé.', 'local-copycat'));
                fetchArchives();
            } else {
                toast.success(__('Archivage en cours...', 'local-copycat'));
                // Continue the archive task
                performArchiveTask(taskId);
            }
        } catch (error) {
            console.error('Error performing archive task:', error);
            toast.error(__('Une erreur est survenue lors de la tâche d\'archivage.', 'local-copycat'));
        }
    };

    return (
        <>
            <ToastContainer position={toast.POSITION.TOP_CENTER} className="localcopycat-toast" limit={4}/>

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
                </PanelBody>

                <PanelBody title={__('Archives disponibles', 'local-copycat')} icon={archive} initialOpen={true}
                           className="archive_list">
                    <table>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Path</th>
                            <th>Creation date</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {archives.map((archive) => (
                            <tr key={archive.id}>
                                <td>{archive.id}</td>
                                <td>{archive.path}</td>
                                <td>{new Date(archive.creationDate).toLocaleString()}</td>
                                <td>
                                    <Button isDestructive onClick={() => deleteArchive(archive.id)}>
                                        {__('Supprimer', 'local-copycat')}
                                    </Button>
                                    <Button isPrimary
                                            onClick={() => window.location.href = `/wp-json/local-copycat/v1/download-archive/${archive.id}`}
                                    >
                                        {__('Télécharger', 'local-copycat')}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </PanelBody>

                <PanelBody title={__('Rôles autorisés', 'local-copycat')} icon={people} initialOpen={true}>
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
