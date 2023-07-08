import {__} from '@wordpress/i18n';
import {useEffect, useState, createRoot} from '@wordpress/element';
import {Button, PanelBody, Panel, PanelRow, Spinner, ToggleControl} from '@wordpress/components';
import {info} from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';
import './admin.scss';

const LocalCopyCatAdmin = () => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [includeTheme, setIncludeTheme] = useState(true);
    const [includePlugin, setIncludePlugin] = useState(true);
    const [includeMedia, setIncludeMedia] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await apiFetch({path: '/local-copycat/v1/data'});
            setData(response);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleAction = () => {
        // Handle the action
    };

    return (
        <>
            {isLoading ? (
                <Spinner/>
            ) : (
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
                            <ul>
                                {data.map((item, index) => (
                                    <li key={index}>{item.name}</li>
                                ))}
                            </ul>
                        </PanelRow>
                    </PanelBody>
                </Panel>
            )}
        </>
    );
};

// Rendre le composant React dans le conteneur spécifié
const container = document.getElementById('local-copycat-admin-container');
if (container) {
    const root = createRoot(container);
    root.render(<LocalCopyCatAdmin/>);
}
