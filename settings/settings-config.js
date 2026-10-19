import { state,
    capitalize, checkResourceObjectType, isNumeric, syncActiveDatasets, syncDefaults } from "./data-manager.js";
import { widgetList } from "../widgets/_fieldConfig.js";



const ALLOWED_CONTEXTS = new Set([
    'datasets', 'fields', 'resources', 'tabs', 'templates', 'settings'
]);

const screenName = {
    view: 'view',
    add: 'add',
    edit: 'edit',
    record: 'record',
    newRecord: 'newRecord',
    properties: 'properties'
};

const addScreens = {
    datasets: ['fileId' , 'description', 'propertiesAdd'],
    fields: ['fieldName', 'fieldType', 'fieldLabel'],
    resources: ['resourceName', 'builderType'],
    tabs: ['tabId', 'tabLabel', 'tabHeader', 'subMenuId', 'subMenuLabel'],
    templates: ['templateKey', 'templateName']
};

const editScreens = {
    datasets: { fields:['fileId' , 'description', 'propertiesEdit', 'datasetItem'], hideDelete: true }, // todo
    fields: ['fieldName', 'fieldItem'],
    resources: ['resourceName' , 'resourceArrayItem','resourceMapItem'],
    tabs: ['tabId', 'tabLabel', 'tabHeader', 'subMenuId', 'subMenuLabel', 'subMenuDefault', 'subMenuOptions'],
    templates: ['templateKey', 'templateName', 'optionFieldIds', 'propertyValues']
};

const recordEditScreens = {
    datasets: ['datasetRecord'],
    templates: ['lineName', 'lineDefault', 'lineValue']
};

const viewScreens = {
    datasets: { fields:['datasetsKeys'], title: 'Datasets', singleton: 'dataset' },
    fields: { fields:['fieldsKeys'], title: 'Fields Configuration', singleton: 'field' },
    resources: { fields:['resourcesKeys'], title: 'Resources', singleton: 'resource' },
    tabs: { fields:['tabsKeys'], title: 'Tabs Navigation', singleton: 'tab' },
    templates: { fields:['templatesKeys'], title: 'Templates Registry', singleton: 'template' }
};

export const HOME_VIEW_CONFIG = {
    fields: [ 'settingsDefaults', 'settingsLinkedDefaultsKeys', 'settingsDatasets' ],
    screenIds: [ 'homeDefaultsList', 'homeLinkedDefaultsList', 'homeActiveDatasetsList' ]
}

const PARENT_SCREENS = {
    'homeView': 'homeView',
    'downloadSettingsScreen': 'homeView',
    'editLinkedDefaultsScreen': 'homeView',
}

// ===================================================================
//   PARENT_SCREENS - config & load
// ===================================================================

const ALLOWED_TYPES = new Set(Object.keys(screenName));
const hasRecordScreens = Object.keys(recordEditScreens);

function loadParentScreens() {

    ALLOWED_CONTEXTS.forEach(context => {
        if (context === 'settings') return;

        ALLOWED_TYPES.forEach(type => {
            if (type === 'record' && !hasRecordScreens.includes(context)) return;

            const currentScreen = getScreenName(context, type);
            const parentTarget = type === 'record' ? 'edit' : 'view';

            PARENT_SCREENS[currentScreen] = type === 'view' ? 'homeView' : getScreenName(context, parentTarget);
        });
    });
}
loadParentScreens();
//console.log('PARENT_SCREENS', PARENT_SCREENS);

// ===================================================================
//   SCREENS - config & load
// ===================================================================

export const SCREENS = {};
function loadScreens(){

    function setTitle(screen, prefix = '', suffix = '', hasIndex = false) {
        if (!('title' in screen)) {
            Object.defineProperty(screen, 'title', {
                get() {
                    let location = getLocation();
                    return `${prefix}${capitalize(location?.editingKey) ?? ''}${suffix}${hasIndex ? location.index : ''}`;
                },
                enumerable: true,
                configurable: true
            });
        }
    }
    function setContext(screen) {
        if (!('context' in screen)) {
            Object.defineProperty(screen, 'context', {
                get() {
                    let location = getLocation();
                    return `${location?.context ?? ''}`;
                },
                enumerable: true,
                configurable: true
            });
        }
    }

    Object.keys(addScreens).forEach(key => {
        if (Array.isArray(addScreens[key])) addScreens[key] = { fields: [...addScreens[key]] };

        const screen = addScreens[key];
        if (!screen?.fields) return;

        screen.screenId ??= screenName.add;
        screen.topic    ??= 'addItem';
        screen.title    ??= `Add New ${capitalize(key)}`;
        screen.subtitle ??= 'Please fill out the data below';
        screen.save     ??= 'Next';
        setContext(screen);

        SCREENS[`${screen.screenId}-${key}`] = screen;
    });

    Object.keys(editScreens).forEach(key => {
        if (Array.isArray(editScreens[key])) editScreens[key] = { fields: [...editScreens[key]] };

        const screen = editScreens[key];
        if (!screen?.fields) return;

        screen.screenId ??= screenName.edit;
        screen.topic    ??= 'editItem';
        screen.subtitle ??= 'Editing Structure';
        setTitle(screen, 'Edit Item: ');

        SCREENS[`${screen.screenId}-${key}`] = screen;
    });

    Object.keys(viewScreens).forEach(key =>{
        if (Array.isArray(viewScreens[key])) viewScreens[key] = { fields: [...viewScreens[key]] };

        const screen = viewScreens[key];
        if (!screen?.fields) return;

        screen.screenId ??= screenName.view;
        screen.topic    ??= 'viewItem';
        screen.isView = true;
        setTitle(screen);

        SCREENS[`${screen.screenId}-${key}`] = screen;
    });

    Object.keys(recordEditScreens).forEach(key =>{
        if (Array.isArray(recordEditScreens[key])) recordEditScreens[key] = { fields: [...recordEditScreens[key]] };

        const screen = recordEditScreens[key];
        if (!screen?.fields) return;

        screen.screenId ??= screenName.record;
        screen.topic    ??= 'recordItem';
        screen.subtitle ??= 'Editing Structure';
        //screen.hideCancel = true;
        //screen.save     ??= 'Back';
        setTitle(screen,'',' Item: ',true);

        SCREENS[`${screen.screenId}-${key}`] = screen;
    });

}
loadScreens();

// ===================================================================
//   SETTINGS_FIELDS_CONFIG - config & load
// ===================================================================

export const SETTINGS_FIELDS_CONFIG = {

    // ===================================================================
    //   View
    // ===================================================================

    fieldsKeys: {
        stateContext: ['fieldsKeys'],
        fieldConfig: {
            label: 'CONFIGURED FIELDS',
            type: 'array',
            filterPlaceholder: 'Filter fields by name...',
            showAddButton: false,
            allowObjectEdit: true,
            onEditItem: (index, itemKey) => goToEdit(index, itemKey),
            getItemType: (itemKey) => state.fields[itemKey]?.type ?? null
        }
    },

    tabsKeys: {
        stateContext: ['tabsKeys'],
        fieldConfig: {
            label: 'CONFIGURED TABS',
            type: 'array',
            filterPlaceholder: 'Filter tabs by name...',
            showAddButton: false,
            allowObjectEdit: true,
            onEditItem: (index, itemKey) => goToEdit(index, itemKey),
            get displayValues () { return state.tabsNamesAndKeys; }
        }
    },
/*
    templateProperties: {
        stateContext: ['templatesDictionary', 'propertyNames'],
        fieldConfig: {
            label: 'Template Lines',
            type: 'array',
            showSearchAddRow: true,
            showEditToggle: true,
            isEditingLocked: true,
            allowObjectEdit: true,
            allowDrag: false,
            onEditItem: (index) => goToRecord(index, 'lines'),
            overrideAddBtnEvent: () => goToRecord('new', 'lines')
        }
    },
*/
    templatesKeys: {
        stateContext: ['templatesKeys'],
        fieldConfig: {
            label: 'CONFIGURED TEMPLATES',
            type: 'array',
            filterPlaceholder: 'Filter templates by name...',
            showAddButton: false,
            allowObjectEdit: true,
            onEditItem: (index, itemKey) => goToEdit(index, itemKey),
            get displayValues () { return state.templatesNamesAndKeys; }
        }
    },

    resourcesKeys: {
        stateContext: ['resourcesKeys'],
        fieldConfig: {
            label: 'CONFIGURED RESOURCES',
            type: 'array',
            filterPlaceholder: 'Filter resources by name...',
            showAddButton: false,
            allowObjectEdit: true,
            onEditItem: (index, itemKey) => goToEdit(index, itemKey),
            getItemType: (itemKey) => checkResourceObjectType(typeof itemKey === 'object' ? itemKey.key : itemKey)
        }
    },

    datasetsKeys: {
        stateContext: ['datasetsKeys'],
        fieldConfig: {
            label: 'CONFIGURED DATASETS',
            type: 'array',
            filterPlaceholder: 'Filter datasets by name...',
            showAddButton: false,
            allowObjectEdit: true,
            onEditItem: (index, itemKey) => goToEdit(index, itemKey)
        }
    },

    // ===================================================================
    //   Home - Fields
    // ===================================================================

    settingsDatasets: {
        stateContext: ['settingsDatasets'],
        onInputCallback: syncActiveDatasets,
        fieldConfig: {
            label: 'REGISTERED DATASET FILES (FILEID)',
            type: 'array',
            filterPlaceholder: 'Filter dataset names by fileId...',
            showAddButton: false,
            showEditToggle: true,
            isEditingLocked: true
        }
    },

    settingsDefaults: {
        stateContext: ['settingsDefaults'],
        onInputCallback: syncDefaults,
        fieldConfig: {
            label: 'SYSTEM DEFAULTS MAP',
            type: 'map',
            keyPlaceholder: 'enter new key...',
            valuePlaceholder: 'enter new value or true / false...',
            showEditToggle: true,
            isEditingLocked: true
        }
    },

    settingsLinkedDefaultsKeys: {
        stateContext: ['settingsLinkedDefaultsKeys'],
        fieldConfig: {
            label: 'FIELD PROPERTY TO DEFAULT MAP',
            type: 'array',
            showSearchAddRow: false,
            showEditToggle: false,
            isEditingLocked: false,
            allowObjectEdit: true,
            onEditItem: (i) => { window.location.hash = `editLinkedDefaultsScreen-${i}`; }
        }
    },

    // ===================================================================
    //   Edit - Fields
    // ===================================================================

    // fields ////////////////////////////////////////////////////////////

    fieldName: {
        stateContext: ['fields', 'editingKey'],
        isKey: true,
        fieldConfig: {
            label: 'Field Name',
            type: 'text',
            placeholder: 'Enter name...',
            enforceCamelCase: true,
            required: true,
            get disallowedValues () { return getKeys(); }
        }
    },

    fieldType: {
        stateContext: ['fields', 'type'],
        fieldConfig: {
            label: 'Type',
            type: 'select',
            options: widgetList,
            placeholder: '-- Select Field Type --',
            required: true
        }
    },

    fieldLabel: {
        stateContext: ['fields', 'label'],
        fieldConfig: {
            label: 'Label',
            type: 'text',
            placeholder: 'Enter label...',
            required: true
        }
    },

    fieldItem: {
        stateContext: ['fields', 'editingKey'],
        fieldConfig: {
            label: "MAP PROPERTIES",
            type: 'schema',
            keyPlaceholder: "enter key...",
            valuePlaceholder: "enter value or true / false...",
            showEditToggle: false,
            isEditingLocked: false
        }
    },

    // resources ////////////////////////////////////////////////////////

    resourceName: {
        stateContext: ['resources', 'editingKey'],
        isKey: true,
        fieldConfig: {
            label: 'Resource Name',
            type: 'text',
            placeholder: 'Enter name...',
            enforceCamelCase: true,
            required: true,
            get disallowedValues () { return getKeys(); }
        }
    },

    builderType: {
        stateContext: [], // not a data field
        isKey: true,
        fieldConfig: {
            label: 'Resources Type',
            type: 'select',
            options: ['List (ARRAY)', 'Key/Value List (MAP)'],
            placeholder: '-- Select Resources Type --',
            required: true
        }
    },

    resourceArrayItem: {
        stateContext: ['resources', 'editingKey'],
        fieldConfig: {
            label: 'ARRAY VALUES',
            type: 'array',
            filterPlaceholder: 'Filter values...',
            showSearchAddRow: true,
            showEditToggle: false,
            isEditingLocked: false
        }
    },

    resourceMapItem: {
        stateContext: ['resources', 'editingKey'],
        fieldConfig: {
            label: "MAP PROPERTIES",
            type: 'map',
            keyPlaceholder: "enter key...",
            valuePlaceholder: "enter value or true / false...",
            showEditToggle: false,
            isEditingLocked: false
        }
    },

    // datasets ///////////////////////////////////////////////////////////

    fileId: {
        stateContext: ['datasets', 'editingKey'],
        isKey: true,
        fieldConfig: {
            label: 'File Name (.json)',
            type: 'text',
            placeholder: 'Enter name...',
            enforceCamelCase: true,
            required: true,
            get disallowedValues () { return getKeys(); }
        }
    },

    description: {
        stateContext: ['datasetsDictionary', 'editingKey', 'description'],
        fieldConfig: {
            label: 'Description',
            type: 'text',
            placeholder: 'Enter description...'
        }
    },

    propertiesAdd: {
        stateContext: ['datasetsDictionary', 'editingKey', 'properties'],
        fieldConfig: {
            label: 'PROPERTIES',
            type: 'array',
            filterPlaceholder: 'Enter new property...',
            showSearchAddRow: true,
            showEditToggle: false,
            isEditingLocked: false
        }
    },

    propertiesEdit: {
        stateContext: ['datasetsDictionary', 'editingKey', 'properties'],
        fieldConfig: {
            label: 'PROPERTIES',
            type: 'array',
            filterPlaceholder: 'Filter values...',
            showSearchAddRow: true,
            showEditToggle: false,
            isEditingLocked: true
        }
    },

    datasetItem: {
        stateContext: ['datasets', 'editingKey'],
        fieldConfig: {
            label: 'RECORDS',
            type: 'array',
            filterPlaceholder: 'Filter records...',
            showSearchAddRow: true,
            showEditToggle: false,
            isEditingLocked: false,
            allowObjectEdit: true,
            onEditItem: (index) => goToRecord(index),
            overrideAddBtnEvent: () => goToNewRecord()
        }
    },

    // tabs //////////////////////////////////////////////////////////////

    tabId: {
        stateContext: ['tabs', 'editingKey'],
        isKey: true,
        fieldConfig: {
            label: 'Tab ID',
            type: 'text',
            placeholder: 'Enter ID...',
            enforceCamelCase: true,
            required: true,
            get disallowedValues () { return getKeys(); }
        }
    },

    tabLabel: {
        stateContext: ['tabs', 'editingKey', 'name'],
        fieldConfig: {
            label: 'Name',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    tabHeader: {
        stateContext: ['tabs', 'editingKey', 'header'],
        fieldConfig: {
            label: 'Header',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    subMenuId: {
        stateContext: ['tabs', 'editingKey', 'submenu', 'id'],
        fieldConfig: {
            label: 'Menu ID',
            type: 'text',
            placeholder: 'Enter value...',
            enforceCamelCase: true,
            required: true
        }
    },

    subMenuLabel: {
        stateContext: ['tabs', 'editingKey', 'submenu', 'label'],
        fieldConfig: {
            label: 'Menu Label',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    subMenuDefault: {
        stateContext: ['tabs', 'editingKey', 'submenu', 'default'],
        fieldConfig: {
            label: 'Default Option',
            type: 'select',
            get options() {
                let options = [];
                state?.templatesByTab?.[getLocation().editingKey].forEach(templateId => {
                    options.push({ label:state?.templatesNamesAndKeys?.[templateId], value: templateId });
                });
                return options;
            }
        }
    },

    subMenuOptions: {
        stateContext: ['tabs', 'editingKey', 'submenu', 'options'],
        fieldConfig: {
            label: 'Templates',
            type: 'limited',
            filterPlaceholder: 'add template...',
            showSearchAddRow: true,
            showEditToggle: false,
            isEditingLocked: false,
            get options () { return getStateArraySorted('templatesKeys'); },
            get displayValues () { return state.templatesNamesAndKeys; }
        }
    },

    optionLabel: {
        stateContext: ['tabs', 'editingKey', 'submenu', 'options','index', 'label'],
        fieldConfig: {
            label: 'Submenu Option Label',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    optionValue: {
        stateContext: ['tabs', 'editingKey', 'submenu', 'options','index','value'],
        fieldConfig: {
            label: 'Template ID',
            type: 'select',
            placeholder: 'Select Template...',
            required: true,
            get options () { return getStateArraySorted('templatesKeys'); }
        }
    },

    optionFieldIds: {
        stateContext: ['templates', 'editingKey', 'fieldIds'],
        fieldConfig: {
            label: 'Field Names',
            type: 'limited',
            showAddButton: true,
            filterPlaceholder: 'add field...',
            showEditToggle: false,
            isEditingLocked: false,
            get options () { return getStateArraySorted('fieldsKeys'); }
        }
    },

// templates /////////////////////////////////////////////////////////

    // -- VIEW ----------------------------------------------


    // -- EDIT ----------------------------------------------
    templateKey: {
        stateContext: ['templates', 'editingKey'],
        isKey: true,
        fieldConfig: {
            label: 'Template Key',
            type: 'text',
            placeholder: 'Enter value...',
            enforceCamelCase: true,
            required: true,
            get disallowedValues () { return getKeys(); },
            get keyLocks () { return {
                ids: state?.tabsByTemplate[getLocation()?.editingKey] ?? [],
                labels: state?.tabsNamesAndKeys ?? {},
                context: 'Tabs'
            }}
        }
    },

    templateName: {
        stateContext: ['templates', 'editingKey', 'templateName'],
        fieldConfig: {
            label: 'Template Name',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    templateNameKey: {
        stateContext: ['templates', 'editingKey', 'templateName'],
        isKey: true,
        fieldConfig: {
            label: 'Template Name',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    propertyValues: {
        stateContext: ['templates', 'editingKey', 'propertyValues'],
        fieldConfig: {
            label: 'Lines',
            type: 'array',
            filterPlaceholder: 'Filter values...',
            multiline: true,
            showEditToggle: false,
            isEditingLocked: false,
            allowObjectEdit: true,
            onEditItem: (index) => goToRecord(index),
            overrideAddBtnEvent: () => goToRecord('new')
        }
    },

    // -- REPORT -------------------------------------------------------

    linePropertyName: {
        stateContext: ['templatesDictionary', 'propertyNames', 'index', 'name'],
        fieldConfig: {
            label: 'Name',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    linePropertyDefault: {
        stateContext: ['templatesDictionary', 'propertyNames', 'index', 'default'],
        fieldConfig: {
            label: 'Default',
            type: 'select',
            options: [] // todo replace / investigate
        }
    },

    lineName: {
        stateContext: ['templates', 'editingKey', 'propertyValues', 'index', 'name'],
        fieldConfig: {
            label: 'Name',
            type: 'text',
            placeholder: 'Enter value...',
            required: true
        }
    },

    lineDefault: {
        stateContext: ['templates', 'editingKey', 'propertyValues', 'index', 'default'],
        fieldConfig: {
            label: 'Default',
            type: 'select',
            get options () { return getStateArraySorted('settingsDefaultsKeys'); }
        }
    },

    lineValue: {
        stateContext: ['templates', 'editingKey', 'propertyValues', 'index', 'value'],
        fieldConfig: {
            label: 'Value',
            type: 'text',
            multiline: true,
            placeholder: 'Enter value or leave black if you want to use the default value...'
        }
    },

    // ===================================================================
    //   Sub-Edit - Datasets
    // ===================================================================

    datasetRecord: {
        stateContext: ['datasets', 'editingKey', 'index'],
        fieldConfig: {
            label: "RECORD",
            type: 'schema',
            showAddRow: false,
            clearField: true,
            showEditToggle: false,
            isEditingLocked: false
        }
    }

};

// ===================================================================
//   Export Functions
// ===================================================================

export function getSingleton(context) {
    const list = {
        'datasets': 'dataset',
        'fields': 'field',
        'resources': 'resource',
        'settings': 'setting',
        'tabs': 'tab',
        'templates': 'template'
    }
    return Object?.keys(list)?.includes(context) ? list[context] : '';
}

export function getScreenName(context, type) {
    if (!ALLOWED_CONTEXTS.has(context) || !ALLOWED_TYPES.has(type)) return;
    return `${screenName[type]}-${context}`;
}

export function goToHome() {
    window.location.hash ='homeView';
}

export function goToParent() {
    const { parent} = getLocation();
    window.location.hash = parent  || 'homeView';
}

export function goToAdd() {
    window.location.hash = `${getScreenName(getLocation().context, 'add')}`;
}

export function goToEdit(index, itemKey, overrideKey = null) {
    window.location.hash = `${getScreenName(getLocation().context, !overrideKey ? 'edit' : overrideKey)}-${itemKey}`;
}

export function goToRecord(index, overrideKey = null) {
    const { editingKey, context } = getLocation();
    window.location.hash = `${getScreenName(context, 'record')}-${overrideKey ? overrideKey : editingKey}-${index}`;
}

export function goToNewRecord() {
    const { fullContext } = getLocation();
    window.location.hash = `newRecord-${fullContext}`;
}

export function getLocation() {
    const location = {
        // full address
        hash: 'homeView',
        // components
        container: 'homeView',
        context: null,
        editingKey: null,
        index: null,
        // hierarchy
        fullContext: null,
        screen: null,
        parent: 'homeView',
        view: 'homeView',
        // page info
        isEditing: false,
        isNewArray: false,
        type: null,
        length: null
    };


    const rawHash = decodeURIComponent(window.location.hash.slice(1));
    if (!rawHash) return location;

    const hashArray = rawHash.split('-');
    const [ container, context, editingKey, index] = hashArray;

    // length
    location.length = hashArray.length;

    // hash
    location.hash = rawHash;

    // container
    location.container = container;

    // context
    if (ALLOWED_CONTEXTS.has(context)) location.context = context;

    // editingKey
    if (editingKey) location.editingKey = isNumeric(editingKey) ?  parseInt(editingKey, 10) : editingKey;

    // index
    if (index) location.index = isNumeric(index) ?  parseInt(index, 10) : index;

    // type
    const type = screenTypeByPrefix[container];
    location.type = ['add', 'edit', 'view', 'record', 'newRecord'].includes(type) ? type : null;

    // isEditing
    location.isEditing = ['edit', 'record'].includes(type);

    location.screen = type ? getScreenName(context, type) : context ? `${container}-${context}` : container;

    switch (location.length) {
        case 4:
            if(location.context) location.fullContext = hashArray.slice(0, -1).join('-');
            if (location.fullContext === 'record-templates-lines') {
                location.parent = getScreenName(context, 'view');
            } else {
                location.parent = PARENT_SCREENS[`${container}-${context}`] + `-${editingKey}`;
            }
            location.view = getScreenName(context, 'view');
            break;
        case 3:
            if(location.context) location.fullContext = `${context}-${editingKey}`;
            location.parent = type !== 'newRecord' ? PARENT_SCREENS[location.screen] : `edit-${context}-${editingKey}`;
            location.view = getScreenName(context, 'view');
            break;
        case 2:
            if (!location.context) location.index = isNumeric(context) ?  parseInt(context, 10) : context;
            if (location.context) location.fullContext = context;
            location.parent = location.context ? PARENT_SCREENS[location.screen] : 'homeView';
            location.view = location.context ? getScreenName(context, 'view') : 'homeView';
            break;
        case 1:
        default:
            location.parent = 'homeView';
            location.view = 'homeView';
            break;
    }

    return location;
}

// ===================================================================
//   Helper Functions
// ===================================================================

const screenTypeByPrefix = Object.fromEntries(
    Object.entries(screenName).map(([type, prefix]) => [prefix, type])
);

function getKeys(){
    const { context } = getLocation();
    return state[context] ? Object.keys(state[context]) : [];
}
const getStateArray = key => state[key] ?? [];
const getStateArraySorted = key => [...getStateArray(key)].sort((a, b) => a.localeCompare(b));
//
