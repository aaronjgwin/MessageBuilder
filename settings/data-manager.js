// File location: ./settings/data-manager.js
import { ConfigLoader } from '../scripts/ConfigLoader.js';
import { widgetList, widgetConfigs, masterFieldConfigList } from '../widgets/_fieldConfig.js';

const configLoader = new ConfigLoader();

export const state = {
    // Dictionary
    datasetsDictionary: {},
    //templatesDictionary: {},
    //tabsDictionary: { properties: ['label', 'value', 'optionFieldIds'] },
    // Data
    fields: {},
    tabs: {},
    templates: {},
    resources: {},
    datasets: {},
    settingsDatasets: [],
    settingsDefaults: {},
    settingsLinkedDefaults: [], // Array of {}s
    // Keys
    get fieldsKeys(){ return Object.keys(state.fields) },
    get tabsKeys(){ return Object.keys(state.tabs) },
    get tabsNamesAndKeys(){ return getNamesAndKeys('tabs', 'name') },
    get templatesKeys(){ return Object.keys(state.templates) },
    get templatesNamesAndKeys(){ return getNamesAndKeys('templates', 'templateName') },
    get resourcesKeys(){ return Object.keys(state.resources) },
    get datasetsKeys(){ return Object.keys(state.datasets) },
    get settingsLinkedDefaultsKeys(){ return state.settingsLinkedDefaults.map(
        item => `${item.fieldType} -> ${item.fieldProperty} = ${item.defaultsProperty}`
    );},
    get resourcesArrayKeys(){ const { resourcesArrayKeys } = getResourcesKeyLists(); return resourcesArrayKeys },
    get resourcesMapKeys(){ const { resourcesMapKeys } = getResourcesKeyLists(); return resourcesMapKeys },
    get settingsDefaultsKeys(){ return Object.keys(state.settingsDefaults) },
    get templatesByTab() {
        if (!state.tabs) return {};
        return Object.fromEntries(
            Object.entries(state.tabs).map(([key, tab]) => [
                key,
                tab?.submenu?.options ?? []
            ])
        );
    },
    get tabsByTemplate() {
        if (!state.tabs) return {};
        const mapping = {};

        Object.entries(state.tabs).forEach(([tabKey, tab]) => {
            const options = tab?.submenu?.options ?? [];
            options.forEach(opt => {
                // Support both string options and rich objects { value: '...' }
                const templateId = typeof opt === 'string' ? opt : opt?.value;
                if (!templateId) return;

                if (!mapping[templateId]) {
                    mapping[templateId] = [];
                }
                mapping[templateId].push(tabKey);
            });
        });

        return mapping;
    },

    // _fieldConfig
    masterFieldConfigList: [],
    widgetConfigs: {},
    widgetTypes: []
};

export const finalState = {
    datasets: {},
    fields: {},
    resources: {},
    settings: {},
    tabs: {},
    templates: {}
};

export async function loadInitialData() {
    const config = await configLoader.loadAll(false);
    // Dictionary
    state.datasetsDictionary = config?.datasetsDictionary || {};
    //state.templatesDictionary = config?.templatesDictionary || {};
    // Data
    state.fields = config?.fields || {};
    state.tabs = config?.tabsConfig || {};
    state.templates = config?.templates || {};
    state.resources = config?.resources || {};
    state.datasets = config?.datasets || {};
    state.settingsDatasets = config?.settingsDatasets || [];
    state.settingsDefaults = config?.settingsDefaults || {};
    state.settingsLinkedDefaults = config?.settingsLinkedDefaults || [];
    // _fieldConfig
    state.masterFieldConfigList = masterFieldConfigList || {};
    state.widgetConfigs = widgetConfigs || {};
    state.widgetTypes = widgetList || [];
}

function getResourcesKeyLists() {
    const resources = state.resources || {};
    return Object.entries(resources).reduce(
        (acc, [key, val]) => {
            if (Array.isArray(val)) {
                acc.resourcesArrayKeys.push(key);
            } else if (val && typeof val === 'object') {
                acc.resourcesMapKeys.push(key);
            }
            return acc;
        },
        { resourcesArrayKeys: [], resourcesMapKeys: [] }
    );
}
function getNamesAndKeys(context, fieldNane){
    const namesAndKeys = {};
    Object.keys(state?.[context]).forEach(key => {
        namesAndKeys[key] = state?.[context][key]?.[fieldNane] ?? null;
    });
    return namesAndKeys;
}

export function refreshResourceKeys() {
    const { resourcesArrayKeys, resourcesMapKeys } = getResourcesKeyLists();
    Object.assign(state, { resourcesArrayKeys, resourcesMapKeys });
}

// ==========================================
// GETTER FUNCTIONS
// ==========================================

export function getDownloadPayload(){
    finalState.fields = state.fields;
    finalState.resources = state.resources;
    finalState.settings = {
        "defaults": state.settingsDefaults,
        "linkedDefaults": state.settingsLinkedDefaults,
        "datasets": state.settingsDatasets
    };
    finalState.tabs = state.tabs;
    finalState.templates = {
        "dictionary": state.templatesDictionary,
        "data": state.templates
    };
    Object.keys(state.datasets).forEach(key => {
        finalState.datasets[key] = {
            "dictionary": state.datasetsDictionary[key],
            "data": state.datasets[key]
        };
    });
}

// ==========================================
// DATA UPDATE & MUTATION FUNCTIONS
// ==========================================

export function syncActiveDatasets(updatedList) {
    if (!Array.isArray(updatedList)) return;
    state.settingsDatasets.length = 0;
    state.settingsDatasets.push(...updatedList);

    updatedList.forEach(setName => {
        state.datasets[setName] = state.datasets[setName] || {};
        console.log('updatedList datasetsData syncActiveDatasets', setName);
    });
    Object.keys(state.datasets).forEach(key => {
        if (!state.settingsDatasets.includes(key)) { delete state.datasets[key]; console.log('delete datasetsData syncActiveDatasets', key); }
    });
}

export function syncDefaults(updatedMap) {
    if (!updatedMap || typeof updatedMap !== 'object') return;
    Object.keys(state.settingsDefaults).forEach(key => delete state.settingsDefaults[key]);
    Object.assign(state.settingsDefaults, updatedMap);
}

export function saveContextName(newKey, data, dictionary, location = {}) {
    // Only newKey and data are strictly required; dictionary can be null
    if (!newKey || !data) return;

    const { editingKey, isEditing } = location;

    [data, dictionary].filter(Boolean).forEach(item => {
        const { context, value } = item;
        if (!context) return;

        // Ensure target state object exists
        state[context] = state[context] || {};

        // 1. Remove old key if renamed during edit
        if (isEditing && editingKey && editingKey !== newKey) {
            delete state[context][editingKey];
        }

        // 2. Clone array/object value to break reference mutations
        if (Array.isArray(value)) {
            state[context][newKey] = [...value];
        } else if (value && typeof value === 'object') {
            state[context][newKey] = { ...value };
        } else {
            state[context][newKey] = value;
        }
    });
}
export function getTargetState(location){
    if (!location) return;
    const { context, type, editingKey, index } = location || {};
    let target = state?.[context]; if (!target) return;
    let key = null;
    switch (type) {
        case 'record': key = index; target = target?.[editingKey];
            if (context === 'tabs') target = target?.submenu?.options;
            if (context === 'templates') target = target?.propertyValues;
            break;
        case 'edit': key = editingKey; break;
        default: return;
    }
    return { target, key };
}

export function deleteSharedEdit(location) {
    const { target, key } = getTargetState(location);
    if (Array.isArray(target)) { target.splice(key, 1); }
    else if (target && typeof target === 'object') { delete target[key]; }
}

export function saveLinkedDefaultRule(index, ruleObj) {
    if (index >= 0 && index < state.settingsLinkedDefaults.length) {
        state.settingsLinkedDefaults[index] = ruleObj;
    } else {
        state.settingsLinkedDefaults.push(ruleObj);
    }
}

export function deleteLinkedDefaultRule(index) {
    if (index >= 0 && index < state.settingsLinkedDefaults.length) {
        state.settingsLinkedDefaults.splice(index, 1);
    }
}

export function deleteField(fieldKey) {
    if (fieldKey in state.fields) {
        delete state.fields[fieldKey];
    }
}

export function saveDataset(datasetKey, datasetData) {
    if (!datasetKey) return;
    state.datasets[datasetKey] = structuredClone(datasetData);
    if (!state.settingsDatasets.includes(datasetKey)) {
        state.settingsDatasets.push(datasetKey);
    }
}

export function deleteDataset(datasetKey) {
    delete state.datasets[datasetKey];
    state.settingsDatasets = state.settingsDatasets.filter(key => key !== datasetKey);
}

export function saveTab(tabKey, tabData) {
    if (!tabKey) return;
    state.tabs[tabKey] = structuredClone(tabData);
}

export function deleteTab(tabKey) {
    delete state.tabs[tabKey];
}

export function saveTemplate(templateKey, templateData) {
    if (!templateKey) return;
    state.templates[templateKey] = structuredClone(templateData);
}

export function deleteTemplate(templateKey) {
    delete state.templates[templateKey];
}

export function syncFields(updated, editingKey) {
    syncState(updated, 'fields', editingKey);
}

export function syncResources(updated, editingKey = null) {
    syncState(updated, 'resources', editingKey);
}

function syncState(update, context, editingKey= null) {
    if (!update || !context) return;

    let data = state[context]?.[editingKey]?.properties
        ?? state[context]?.[editingKey]
        ?? state[context];

    if (Array.isArray(update) && Array.isArray(data)) { console.log('syncState 2 - Array');
        data.length = 0; data.push( ...update );
    }

    if (typeof update === 'object' && typeof data === 'object') { console.log('syncState 2 - Map');
        Object.keys(data).forEach(key => delete data[key]);
        Object.assign(data, update);
    }
    console.log('syncState 3', context, editingKey, data, update, Array.isArray(data), typeof data !== 'object');
}

export function setupNewData(dataContext, location, screenConfig, isNewArray = false){
    if (!dataContext || !location || !screenConfig) return;

    let data = { context: location.context, value: null };
    let dictionary = null;
    if(!screenConfig.key) {
        screenConfig.key = `${screenConfig.fields[0]}Key`;
        dataContext[screenConfig.key] = dataContext[screenConfig.fields[0]];
    }
    let key = screenConfig.key;
    if (typeof dataContext[key] === 'string' && !isCamelCase(dataContext[key])) dataContext[key] = toCamelCase(dataContext[key]);

    switch(location.context){

        case 'fields':
            data.value = {
                "label": dataContext?.label,
                "type": dataContext?.type
            }; break;

        case 'tabs':
            data.value = {
                "name": dataContext?.name,
                "header": dataContext?.header,
                "submenu": {
                    "id": dataContext?.id,
                    "label": dataContext?.label,
                    "default": "",
                    "options": []
                }
            }
            break;

        case 'templates':
            //key = toCamelCase(dataContext?.templateName);
            data.value = {
                "templateName": dataContext?.templateName,
                "propertyValues": []
            }
            break;

        case 'resources':
            data.value = isNewArray ? [] : {};
            break;

        case 'datasets':
            data.value = []; dictionary = {};
            dictionary.context = 'datasetsDictionary';
            dictionary.value = {
                "fileId": dataContext[key],
                "fileName": `${dataContext[key]}.json`,
                "properties": [ ...dataContext?.properties ],
                "description": dataContext?.description || ''
            }
            break;

        default:
            break;
    }
    return { key, data, dictionary };
}

export function stateBuilder(stateContext, location = {}) {
    if (!stateContext) return { modelKey: null, model: null };

    const keys = Array.isArray(stateContext) ? stateContext : [stateContext];
    const path = keys.map(layer => {
        if (layer === 'editingKey') return location.editingKey;
        if (layer === 'index') return location.index;
        return layer;
    });

    const modelKey = path.pop();
    const model = path.reduce((acc, key) => acc?.[key], state);

    return { modelKey, model, path };
}

// ==========================================
// UTILITY & ROUTING HELPERS
// ==========================================

export function toCamelCase(str) {
    if (!str) return '';
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9]/g, '');
}
export function isCamelCase(str) {
    return str.length > 0 && str === toCamelCase(str);
}

export function capitalize(str) {
    if (typeof str !== 'string' || !str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str) {
    if (typeof str !== 'string' || !str) return '';
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Splits camelCase
        .replace(/[-_]/g, ' ')               // Replaces hyphens/underscores with spaces
        .replace(/\b\w/g, char => char.toUpperCase());
}

export function isNumeric(str) {
    return typeof str === 'number' || typeof str === 'string' && str.trim() !== '' && !isNaN(str) && isFinite(str);
}

export function checkResourceObjectType(itemKey) {
    const val = state.resources[itemKey];
    if (Array.isArray(val)) return 'array';
    if (val && typeof val === 'object') return 'map';
    return typeof val;
}
