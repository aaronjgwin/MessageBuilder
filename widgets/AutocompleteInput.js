import BaseField from './BaseField.js';

export class AutocompleteInput extends BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);
        this.selectEl = null; // Autocomplete Name entry field string box
        this.textEl = null;   // Freeform ID or DOB string block entry field
        this.stringToRecordMap = new Map();
        this.recordsArray = this.config.staticOptions || []; // FormBuilder handles loading the values from the jsonFileName

        // main config
        this.jsonFileName = this.config.jsonFileName || null;
        this.displayFormat = this.config.displayFormat || null;
        this.placeholderSelect= this.config.placeholderSelect || 'Search ...';
        this.placeholderInput = this.config.placeholderInput || null;
        this.toStringFormat = this.config.toStringFormat || '{select} {text}';

        this.buildRecordLookupIndex();
    }

    /**
     * Pre-compiles dynamic records array into an autocomplete search lookup dictionary map
     */
    buildRecordLookupIndex() {
        this.stringToRecordMap.clear();
        //const globalSettings = this.context.defaultsMap || {}; // revisit
        const formatString = this.displayFormat;

        this.recordsArray.forEach(record => {
            if (!record) return;
            const displayString = formatString.replace(/\{([\w_]+)\}/g, (match, key) => {
                return record[key] !== undefined ? record[key] : '';
            }).replace(/\s+/g, ' ').trim();

            if (displayString) {
                this.stringToRecordMap.set(displayString, record);
            }
        });
    }
    /**
     * Sets values for both the autocomplete entry input and the secondary text field.
     * @param {Object|string|null} value - Object { select, text }, JSON string, record object, or string.
     */
    setInputValue(value) {
        if (!this.selectEl || !this.textEl) return;

        let selectVal = '';
        let textVal = '';

        if (value !== null && value !== undefined && value !== '') {
            let parsedValue = value;

            // 1. Handle JSON String
            if (typeof value === 'string' && value.trim().startsWith('{')) {
                try {
                    parsedValue = JSON.parse(value);
                } catch {
                    parsedValue = value;
                }
            }

            // 2. Handle Object representation (or raw record)
            if (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
                selectVal = parsedValue.select ?? parsedValue.name ?? '';
                textVal = parsedValue.text ?? parsedValue.id ?? parsedValue.ID ?? parsedValue.PlayerNumber ?? '';

                // Fallback: If select is missing but we have a displayFormat template
                if (!selectVal && this.displayFormat) {
                    selectVal = this.displayFormat.replace(/\{([\w_]+)\}/g, (match, key) => {
                        return parsedValue[key] !== undefined ? parsedValue[key] : '';
                    }).replace(/\s+/g, ' ').trim();
                }
            }
            // 3. Handle Plain String
            else if (typeof parsedValue === 'string') {
                selectVal = parsedValue;
            }
        }

        // Apply to DOM inputs
        this.selectEl.value = String(selectVal);
        this.textEl.value = String(textVal);

        // If secondary text field is empty but select field matches a record in lookup, auto-populate secondary ID
        if (selectVal && !textVal) {
            const matchedRecord = this.stringToRecordMap.get(String(selectVal).trim());
            if (matchedRecord) {
                const autoFilledId = matchedRecord.ID || matchedRecord.id || matchedRecord.PlayerNumber || '';
                if (autoFilledId) {
                    this.textEl.value = String(autoFilledId);
                }
            }
        }

        this.clearErrorMessage();
    }
    /**
     * Extracts data metrics out of form fields safely without leaking background arrays
     */
    getValue() {
        if (!this.selectEl || !this.textEl) return { select: '', text: '' };
        return {
            select: this.selectEl.value.trim(),
            text: this.textEl.value.trim()
        };
    }

    /**
     * Generates a dynamic string layout representation using bracket-style templates
     */
    toString() {
        const data = this.getValue();
        if (!data.select && !data.text) return '';

        const currentSelectVal = data.select || '';
        const currentTextVal = data.text || '';
        const formatPattern = this.toStringFormat;

        return formatPattern
            .replace(/\{select\}/g, currentSelectVal)
            .replace(/\{text\}/g, currentTextVal || '----')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Assembles the twin side-by-side elements and appends a native datalist overlay
     */
    createInputElement() {
        const container = document.createElement('div');
        container.className = 'combobox-field-container'; // Reuses your clean flex row styling cell layouts

        // 1. Generate the main text input component frame box
        const selectTextField = document.createElement('input');
        selectTextField.type = 'text';
        selectTextField.className = 'combobox-selector'; // Reuses your clean 50% split view layout panel classes
        selectTextField.placeholder = this.placeholderSelect;
        this.selectEl = selectTextField;

        // 2. Build the underlying options entries datalist collection
        const dl = document.createElement('datalist');
        const targetDatalistId = `${this.fieldId}-autocomplete-datalist`;
        dl.id = targetDatalistId;

        this.stringToRecordMap.forEach((record, displayValue) => {
            const opt = document.createElement('option');
            opt.value = displayValue;
            dl.appendChild(opt);
        });

        // 3. Generate the secondary freeform card ID tracking element input box
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'combobox-text-input';
        textInput.id = this.fieldId;
        textInput.placeholder = this.placeholderInput;
        this.textEl = textInput;

        // 4. Mount layout nodes into row structures before linking datalist ids
        container.appendChild(selectTextField);
        container.appendChild(dl);
        container.appendChild(textInput);

        // DELAYED BINDING REPAIR PASS:
        // Link the list attribute AFTER elements exist inside their parent tree row.
        selectTextField.setAttribute('list', targetDatalistId);

        return container;
    }

    checkRequiredValidation() {
        if (!this.isRequired) return false;
        const data = this.getValue();
        if (!data.select) {
            this.showErrorMessage(this.requiredMessage);
            return true;
        }
        return false;
    }

    /**
     * Attaches structural input mutations, autocomplete captures, and blurring completions listeners
     */
    bindEvents() {
        if (!this.selectEl || !this.textEl) return;
        this.inputEl = this.textEl;

        this.selectEl.addEventListener('input', () => {
            this.clearErrorMessage();
            const currentTypedValue = this.selectEl.value.trim();
            const matchedRecord = this.stringToRecordMap.get(currentTypedValue);

            if (matchedRecord) {
                const autoFilledId = matchedRecord.ID || matchedRecord.id || matchedRecord.PlayerNumber || '';
                if (autoFilledId) {
                    this.textEl.value = autoFilledId;
                }
            }
            this.logValues('select-input');
            this.onInput();
        });

        this.textEl.addEventListener('input', () => {
            this.clearErrorMessage();
            this.logValues('text-input');
            this.onInput();
        });

        this.selectEl.addEventListener('blur', () => {
            this.checkRequiredValidation();
            this.logValues('select-blur');
            this.onInput(this.getValue(), this.fieldId);
        });

        this.textEl.addEventListener('blur', () => {
            this.checkRequiredValidation();
            this.logValues('text-blur');
            this.onInput(this.getValue(), this.fieldId);
        });
    }
}
