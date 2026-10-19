import BaseField from './BaseField.js';

export class CheckboxGroupField extends BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);
        this.selectAllToggle = null;
        this.resolvedOptions = [];
        this.translationMap = null;
        this.recordsArray = this.config.staticOptions || []; // FormBuilder handles loading the values from the jsonFileName

        this.prefix = this.config.prefix || '';
        this.options = this.config.resourceArray || null;
        this.resourceMap = this.config.resourceMap || null;
        this.includePrefixInString = this.config.includePrefixInString ?? false;
        this.default = this.config.default || [];
        this.jsonFileName = this.config.jsonFileName || null;
        this.displayFormat = this.config.displayFormat || null;
        this.toStringFormat = this.config.toStringFormat || null;
        this.groupBy = this.config.groupBy || null;
        this.sortOrder = this.config.sortOrder || null

        this.initOptionsAndTranslationMap();
    }

    /**
     * Prioritizes dynamic setting-driven file options from the base layer engine
     */
    initOptionsAndTranslationMap() {
        if (this.config.staticOptions && Array.isArray(this.config.staticOptions)) {
            this.resolvedOptions = this.config.staticOptions;
            return;
        }

        const configOptions = this.options;
        const resourceMapKey = this.resourceMap;

        if (configOptions) {
            if (Array.isArray(configOptions)) {
                this.resolvedOptions = configOptions;
            } else if (typeof configOptions === 'string') {
                if (this.context[configOptions] && Array.isArray(this.context[configOptions])) {
                    this.resolvedOptions = this.context[configOptions];
                } else if (this.context.resources && Array.isArray(this.context.resources[configOptions])) {
                    this.resolvedOptions = this.context.resources[configOptions];
                } else if (this.context.settingsDefaults && Array.isArray(this.context.settingsDefaults[configOptions])) { // revisit
                    this.resolvedOptions = this.context.settingsDefaults[configOptions]; // revisit
                } else if (window.cameraMasterConfig && Array.isArray(window.cameraMasterConfig[configOptions])) { // revisit
                    this.resolvedOptions = window.cameraMasterConfig[configOptions]; // revisit
                }
            }
        }

        if (!this.resolvedOptions || this.resolvedOptions.length === 0) {
            if (resourceMapKey && typeof resourceMapKey === 'string') {
                if (this.context[resourceMapKey] && Array.isArray(this.context[resourceMapKey])) {
                    this.resolvedOptions = this.context[resourceMapKey];
                } else if (this.context.resources && Array.isArray(this.context.resources[resourceMapKey])) {
                    this.resolvedOptions = this.context.resources[resourceMapKey];
                } else if (this.context.settingsDefaults && Array.isArray(this.context.settingsDefaults[resourceMapKey])) { // revisit
                    this.resolvedOptions = this.context.settingsDefaults[resourceMapKey]; // revisit
                } else if (window.cameraMasterConfig && window.cameraMasterConfig[resourceMapKey]) { // revisit
                    this.resolvedOptions = window.cameraMasterConfig[resourceMapKey]; // revisit
                }
            }
        }

        if (resourceMapKey) {
            if (typeof resourceMapKey === 'object') {
                this.translationMap = resourceMapKey;
            } else if (typeof resourceMapKey === 'string') {
                if (this.context[resourceMapKey]) {
                    this.translationMap = this.context[resourceMapKey];
                } else if (this.context.resources && this.context.resources[resourceMapKey]) {
                    this.translationMap = this.context.resources[resourceMapKey];
                } else if (window.cameraMasterConfig && window.cameraMasterConfig[resourceMapKey]) { // revisit
                    this.translationMap = window.cameraMasterConfig[resourceMapKey]; // revisit
                }
            }
        }
    }
    getValue() {
        if (!this.inputEl) return [];
        const checkedBoxes = Array.from(this.inputEl.querySelectorAll('.sub-option-item:checked'));
        return checkedBoxes.map(chk => chk.value);
    }

    getMapValue() {
        const activeSet = new Set(this.getValue());
        const filteredValues = Object.entries(this.config.staticOptions || {})
            .filter(([key]) => activeSet.has(key))
            .map(([_, value]) => value);
        return [...new Set(filteredValues)];
    }

    /**
     * Sets the checked state of the checkbox group options.
     * @param {Array|string|Object|null} value - Option values array, comma-separated string, JSON string, map, or null.
     */
    setInputValue(value) {
        if (!this.inputEl) return;

        let tokens = [];

        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                tokens = value.map(v => String(v).trim());
            } else if (typeof value === 'string') {
                const trimmed = value.trim();
                // Handle JSON-encoded arrays
                if (trimmed.startsWith('[')) {
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) {
                            tokens = parsed.map(v => String(v).trim());
                        }
                    } catch {
                        // Fallback if parsing fails
                        tokens = trimmed.split(',').map(s => s.trim());
                    }
                } else {
                    // Handle standard comma-separated strings
                    tokens = trimmed.split(',').map(s => s.trim());
                }
            } else if (typeof value === 'object') {
                // Handle key-value map objects where truthy entries represent checked keys
                tokens = Object.entries(value)
                    .filter(([_, val]) => Boolean(val))
                    .map(([key]) => String(key).trim());
            } else {
                tokens = [String(value).trim()];
            }
        }

        const tokensSet = new Set(tokens);
        const subCheckboxes = this.inputEl.querySelectorAll('.sub-option-item');

        subCheckboxes.forEach(chk => {
            chk.checked = tokensSet.has(chk.value);
        });

        this.syncSelectAllVisualToggleState();
        this.clearErrorMessage();
    }

    setValue(valuesArray) {
        if (!this.inputEl) return;
        const targetArray = Array.isArray(valuesArray) ? valuesArray : [];
        const subCheckboxes = this.inputEl.querySelectorAll('.sub-option-item');
        subCheckboxes.forEach(chk => {
            chk.checked = targetArray.includes(chk.value);
        });
        this.syncSelectAllVisualToggleState();
    }

    /**
     * Compiles selection indices into formatted token strings
     */
    toString() {
        const activeValues = this.getValue();
        if (activeValues.length === 0) return '';

        const formatString = this.toStringFormat;
        if (formatString && this.resolvedOptions.length > 0) {
            const activeStringsArray = activeValues.map(val => {
                const foundRecord = this.resolvedOptions.find(opt => {
                    const optValue = opt && typeof opt === 'object' ? (opt.value || opt.ID || opt.id) : opt;
                    return String(optValue) === String(val);
                });

                if (foundRecord && typeof foundRecord === 'object') {
                    return formatString.replace(/\{([\w_]+)\}/g, (match, key) => {
                        return foundRecord[key] !== undefined ? foundRecord[key] : '';
                    }).replace(/\s+/g, ' ').trim();
                }
                return val;
            });

            const labelPrefix = this.includePrefixInString ? (this.prefix) : '';
            return activeStringsArray.map(str => `${labelPrefix}${str}`).join(', ');
        }

        if (this.includePrefixInString) {
            const labelPrefix = this.prefix;
            return activeValues.map(value => `${labelPrefix}${value}`).join(', ');
        }
        return activeValues.join(', ');
    }
    toMapString() {
        const uniqueValues = this.getMapValue();
        if (!uniqueValues.length) return '';
        return uniqueValues.join(', ');
    }


    _parseTemplate(record, templateStr) {
        if (!templateStr || typeof record !== 'object') return String(record || '');
        return templateStr.replace(/\{([\w_]+)\}/g, (match, token) => {
            return record[token] !== undefined ? record[token] : '';
        }).replace(/\s+/g, ' ').trim();
    }
    createInputElement() {
        const gridContainer = document.createElement('div');
        gridContainer.className = 'checkbox-list-container';

        const selectAllWrapper = document.createElement('div');
        selectAllWrapper.className = 'select-all-header-row';
        const selectAllLabel = document.createElement('label');
        selectAllLabel.className = 'checkbox-list-row select-all-bold';
        const selectAllChk = document.createElement('input');
        selectAllChk.type = 'checkbox';
        selectAllChk.className = 'select-all-master-toggle';
        this.selectAllToggle = selectAllChk;
        selectAllLabel.appendChild(selectAllChk);
        selectAllLabel.appendChild(document.createTextNode(' Select All'));
        selectAllWrapper.appendChild(selectAllLabel);
        gridContainer.appendChild(selectAllWrapper);

        const liveFormValues = this.context.currentValues || {};
        let defaultCheckedTokens = [];
        if (liveFormValues[this.fieldId] !== undefined) {
            defaultCheckedTokens = Array.isArray(liveFormValues[this.fieldId]) ? liveFormValues[this.fieldId] : String(liveFormValues[this.fieldId]).split(',').map(s => s.trim());
        } else if (this.default !== undefined) {
            defaultCheckedTokens = Array.isArray(this.default) ? this.default : String(this.default).split(',').map(s => s.trim());
        }

        this.initOptionsAndTranslationMap();
        const labelPrefix = this.prefix;

        if (this.resolvedOptions && this.resolvedOptions.length > 0) {
            if (this.groupBy) {
                const groupedBuckets = {};

                this.resolvedOptions.forEach(opt => {
                    const groupHeaderKey = typeof opt === 'object' ? this._parseTemplate(opt, this.groupBy) : 'General';
                    if (!groupedBuckets[groupHeaderKey]) groupedBuckets[groupHeaderKey] = [];
                    groupedBuckets[groupHeaderKey].push(opt);
                });

                // REWRITE SORTING LAYER: Extract all gathered cluster keys into a physical sortable array
                const unifiedGroupTitles = Object.keys(groupedBuckets);

                if (this.sortOrder && typeof this.sortOrder === 'string') {
                    // Explode custom config instruction string into a clean lowercase tracking array
                    const cleanCustomSortOrder = this.sortOrder.split(',').map(s => s.trim().toLowerCase());

                    unifiedGroupTitles.sort((alpha, beta) => {
                        const indexAlpha = cleanCustomSortOrder.indexOf(alpha.toLowerCase());
                        const indexBeta = cleanCustomSortOrder.indexOf(beta.toLowerCase());

                        // If both items reside inside your sort list instruction string, compare their direct array placement index numbers
                        if (indexAlpha !== -1 && indexBeta !== -1) return indexAlpha - indexBeta;
                        // Omitted values naturally fall to the very bottom rows
                        if (indexAlpha !== -1) return -1;
                        if (indexBeta !== -1) return 1;
                        return alpha.localeCompare(beta);
                    });
                } else {
                    // Standard backup sorting fallback execution
                    unifiedGroupTitles.sort((alpha, beta) => alpha.localeCompare(beta));
                }

                // Loop through the cleanly re-ordered key list sequence to construct DOM elements
                unifiedGroupTitles.forEach(groupTitle => {
                    const items = groupedBuckets[groupTitle] || [];
                    if (items.length === 0) return;

                    const groupHeading = document.createElement('h3');
                    groupHeading.className = 'checkbox-group-bucket-title';
                    groupHeading.textContent = groupTitle;
                    gridContainer.appendChild(groupHeading);

                    items.forEach(opt => {
                        this._renderSingleCheckboxRow(gridContainer, opt, defaultCheckedTokens, labelPrefix);
                    });
                });
            } else {
                this.resolvedOptions.forEach(opt => {
                    this._renderSingleCheckboxRow(gridContainer, opt, defaultCheckedTokens, labelPrefix);
                });
            }
        }

        this.inputEl = gridContainer;
        this.syncSelectAllVisualToggleState();
        return gridContainer;
    }

    _renderSingleCheckboxRow(parentContainer, opt, defaultCheckedTokens, labelPrefix) {
        const rowLabel = document.createElement('label');
        rowLabel.className = 'checkbox-list-row';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.className = 'sub-option-item';

        const isObj = opt && typeof opt === 'object';
        const valueToken = isObj ? (opt.value ?? opt.ID ?? opt.id) : opt;
        const labelText = isObj ? this._parseTemplate(opt, this.displayFormat) : opt;

        chk.value = String(valueToken);
        if (defaultCheckedTokens.includes(String(valueToken))) {
            chk.checked = true;
        }

        rowLabel.appendChild(chk);
        rowLabel.appendChild(document.createTextNode(` ${labelPrefix}${labelText}`));
        parentContainer.appendChild(rowLabel);
    }

    syncSelectAllVisualToggleState() {
        if (!this.inputEl || !this.selectAllToggle) return;
        const allBoxes = Array.from(this.inputEl.querySelectorAll('.sub-option-item'));
        const checkedBoxes = allBoxes.filter(c => c.checked);
        this.selectAllToggle.checked = (checkedBoxes.length === allBoxes.length && allBoxes.length > 0);
        this.selectAllToggle.indeterminate = (checkedBoxes.length > 0 && checkedBoxes.length < allBoxes.length);
    }

    bindEvents() {
        if (!this.inputEl) return;
        this.inputEl.addEventListener('change', (event) => {
            const target = event.target;
            this.logValues('change');
            console.log('toMapString',this.toMapString());
            if (target && target.classList.contains('sub-option-item')) {
                this.clearErrorMessage();
                this.syncSelectAllVisualToggleState();
                this.onInput(this.getValue(), this.fieldId);
            }
        });

        if (this.selectAllToggle) {
            this.selectAllToggle.addEventListener('change', () => {
                this.clearErrorMessage();
                const isChecked = this.selectAllToggle.checked;
                const subCheckboxes = this.inputEl.querySelectorAll('.sub-option-item');
                subCheckboxes.forEach(chk => {
                    chk.checked = isChecked;
                });
                this.logValues('change');
                console.log('toMapString',this.toMapString());
                this.onInput();
            });
        }
    }
}

export default CheckboxGroupField;
