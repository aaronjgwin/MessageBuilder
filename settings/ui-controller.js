// File location: ./settings/ui-controller.js
import { ArrayBuilder } from '../widgets/ArrayBuilder.js';
import { MapBuilder } from '../widgets/MapBuilder.js';
import { SchemaBuilder } from '../widgets/SchemaBuilder.js';
import { LimitedListBuilder } from "../widgets/LimitedListBuilder.js";
import { SelectField } from "../widgets/SelectField.js";
import { TextField } from "../widgets/TextField.js";
import { ToggleField } from "../widgets/ToggleField.js";
import { downloadConfigurationPackage } from './export-service.js';
import { MESSAGES, UI_MESSAGES, getUIMessage } from './messages.js';
import {
    SCREENS, SETTINGS_FIELDS_CONFIG, HOME_VIEW_CONFIG,
    getLocation, getScreenName, goToEdit, goToAdd, goToParent, goToHome, getSingleton
} from './settings-config.js';
import {
    setActiveView,
    renderPageStructure,
    applySystemThemeProfile,
    populateFieldTypeOptions,
    populateFieldPropertyOptions,
    populateDefaultsPropertyOptions
} from './ui-elements.js';
import {
    state,
    isNumeric,
    syncFields,
    toCamelCase,
    stateBuilder,
    setupNewData,
    syncResources,
    saveContextName,
    loadInitialData,
    deleteSharedEdit,
    saveLinkedDefaultRule,
    deleteLinkedDefaultRule, capitalize, getTargetState
} from './data-manager.js';

const DEFAULT_ZIP_NAME = 'MessageBuilder-Configuration.zip';
export let location = null;

const WIDGET_MAP = {
    "text": TextField,
    "select": SelectField,
    "array": ArrayBuilder,
    "map": MapBuilder,
    "toggle": ToggleField,
    "schema": SchemaBuilder,
    "limited":LimitedListBuilder
}

document.addEventListener('DOMContentLoaded', async () => {
    location = getLocation();
    applySystemThemeProfile();
    await loadInitialData();
    setupNavigationListeners();
    setupActions();
    handleHashNavigation();
});



function handleHashNavigation() {
    location = getLocation(); console.log('handleHashNavigation', location, state);

    const activeViewId = location.container || 'homeView';
    if (!setActiveView(activeViewId, location.view ?? 'homeView')) {
        setActiveView('homeView', 'homeView');
        return;
    }

    switch (activeViewId) {
        case 'homeView': renderHomeView(); break;
        case 'editLinkedDefaultsScreen': renderEditLinkedDefaultsScreen(); break;
        case 'downloadSettingsScreen': renderDownloadSettingsScreen(); break;
        case 'newRecord': renderNewRecord(); break;
        //case 'properties': renderProperties(); break;
        default:
            renderScreen(activeViewId);
    }
}

function renderHomeView() {
    const rawConfig = HOME_VIEW_CONFIG;
    if (!rawConfig) return;

    let {fields, screenIds} = rawConfig;
    if (fields.length !== screenIds.length) return;

    fields.forEach((key, index) => {
        const fieldConfig = SETTINGS_FIELDS_CONFIG[key];
        const slot = document.getElementById(screenIds[index]);
        slot.innerHTML = '';
        const WidgetClass = WIDGET_MAP[fieldConfig?.fieldConfig?.type] || ArrayBuilder;
        const instance = new WidgetClass(
            key,
            fieldConfig.fieldConfig,
            fieldConfig?.onInputCallback || {},
            { currentValues: { [key]: state[fieldConfig?.stateContext] } }
        );
        slot.appendChild(instance.render());
    });

}

function renderNewRecord() {
    const { context, editingKey } = location;
    if (!['datasets'].includes(context)) return goToHome();
    const dictionary = {
        datasets: state?.datasetsDictionary?.[editingKey]?.properties
    }[context];

    if (!(Object.keys(dictionary).length > 0)) goToParent();

    const updateData = (value, fieldName) => {
        if (!fieldName || !value) return;
        dataContext[fieldName] = value;
    }
    let fields = [], fieldsConfig = {}, dataContext = {}, widgetConfig = {};
    dictionary.forEach(key => {
        fields.push(key);
        dataContext[key] = '';
        fieldsConfig[key] = {
            fieldConfig: {
                label: key,
                type: 'text',
                required: true,
                placeholder: 'Enter value...'
            }
        };
        widgetConfig[key] = {
            fieldType: fieldsConfig[key]?.fieldConfig?.type || null,
            fieldId: key,
            fieldConfig: fieldsConfig[key].fieldConfig || {},
            onInputCallback: updateData,
            dataContext: dataContext[key]
        }
    });
    const screenConfig = {
        fields: fields,
        screenId: 'newRecord',
        topic: 'addItem',
        title: `Add New ${capitalize(editingKey)} Record`,
        subtitle: 'Please fill out the data below'
    }
    const saveData = () => {
        let data = state?.[context]?.[editingKey];
        if (!Array.isArray(data)) {
            console.error(`state[${context}][${editingKey}] is not an array: `, data);
        } else { data.push(dataContext); }
        goToParent();
    }
    renderPageStructure(screenConfig, widgetConfig, dataContext, { cancel: goToParent, save: saveData });
}

function renderScreen(type) {
    if (!['add', 'edit', 'view', 'record'].includes(type)) goToHome();
    const { screen, editingKey, context, isEditing, index } = location;

    const isNew = type ==='add' || index === 'new';
    const isView = type ==='view';
    const isNewOrView = isNew || isView;

    const screenConfig = SCREENS[screen];

    // fieldId
    if (!screenConfig || !screenConfig.fields || screenConfig.fields.length <= 0) return;
    let tempScreenConfig = {...screenConfig};

    // fieldsConfig
    const fieldsConfig = (tempScreenConfig?.fields || []).reduce((acc, fieldName) => {
        let field = SETTINGS_FIELDS_CONFIG[fieldName];
        if (field) acc[fieldName] = field;
        return acc;
    }, {});


    // onInputCallback
    const updateData = (value, fieldName) => {
        if (!fieldName || !value) return;
        if (isNew) dataContext[fieldName] = value;
    }

    // dataContext
    let dataContext = {};

    // widgetConfig
    let widgetConfig = {};

    tempScreenConfig.fields = tempScreenConfig.fields.filter(key => {
        const { modelKey, model } = fieldsConfig[key]?.isKey
            ? { modelKey: key, model: dataContext[key] = isNew ? '' : editingKey }
            : stateBuilder(fieldsConfig[key]?.stateContext, location);

        const dataType = getDataType(model?.[modelKey]);
        if (context === 'resources' && isEditing && ['array', 'map'].includes(dataType) && dataType !== fieldsConfig[key]?.fieldConfig?.type){
            return false;
        }

        if (isNewOrView) dataContext[modelKey] = isView ? model[modelKey] : '';

        widgetConfig[key] = {
            fieldType: fieldsConfig[key]?.fieldConfig?.type || null,
            fieldId: modelKey,
            fieldConfig: fieldsConfig[key].fieldConfig || {},
            onInputCallback: updateData,
            dataContext: isNewOrView ? dataContext[key] : { currentValues: { [key]: dataContext[key] } }
        }
        if (!isNewOrView) widgetConfig[key].targetRecord = model;

        return true;
    });

    const saveData = () => {
        switch (true) {

            case type === 'add':
                const { key, data, dictionary } =
                    setupNewData(dataContext, location, screenConfig, (dataContext?.builderType === 'List (ARRAY)'));
                if(dataContext?.builderType) delete dataContext.builderType;
                saveContextName(dataContext[key], data, dictionary, location);
                window.location.hash = `${getScreenName(context, 'edit')}-${dataContext[key]}`;
                break;

            case location.type === 'record' && index === 'new': // todo field required ??? form isValid ?
                const { target } = getTargetState(location);
                console.log('saveData', dataContext, target);
                if (Array.isArray(target)) target.push(dataContext);
                goToParent();
                break;

            default:
                goToParent();
                break;
        }
    }

    const deleteData = () => {
        deleteSharedEdit(location);
        goToParent();
    }

    renderPageStructure(
        tempScreenConfig,
        widgetConfig,
        dataContext,
        { cancel: goToParent, save: saveData, add: goToAdd, delete: deleteData },
        { ...state },
        keyLocks()
    );
}

function renderEditLinkedDefaultsScreen() {
    const { index } = location;

    const titleEl = document.getElementById('linkedDefaultFormTitle');
    const indexInput = document.getElementById('linkedDefaultIndex');
    const deleteBtn = document.getElementById('deleteLinkedDefaultBtn');

    const isValidIndex = isNumeric(index) && index >= 0 && index < state.settingsLinkedDefaults.length;
     if (isValidIndex) {
        const item = state.settingsLinkedDefaults[index];
        titleEl.textContent = "Edit Linked Default Rule";
        indexInput.value = index;
        populateFieldTypeOptions(item.fieldType);
        populateFieldPropertyOptions(item.fieldType, item.fieldProperty);
        populateDefaultsPropertyOptions(state.settingsDefaults, item.defaultsProperty);
        deleteBtn.style.display = 'inline-block';
    } else {
        titleEl.textContent = "Add Linked Default Rule";
        indexInput.value = -1;
        populateFieldTypeOptions();
        populateFieldPropertyOptions('');
        populateDefaultsPropertyOptions(state.settingsDefaults);
        deleteBtn.style.display = 'none';
    }
}

function renderDownloadSettingsScreen() {
    const jsonSlot = document.getElementById('downloadJsonList');
    const datasetsSlot = document.getElementById('downloadDatasetsList');
    if (jsonSlot) {
        jsonSlot.innerHTML = ['json/fields.json', 'json/tabs.json', 'json/templates.json', 'json/settings.json', 'json/resources.json']
            .map(file => `<div class="array-item-row"><code>${file}</code></div>`).join('');
    }
    if (datasetsSlot) {
        datasetsSlot.innerHTML = (!state.settingsDatasets.length)
            ? '<div class="array-item-row"><em>No active datasets loaded</em></div>'
            : state.settingsDatasets.map(d => `<div class="array-item-row"><code>datasets/${typeof d === 'string' && d.endsWith('.json') ? d : `${d}.json`}</code></div>`).join('');
    }
}

function setupNavigationListeners() {
    document.getElementById('sidebarNavigationMenu')?.addEventListener('click', (event) => {
        const menuItem = event.target.closest('.nav-menu-item');
        if (menuItem?.dataset.target) window.location.hash = menuItem.dataset.target;
    });
    window.addEventListener('hashchange', handleHashNavigation);
}

function setupActions() {

    // OPEN //////////////////////////////////////////////////////////////////////////////////////////////////////
    const simpleOpens = {
        "exportJsonBtn": "downloadSettingsScreen",
        "addLinkedDefault": "editLinkedDefaultsScreen-new"
    };    

    for (let key in simpleOpens) {
        document.getElementById(key)?.addEventListener('click', () => { window.location.hash = simpleOpens[key]; });
    }

    document.getElementById('linkedFieldType')?.addEventListener('change', (e) => populateFieldPropertyOptions(e.target.value));

    // ADD //////////////////////////////////////////////////////////////////////////////////////////////////////

    // CXL //////////////////////////////////////////////////////////////////////////////////////////////////////

    ;[ // navToParentList
        "cancelLinkedDefaultBtn",
        "cancelDownloadBtn"
    ].forEach(id => {
        document.getElementById(id)?.addEventListener('click', goToParent);
    });

    // DEL //////////////////////////////////////////////////////////////////////////////////////////////////////

    document.getElementById('editListDeleteBtn')?.addEventListener('click', () => {
        deleteSharedEdit(location); goToParent();
    });
    document.getElementById('deleteLinkedDefaultBtn')?.addEventListener('click', () => {
        deleteLinkedDefaultRule(parseInt(document.getElementById('linkedDefaultIndex').value, 10)); goToParent();
    });

    // EDIT /////////////////////////////////////////////////////////////////////////////////////////////////////

    const nameInput = document.getElementById('editListNameInput');
    nameInput?.addEventListener('blur', (e) => { e.target.value = toCamelCase(e.target.value.trim()); });

    nameInput?.addEventListener('input', () => {
        const { isEditing, editingKey, context } = location;
        if (context !== 'fields') return;

        const proposedKey = toCamelCase(nameInput.value.trim());
        const isEditingSelf = isEditing && proposedKey === editingKey;
        const isDuplicate = Boolean(proposedKey) && !isEditingSelf && Object.hasOwn(state.fields, proposedKey);

        nameInput.classList.toggle('is-invalid', isDuplicate);

        // Locate or create the error message container
        let errorEl = nameInput.parentElement?.querySelector('.invalid-feedback');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'invalid-feedback';
            nameInput.after(errorEl);
        }

        if (isDuplicate) {
            const { body } = getUIMessage(UI_MESSAGES.duplicateKeyInView, proposedKey);
            errorEl.textContent = body;
            errorEl.style.display = 'block';
        } else {
            errorEl.style.display = 'none';
        }

        const saveBtn = document.getElementById('editListSaveBtn');
        if (saveBtn) saveBtn.disabled = isDuplicate;
    });

    document.getElementById('editListForm')?.addEventListener('submit', (e) => { e.preventDefault();
        const { isEditing, editingKey, context } = location;
        const newKey = toCamelCase(nameInput?.value.trim() || '');

        if (!newKey) {
            const { title, body } = getUIMessage(UI_MESSAGES.resourceNameRequired);
            alert(`${title}\n\n${body}`);
            return;
        }

        // Guard against duplicate keys in fields or resources
        const targetData = state[context] || {};
        const isEditingSelf = isEditing && newKey === editingKey;
        if (!isEditingSelf && Object.hasOwn(targetData, newKey)) {
            const { title, body } = getUIMessage(UI_MESSAGES.duplicateKeyInView, newKey);
            alert(`${title}\n\n${body}`);
            return;
        }

        saveContextName(newKey, state[context][editingKey], location);
        goToParent();
    });

    const hiddenFileInput = document.getElementById('hiddenDatasetFileInput');
    document.getElementById('importDatasetFileBtn')?.addEventListener('click', () => hiddenFileInput?.click());
    hiddenFileInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                const id = parsed?.dictionary?.fileId;
                if (!id) {
                    const { title, body } = getUIMessage(UI_MESSAGES.fileParseError);
                    alert(`${title}\n\n${body}`);
                    return;
                }
                if (!state.settingsDatasets.includes(id)) {
                    state.settingsDatasets.push(id);
                    renderHomeView();
                }
            } catch (err) {
                console.error(MESSAGES.FILE_IMPORT_ERROR, err);
                const { title, body } = getUIMessage(UI_MESSAGES.fileParseError);
                alert(`${title}\n\n${body}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    });

    document.getElementById('linkedDefaultForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        saveLinkedDefaultRule(
            parseInt(document.getElementById('linkedDefaultIndex').value, 10),
            {
                fieldType: document.getElementById('linkedFieldType').value,
                fieldProperty: document.getElementById('linkedFieldProperty').value,
                defaultsProperty: document.getElementById('linkedDefaultsProperty').value
            }
        );
        goToParent();
    });

    document.getElementById('executeZipDownloadBtn')?.addEventListener('click', async () => {
        try {
            await downloadConfigurationPackage(DEFAULT_ZIP_NAME);
        } catch (err) {
            console.error(MESSAGES.ALERT_EXPORT_FAILED, err);
        }
    });
}

function getDataType(val) {
    if (val === null) return 'null';
    if (Array.isArray(val)) return 'array';
    if (typeof val === 'object') return 'map';
    return typeof val;
}

function keyLocks() {
    let rtn = null;
    const { context, editingKey } = location;
    switch (context){
        case 'templates':
            rtn = state?.tabsByTemplate[editingKey] ?? [];
            break;
        default:
            break;
    }
    return rtn;
}

/**
 * Instantiates, hydrates, and renders a widget field.
 *
 * @param {Object} config - Dictionary of widget configurations
 * @param {Object} [data={}] - Input data payload for hydration
 * @returns {{ instance: Object, element: HTMLElement } | null}
 *
export function createWidgetField(config, data = {}) {
    if (!config) return;

    const { fieldType, fieldId, fieldConfig, onInputCallback, dataContext, targetRecord = null } = config;

    const WidgetClass = WIDGET_MAP[fieldType];

    if (!WidgetClass) {
        console.warn(`Widget class missing for type: "${fieldType}"`);
        return;
    }

    const args = [fieldId, fieldConfig, onInputCallback, dataContext];
    if (WidgetClass === SchemaBuilder) args.push({ ...state });

    const instance = new WidgetClass(...args);

    if (targetRecord) {
        instance.bindModel(targetRecord, fieldId);
    }

    // Hydrate widget data if present in input data payload
    const initialFieldValue = data ? data[fieldId] : undefined;
    if (initialFieldValue !== undefined) {
        if (typeof instance.setInputValue === 'function') {
            instance.setInputValue(initialFieldValue);
        } else if (typeof instance.setValue === 'function') {
            instance.setValue(initialFieldValue);
        }
    }

    // 4. Render DOM element
    const element = typeof instance.render === 'function'
        ? instance.render()
        : instance.createInputElement?.();

    return { instance, element };
}
 */
