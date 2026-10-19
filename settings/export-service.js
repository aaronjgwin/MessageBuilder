// File location: ./settings/export-service.js
import { finalState, getDownloadPayload } from './data-manager.js';
/**
 * Bundles configuration data into a ZIP package and triggers a browser download.
 * @param {string} [zipFileName]
 */
export async function downloadConfigurationPackage(zipFileName = 'MessageBuilder-Configuration.zip') {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library is not loaded.');
    }
    getDownloadPayload();
    const zip = new JSZip();
    const jsonFolder = zip.folder('json');
    const datasetsFolder = zip.folder('datasets');

    // 1. Pack /json configurations
    jsonFolder.file('fields.json', JSON.stringify(finalState.fields, null, 2));
    jsonFolder.file('tabs.json', JSON.stringify(finalState.tabs, null, 2));
    jsonFolder.file('templates.json', JSON.stringify(finalState.templates, null, 2));
    jsonFolder.file('settings.json', JSON.stringify(finalState.settings, null, 2));
    jsonFolder.file('resources.json', JSON.stringify(finalState.resources, null, 2));

    // 2. Pack /datasets files
    Object.keys(finalState.datasets).forEach(datasetName => {
        const fileName = datasetName.endsWith('.json') ? datasetName : `${datasetName}.json`;
        const content = finalState.datasets[datasetName] || {};
        datasetsFolder.file(fileName, JSON.stringify(content, null, 2));
    });

    // 3. Generate Blob and trigger download
    const blob = await zip.generateAsync({ type: 'blob' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = zipFileName;
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);
}