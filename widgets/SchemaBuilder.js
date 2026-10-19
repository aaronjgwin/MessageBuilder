// File location: ./widgets/SchemaBuilder.js
import { MapBuilder } from './MapBuilder.js';
import { widgetList } from "./_fieldConfig.js";
const PROTECTED_SCHEMA_KEYS = ['label', 'type'];
let dynamicOptionsMap = {};

export class SchemaBuilder extends MapBuilder {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}, dataState = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        this.fieldType = dataState?.fields?.[this.fieldId]?.type || null;
        this.widgetConfigsArray = dataState?.widgetConfigs || [];
        this.widgetConfig = this.widgetConfigsArray[this.fieldType] || [];
        this.resourcesArrayKeys = dataState?.resourcesArrayKeys || [];
        this.resourcesMapKeys = dataState?.resourcesMapKeys || {};
        this.settingsDatasets = dataState?.settingsDatasets || [];
        this.masterFieldConfigList = dataState?.masterFieldConfigList || {};
        this.widgetList = widgetList;
        this.inputPlaceholder= 'Select property key first...';
        this.pendingValue = '';

        dynamicOptionsMap = {
            widgetList: this.widgetList,
            activeDatasets: this.settingsDatasets,
            resourcesArrayKeys: this.resourcesArrayKeys,
            resourcesMapKeys: this.resourcesMapKeys
        };

    }
    render() {
        super.render();
        this.group.classList.add(`${super.constructor.name.toLowerCase()}-widget`);
        return this.group;
    }

    createKeyValuePair(insertionRow) {
        const keyInput = document.createElement('select');
        keyInput.className = 'form-input-field map-key-input';
        keyInput.setAttribute('data-role', 'key');
        keyInput.addEventListener('change', (e) => {
            const selectedKey = e.target.value;
            if (!selectedKey) {
                this.resetValueInputContainer();
                return;
            }
            this.createValueInputElement(selectedKey, '', true);
        });
        this.newMapKeyEl = keyInput;
        insertionRow.appendChild(keyInput);

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'form-input-field map-value-input';
        valueInput.placeholder = this.inputPlaceholder;
        valueInput.disabled = true;
        valueInput.setAttribute('data-role', 'value');

        this.newMapValueEl = valueInput;
        this.newMapValueElContainer = valueInput;

        insertionRow.appendChild(valueInput);
        this.populateKeyOptionsSelect();
    }

    resetValueInputContainer() {
        const defaultInput = document.createElement('input');
        defaultInput.type = 'text';
        defaultInput.className = 'form-input-field map-value-input';
        defaultInput.placeholder = this.inputPlaceholder;
        defaultInput.disabled = true;

        if (this.newMapValueElContainer) {
            this.newMapValueElContainer.replaceWith(defaultInput);
            this.newMapValueElContainer = defaultInput;
            this.newMapValueEl = defaultInput;
        }
        this.pendingValue = '';
    }

    populateKeyOptionsSelect(type = null) {
        if (!this.newMapKeyEl) return;

        if (type) this.widgetConfig = this.widgetConfigsArray[type];
        const unusedKeys = this.getUnusedKeys();

        this.newMapKeyEl.options.length = 0;

        if (unusedKeys.length === 0) {

            this.newMapKeyEl.add(new Option('type', 'type'));
            this.newMapKeyEl.value = 'type';
            this.createValueInputElement('type', '', true);

        } else {

            this.newMapKeyEl.add(new Option('-- Select Property --', ''));
            unusedKeys.forEach(key => {
                this.newMapKeyEl.add(new Option(key, key));
            });
            this.newMapKeyEl.value = '';

        }
    }

    checkDisabledStatus(key){
        return PROTECTED_SCHEMA_KEYS.includes(key);
    }

    createValueInputElement(key, currentValue, isNewRow = false) {
        const masterDef = this.getMasterDef(key);
        const controlType = masterDef.type || 'text';
        let isInteger = false;

        // Internal handler replaces the passed-in callback
        const handleValueChange = (val) => {
            if (isNewRow) {
                this.pendingValue = val;
            } else {
                this.dictionary[key] = val;
                this.onInput?.(this.getValue(), this.fieldId);
            }
        };

        let element;
        switch (controlType) {
            case 'toggle': {
                element = document.createElement('div');
                element.className = 'map-row-toggle form-toggle-field'; // form-input-field
                const lbl = document.createElement('label');
                lbl.className = 'toggle-switch map-row-toggle';

                const input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = Boolean(currentValue);
                input.addEventListener('change', (e) => handleValueChange(e.target.checked));
                lbl.appendChild(input);

                const span = document.createElement('span');
                span.className = 'toggle-slider';
                lbl.appendChild(span);

                element.appendChild(lbl);

                if (isNewRow) { this.newMapValueEl = input; this.pendingValue = input.checked; }
                break;
            }

            case 'select': {
                element = document.createElement('select');
                element.className = 'form-input-field map-value-input';
                element.disabled = (key === 'type' && !isNewRow);

                const optionsList = dynamicOptionsMap[masterDef?.context] || [];
console.log('select', masterDef?.context, dynamicOptionsMap);
                element.add(new Option('-- Select Option --', ''));
                optionsList.forEach(optionKey => {
                    element.add(new Option(optionKey, optionKey));
                });

                element.value = currentValue || '';
                element.addEventListener('change', (e) => handleValueChange(e.target.value));

                if (isNewRow) { this.newMapValueEl = element; this.pendingValue = element.value; }
                break;
            }

            case 'integer': isInteger = true;
            case 'text':
            default: {
                element = document.createElement('input');
                element.type = !isInteger ? 'text' : 'number';
                element.className = 'form-input-field map-value-input';
                element.placeholder = masterDef.placeholder || 'Enter value...';

                if (typeof currentValue === 'object' && currentValue !== null) {
                    element.value = currentValue; //JSON.stringify(currentValue);
                } else {
                    element.value = currentValue ?? '';
                }

                element.addEventListener('input', (e) => {
                    const val = e.target.value;
                    handleValueChange(val === '' ? '' : (!isInteger ? val : parseInt(val, 10)));
                });

                if (isNewRow) { this.newMapValueEl = element; }
                break;
            }
        }

        if (isNewRow && this.newMapValueElContainer) {
            this.newMapValueElContainer.replaceWith(element);
            this.newMapValueElContainer = element;
        }
        return element;
    }

    handleAppendPairItem() {
        if (this.isEditingLocked || !this.newMapKeyEl) return;

        const selectedKey = this.newMapKeyEl.value;
        if (!selectedKey) {
            this.showErrorMessage("Please select a property key.");
            return;
        }

        if (this.dictionary[selectedKey] !== undefined) {
            this.showErrorMessage(`The key "${selectedKey}" already exists.`);
            return;
        }
        this.clearErrorMessage('handleAppendPairItem', selectedKey);

        // Commit the selected key and its current pending value
        this.dictionary[selectedKey] = this.pendingValue;

        // Reset row state and repopulate dropdown options
        this.pendingValue = '';
        this.resetValueInputContainer();
        this.populateKeyOptionsSelect(selectedKey === 'type' ? this.dictionary[selectedKey] : null);
        this.renderLiveListItems();

        if (this.onInput) this.onInput(this.getValue(), this.fieldId);
    }

    // helpers ////////////////////////////////////////////////////////////////////////////////////////

    getUnusedKeys() {
        // Standardize widgetConfig items whether it's an array of key strings or objects
        const availableKeys = Array.isArray(this.widgetConfig)
            ? this.widgetConfig.map(item => (typeof item === 'object' && item !== null ? (item.key || item.name) : item))
            : [];

        return availableKeys.filter(key => key && !(key in (this.dictionary || {})));
    }

    hasMasterKey(key) {
        if (!key) return false;
        return (this.masterFieldConfigList instanceof Map)
            ? this.masterFieldConfigList.has(key)
            : Object.hasOwn(this.masterFieldConfigList || {}, key);
    }

    getMasterDef(key) {
        if (!key) return {};
        return (this.masterFieldConfigList instanceof Map)
            ? this.masterFieldConfigList.get(key) || {}
            : this.masterFieldConfigList?.[key] || {};
    }
}