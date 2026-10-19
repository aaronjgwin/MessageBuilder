// File location: ./settings/messages.js

export const MESSAGES = {
    SELECT_PLACEHOLDER: (name) => `-- Select ${name} --`,
    ALERT_EXPORT_FAILED: 'Failed to generate export file.',
    ERROR_INVALID_KEY: 'Please enter a valid property key.',
    FILE_IMPORT_ERROR: 'File processing error: Invalid JSON structure.'
};

export const UI_MESSAGES = {
    // Resource & Field Validation
    resourceNameRequired: {
        title: "⚠️ Input Required",
        body: "Please enter a valid resource name before saving."
    },
    resourceNameDuplicate: {
        title: "⚠️ Duplicate Name Detected",
        body: "A resource with that specific name already exists in your workspace options configuration."
    },
    mapKeyRequired: {
        title: "⚠️ Key Required",
        body: "Please enter a valid key name."
    },
    arrayValueRequired: {
        title: "⚠️ Value Required",
        body: "Please enter an item value before appending a row."
    },
    duplicateKeyInView: {
        title: "⚠️ Duplicate Key",
        body: (key) => `The key '${key}' already in use.`
    },

    // Download & Export
    noChangesDetected: {
        title: "⚠️ No Changes Detected",
        body: "There are currently no parameter or layout settings modifications to download."
    },
    confirmDownload: {
        title: "📥 Confirm Settings Download",
        body: (path, root) => `To sync your local development workspace extension project properly, please confirm saving this configuration asset straight to:\n\n${root}\\${path.replace(/\//g, '\\')}`
    },

    // Extension Dataset Schema Builder
    datasetInputRequired: {
        title: "⚠️ Input Required",
        body: "Please enter a property column name before adding a structural key tracking row."
    },
    datasetDuplicateProperty: {
        title: "⚠️ Duplicate Property",
        body: (propertyName) => `The field name '${propertyName}' has already been added to this dataset template form.`
    },
    datasetNameRequired: {
        title: "⚠️ Input Required",
        body: "Please enter a valid dataset collection identifier catalog name before saving."
    },
    datasetPropertyRequired: {
        title: "⚠️ Property Required",
        body: "Please add at least one column property structural definition row before saving your schema layout."
    },
    datasetPropertiesRequired: {
        title: "⚠️ Properties Required",
        body: "Please enter at least one column parameter name blueprint (e.g. ID) before saving your dataset schema."
    },
    datasetSchemaSaved: {
        title: "✔️ Catalog Schema Saved",
        body: (catalogName) => `Successfully generated layout parameters array for file database list sheet: ${catalogName}.json`
    },
    datasetWorkspaceNotice: {
        title: "🛠️ Workspace Notice",
        body: (datasetKey) => `Currently routing edit context lane to modify target entries for dataset asset: ${datasetKey}.json`
    },
    datasetLoadError: {
        title: "⚠️ Fetch Operational Error",
        body: (filename) => `Failed to load structural parameters array list from static local path asset: ./datasets/${filename}.json`
    },
    datasetEmptyWarning: {
        title: "⚠️ Empty Database",
        body: "The selected dataset configuration metadata file is currently blank or contains no entry records."
    },
    homeDatasetInventory: {
        title: "📂 Local Datasets Repository Directory (./datasets/)",
        body: "The following JSON asset maps have been moved and initialized inside the localized relative runtime workspace: ./datasets/"
    },
    datasetNameDuplicate: {
        title: "⚠️ Duplicate Catalog",
        body: "A dataset with that file name key identifier already exists inside your surveillance workspace storage registry."
    },
    fileParseError: {
        title: "⚠️ Structural Parsing Error",
        body: "The selected file is not a valid dataset or is missing the expected nested object contract: dictionary.fileId"
    }
};

export function getUIMessage(msg, ...args) {
    if (!msg) return { title: '', body: '' };
    return {
        title: msg.title,
        body: typeof msg.body === 'function' ? msg.body(...args) : msg.body
    };
}