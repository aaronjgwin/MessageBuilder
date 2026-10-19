// File location: ./settings/ui-elements.js
import { widgetConfigs } from '../widgets/_fieldConfig.js';
import { MESSAGES } from './messages.js';
import { ArrayBuilder } from '../widgets/ArrayBuilder.js';
import { MapBuilder } from '../widgets/MapBuilder.js';
import { SchemaBuilder } from '../widgets/SchemaBuilder.js';
import { SelectField } from "../widgets/SelectField.js";
import { TextField } from "../widgets/TextField.js";
import { ToggleField } from "../widgets/ToggleField.js";
import { getLocation, getSingleton } from "./settings-config.js";
import { capitalize } from './data-manager.js';
import { LimitedListBuilder } from "../widgets/LimitedListBuilder.js";


const WIDGET_MAP = {
    "text": TextField,
    "select": SelectField,
    "array": ArrayBuilder,
    "map": MapBuilder,
    "toggle": ToggleField,
    "schema": SchemaBuilder,
    "limited":LimitedListBuilder
};

export function applySystemThemeProfile() {
    const isEdge = navigator.userAgent.includes("Edg/");
    document.body.classList.toggle("is-edge", isEdge);
    document.body.classList.toggle("is-chrome", !isEdge);
}

export function setActiveView(viewId, activeNavTarget) {
    const screen = document.getElementById(viewId);
    if (!screen) return false;

    document.querySelectorAll('[data-type="view"], [data-type="screen"]').forEach(view => {
        view.classList.remove('active');
    });
    screen.classList.add('active');

    const navMenu = document.getElementById('sidebarNavigationMenu');
    navMenu?.querySelectorAll('.nav-menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.target === activeNavTarget);
    });

    return true;
}

function setSelectInnerHTML(name) {
    return `<option value="" disabled selected hidden>${MESSAGES.SELECT_PLACEHOLDER(name)}</option>`;
}

export function populateFieldTypeOptions(selectedType = '') {
    const typeSelect = document.getElementById('linkedFieldType');
    if (!typeSelect) return;

    typeSelect.innerHTML = setSelectInnerHTML('Field Type');
    Object.keys(widgetConfigs).forEach(typeKey => {
        const opt = document.createElement('option');
        opt.value = typeKey;
        opt.textContent = typeKey;
        typeSelect.appendChild(opt);
    });

    if (selectedType) typeSelect.value = selectedType;
}

export function populateFieldPropertyOptions(fieldType, selectedProperty = '') {
    const propSelect = document.getElementById('linkedFieldProperty');
    if (!propSelect) return;

    propSelect.innerHTML = setSelectInnerHTML('Field Property');
    if (!fieldType || !widgetConfigs[fieldType]) return;

    Array.from(widgetConfigs[fieldType]).forEach(propKey => {
        const opt = document.createElement('option');
        opt.value = propKey;
        opt.textContent = propKey;
        propSelect.appendChild(opt);
    });

    if (selectedProperty) propSelect.value = selectedProperty;
}

export function populateDefaultsPropertyOptions(defaultsMap, selectedDefaultKey = '') {
    const defaultSelect = document.getElementById('linkedDefaultsProperty');
    if (!defaultSelect) return;

    defaultSelect.innerHTML = setSelectInnerHTML('Default Key');
    Object.keys(defaultsMap).forEach(defaultKey => {
        const opt = document.createElement('option');
        opt.value = defaultKey;
        opt.textContent = defaultKey;
        defaultSelect.appendChild(opt);
    });

    if (selectedDefaultKey) defaultSelect.value = selectedDefaultKey;
}

export function renderPageStructure(pageConfig, fieldsConfig, data = {}, functions = {}, state = {}, keyLocks = []) {
    if (!pageConfig || !fieldsConfig) return null;
    const { type, isEditing, context } = getLocation();
    if (!['add', 'edit', 'view', 'record', 'newRecord'].includes(type)) return;
    //const isNew = type ==='add';
    const isView = type ==='view';
    //const isNewOrView = isNew || isView;

    const { screenId, topic, title, subtitle, save, fields, hideDelete = false, hideCancel = false } = pageConfig;

    const slot = document.getElementById(screenId);
    if (!slot) return null;
    slot.innerHTML = '';

    // Outer Container Wrapper
    const containerWrapper = document.createElement('div');
    containerWrapper.className = 'container-wrapper';

    // --- HEADER ---
    const containerHeader = document.createElement('div');
    containerHeader.className = 'container-header';

    const titleEl = document.createElement('h2');
    titleEl.id = `${topic}Title`;
    titleEl.textContent = title;
    containerHeader.append(titleEl);

    if (isEditing && !hideDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.id = `${topic}DeleteBtn`;
        deleteBtn.className = 'chrome-btn-danger';
        deleteBtn.textContent = 'Delete';
        if (functions && typeof functions.delete === 'function') {
            deleteBtn.addEventListener('click', functions.delete);
        }
        containerHeader.append(deleteBtn);
    }

    if (isView){
        const headerActions = document.createElement('div');
        headerActions.className = 'header-actions';
        containerHeader.append(headerActions);

        const addButtonEl = document.createElement('button');
        addButtonEl.type = 'button';
        addButtonEl.id = `${topic}AddBtn`;
        addButtonEl.className = 'chrome-btn-secondary';
        addButtonEl.textContent = `Add ${capitalize(getSingleton(context))}`;
        if (functions && typeof functions.add === 'function') {
            addButtonEl.addEventListener('click', functions.add);
        }
        headerActions.append(addButtonEl);
    }

    // --- SETTINGS CARD ---
    const settingsCard = document.createElement('div');
    settingsCard.className = 'settings-card';

    const form = document.createElement('form');
    form.id = `${topic}Form`;
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (instances.filter(f => f.checkRequiredValidation()).length) return;
        if (typeof functions?.save === 'function') await functions.save();
    });
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            // Prevent default form action first
            e.preventDefault();

            // Blur whatever active element currently has focus
            // (this forces its 'blur' event and validation to run!)
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }

            // Trigger the form submit handler
            if (typeof form.requestSubmit === 'function') {
                form.requestSubmit();
            } else {
                form.submit();
            }
        }
    });

    // Hidden Input
    const hiddenIndexInput = document.createElement('input');
    hiddenIndexInput.type = 'hidden';
    hiddenIndexInput.id = `${topic}Index`;
    hiddenIndexInput.value = '-1';
    form.append(hiddenIndexInput);

    if (!isView){

        // Action Toolbar Card
        const toolbarCard = document.createElement('div');
        toolbarCard.className = 'fields-action-toolbar-card';
        form.append(toolbarCard);

        const subTitle = document.createElement('span');
        subTitle.id = `${topic}SubTitle`;
        subTitle.className = 'toolbar-status-label';
        subTitle.textContent = subtitle;
        toolbarCard.append(subTitle);

        const toolbarActionsBlock = document.createElement('div');
        toolbarActionsBlock.className = 'toolbar-actions-block';
        toolbarCard.append(toolbarActionsBlock);

        if (!hideCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.id = `${topic}CancelBtn`;
            cancelBtn.className = 'chrome-btn-secondary';
            cancelBtn.textContent = 'Cancel';
            if (functions && typeof functions.cancel === 'function') {
                cancelBtn.addEventListener('click', functions.cancel);
            }
            toolbarActionsBlock.append(cancelBtn);
        }

        const saveBtn = document.createElement('button');
        saveBtn.type = 'submit';
        saveBtn.id = `${topic}SaveBtn`;
        saveBtn.className = 'chrome-btn-primary';
        saveBtn.textContent = save ?? '💾 SAVE CHANGES';
        //saveBtn.addEventListener('click', () => { });
        toolbarActionsBlock.append(saveBtn);
    
    }

    // Map to hold instantiated builder widget references
    const instances = [];

    fields.forEach(field => {
        const section = document.createElement('div');
        section.className = 'card-inner-padding section-border-bottom';
        form.append(section);

        const config = fieldsConfig[field];
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

        const element = typeof instance.render === 'function' ? instance.render() : instance.createInputElement();
        section.append(element);

        instances.push(instance);
    });

    settingsCard.appendChild(form);
    containerWrapper.append(containerHeader, settingsCard);
    slot.appendChild(containerWrapper);

    return instances;
}

