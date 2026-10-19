import BaseField from './BaseField.js';

export class ObjectSelectField extends BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.placeholder = this.config.placeholder || '';
        this.displayFormat = this.config.displayFormat || '';
        this.toStringFormat = this.config.toStringFormat || '';
        this.linkedField = this.config.linkedField || null;
        this.matchedType = this.config.matchedType || 'value';
        this.matchedFormat = this.config.matchedFormat || '';
        this.partialMatchedFormat = this.config.partialMatchedFormat || '';
        this.propertyFilter = this.config.propertyFilter || null;
        this.list = this.config.list || null;
        this.searchFields = Array.isArray(this.config.searchFields) ? this.config.searchFields : [];
        this.errorMessage = this.config.errorMessage || null;

        this.recordsArray = Array.isArray(dataContext.records) ? dataContext.records : [];
        this.selectedRecord = null;
        this.datalistEl = null;
        this.stringToRecordMap = new Map();
        this.validRecordsCache = [];
        this.buildRecordLookupIndex();
    }

    /**
     * Dynamic filter analyzer that parses both "value" and "values" schema formats safely
     */
    passesPropertyFilter(record) {
        const filterConfig = this.propertyFilter;
        if (!filterConfig || !filterConfig.key) return true;

        const rawTargetValues = filterConfig.values || filterConfig.value;
        if (!rawTargetValues) return true;

        const targetValuesArray = Array.isArray(rawTargetValues) ? rawTargetValues : [rawTargetValues];
        const recordValue = record[filterConfig.key];
        if (recordValue === undefined || recordValue === null) return false;

        const allowedValues = targetValuesArray.map(v => String(v).toLowerCase().trim());

        if (Array.isArray(recordValue)) {
            return recordValue.some(item => allowedValues.some(allowed => String(item).toLowerCase().trim().includes(allowed)));
        }

        const cleanRecordValue = String(recordValue).toLowerCase().trim();
        return allowedValues.some(allowed => cleanRecordValue.includes(allowed));
    }

    buildRecordLookupIndex() {
        const globalSettings = this.context.settingsDefaults || {}; // revisit
        const formatString = this.displayFormat;

        this.validRecordsCache = [];
        this.stringToRecordMap.clear();

        this.recordsArray.forEach(record => {
            if (!record) return;
            if (!this.passesPropertyFilter(record)) return;

            this.validRecordsCache.push(record);
            const displayString = this.formatRecordToString(record, formatString);
            if (displayString) {
                this.stringToRecordMap.set(displayString, record);
            }
        });
    }

    formatRecordToString(record, template) {
        if (!template) {
            return Object.values(record).find(v => typeof v === 'string') || '';
        }
        const result = template.replace(/\{([\w_]+)\}/g, (match, key) => {
            return record[key] !== undefined ? record[key] : '';
        });
        return result.replace(/\s+/g, ' ').trim();
    }

    /**
     * Sets the field value and synchronizes internal record state.
     * @param {Object|string|null} value - Record object, display string, ID, or null/empty.
     */
    setInputValue(value) {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT'
            ? this.inputEl
            : this.inputEl?.querySelector('input');

        // 1. Handle Null / Empty values
        if (value === null || value === undefined || value === '') {
            this.selectedRecord = null;
            if (inputNode) inputNode.value = '';
            this.clearErrorMessage();
            this.renderFilteredDatalist('');
            return;
        }

        let targetDisplayString = '';
        let targetRecord = null;

        // 2. Handle Object (Record) input
        if (typeof value === 'object') {
            const formatted = this.formatRecordToString(value, this.displayFormat);

            if (formatted && this.stringToRecordMap.has(formatted)) {
                targetRecord = this.stringToRecordMap.get(formatted);
                targetDisplayString = formatted;
            } else {
                // Fallback: check valid cache by reference or matching ID
                const matchInCache = this.validRecordsCache.find(r => r === value || (r.id && value.id && r.id === value.id));
                targetRecord = matchInCache || value;
                targetDisplayString = formatted;
            }
        }
        // 3. Handle String input (Display string or record ID/property value)
        else {
            const trimmedValue = String(value).trim();

            if (this.stringToRecordMap.has(trimmedValue)) {
                // Direct display string match
                targetRecord = this.stringToRecordMap.get(trimmedValue);
                targetDisplayString = trimmedValue;
            } else {
                // Search record cache for a matching ID or property value
                const matchByProperty = this.validRecordsCache.find(record =>
                    Object.values(record).some(val => String(val).trim() === trimmedValue)
                );

                if (matchByProperty) {
                    targetRecord = matchByProperty;
                    targetDisplayString = this.formatRecordToString(matchByProperty, this.displayFormat);
                } else {
                    targetRecord = null;
                    targetDisplayString = trimmedValue;
                }
            }
        }

        // 4. Sync internal state & update UI
        this.selectedRecord = targetRecord;
        if (inputNode) {
            inputNode.value = targetDisplayString;
        }

        this.clearErrorMessage();
        this.renderFilteredDatalist('');
    }

    getValue() {
        const element = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl?.querySelector('input');
        if (!element) return null;

        const typedValue = element.value.trim();
        if (!typedValue) {
            this.selectedRecord = null;
            return null;
        }

        const matchedRecord = this.stringToRecordMap.get(typedValue);
        this.selectedRecord = matchedRecord || null;
        return this.selectedRecord;
    }

    /**
     * HIGH-PRECISION DYNAMIC SEGMENT MATCHING INTERCEPTOR
     */
    toString() {
        const element = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl?.querySelector('input');
        if (!element) return '';

        const rawValue = element.value.trim();
        if (!rawValue) return '';

        const currentRecord = this.getValue();
        if (!currentRecord) return rawValue;

        const globalSettings = this.context.settingsDefaults || {}; // revisit
        let formatPattern = this.toStringFormat;

        // ADVANCED DYNAMIC RELATION SEGMENT EVALUATIONS
        if (this.linkedField) {
            const mountNode = document.getElementById('formMountPoint');
            const siblingGroup = mountNode?.querySelector(`[data-base-id="${this.linkedField}"]`);
            const siblingInput = siblingGroup?.tagName === 'INPUT' ? siblingGroup : siblingGroup?.querySelector('input');

            if (siblingInput && siblingInput.value.trim()) {
                const siblingValueStr = siblingInput.value.trim();
                const siblingRecord = this.stringToRecordMap.get(siblingValueStr);

                if (siblingRecord) {
                    const matchingRuleType = this.matchedType;

                    if (matchingRuleType === 'properties' || matchingRuleType === 'parts') {
                        const isDepartmentIdentical = siblingRecord.Department === currentRecord.Department; // revisit // hardcoded
                        const isTitleIdentical = siblingRecord.Title === currentRecord.Title;

                        if (isDepartmentIdentical && isTitleIdentical) {
                            // Level 1 Redundancy: Everything matches, output name only
                            formatPattern = this.matchedFormat || '{ID} {FirstName} {LastName}';
                        } else if (isDepartmentIdentical) {
                            // Level 2 Redundancy: Department matches but Title is different.
                            // Automatically drop Department parameter segment, preserve the different Title!
                            formatPattern = this.partialMatchedFormat || '{Title} {FirstName} {LastName}';
                        }
                    } else {
                        // Standard static 'value' check fallback logic: 100% duplicate person check
                        if (siblingRecord.FirstName === currentRecord.FirstName && siblingRecord.LastName === currentRecord.LastName) {
                            formatPattern = this.matchedFormat;
                        }
                    }
                }
            }
        }

        return this.formatRecordToString(currentRecord, formatPattern);
    }

    createInputElement() {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = this.fieldId;
        if (this.placeholder) input.placeholder = this.placeholder;

        const targetDatalistId = this.list || `${this.fieldId}-datalist`;
        input.setAttribute('list', targetDatalistId);

        const dl = document.createElement('datalist');
        dl.id = targetDatalistId;
        this.datalistEl = dl;

        this.renderFilteredDatalist('');

        const wrapper = document.createElement('div');
        wrapper.className = 'object-select-field-wrapper';
        wrapper.appendChild(input);
        wrapper.appendChild(dl);
        this.inputEl = wrapper;
        return wrapper;
    }

    renderFilteredDatalist(queryText) {
        if (!this.datalistEl) return;
        this.datalistEl.innerHTML = '';

        const globalSettings = this.context.settingsDefaults || {}; // revisit
        const records = this.validRecordsCache;
        const searchFields = this.searchFields;
        const formatString = this.displayFormat || globalSettings.displayFormat || '{FirstName} {LastName}';
        const cleanQuery = queryText.toLowerCase().trim();
        const addedOptionsSet = new Set();

        records.forEach(record => {
            let isMatch = false;
            if (!cleanQuery) {
                isMatch = true;
            } else if (searchFields.length === 0) {
                isMatch = Object.values(record).some(val => String(val).toLowerCase().includes(cleanQuery));
            } else {
                isMatch = searchFields.some(fieldKey => {
                    const fieldValue = record[fieldKey];
                    if (fieldValue === undefined || fieldValue === null) return false;
                    if (Array.isArray(fieldValue)) {
                        return fieldValue.some(item => String(item).toLowerCase().includes(cleanQuery));
                    }
                    return String(fieldValue).toLowerCase().includes(cleanQuery);
                });
            }

            if (isMatch) {
                const displayValue = this.formatRecordToString(record, formatString);
                if (displayValue && !addedOptionsSet.has(displayValue)) {
                    addedOptionsSet.add(displayValue);
                    const opt = document.createElement('option');
                    opt.value = displayValue;
                    this.datalistEl.appendChild(opt);
                }
            }
        });
    }

    validate() {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl.querySelector('input');
        const typedValue = inputNode ? inputNode.value.trim() : '';
        if (!typedValue) return null;

        const recordExists = this.stringToRecordMap.has(typedValue);
        if (!recordExists) {
            if (inputNode) inputNode.value = '';
            this.selectedRecord = null;
            this.renderFilteredDatalist('');
            return this.errorMessage || 'Invalid entry. Please choose an authorized option directly from the list.';
        }
        return null;
    }

    bindEvents() {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl.querySelector('input');
        if (!inputNode) return;

        this.inputEl = inputNode;

        this.inputEl.addEventListener('input', () => {
            this.clearErrorMessage();
            this.renderFilteredDatalist(this.inputEl.value);
            this.logValues('input');
            this.onInput();
        });

        this.inputEl.addEventListener('focus', () => {
            this.renderFilteredDatalist(this.inputEl.value);
        });

        this.inputEl.addEventListener('blur', () => {
            const isMissingRequired = this.checkRequiredValidation();
            if (isMissingRequired) {
                this.onInput();
                return;
            }

            const errorReason = this.validate();
            if (errorReason) {
                this.showErrorMessage(errorReason);
            } else {
                this.clearErrorMessage();
                this.renderFilteredDatalist('');
            }
            this.logValues('blur');
            this.onInput(this.getValue(), this.fieldId);
        });
    }
}

export default ObjectSelectField;