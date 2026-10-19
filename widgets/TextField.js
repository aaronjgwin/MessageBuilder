import { BaseField } from './BaseField.js';

export class TextField extends BaseField {
    /**
     * Concrete TextField implementation inheriting from BaseField.
     * Hardened to universally evaluate any resource map lists and preserve alphanumeric regex structures.
     */
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.jsonFileName = this.config.jsonFileName || null;
        this.staticOptions = this.config.staticOptions || []; // FormBuilder handles loading the values from the jsonFileName
        this.placeholder = this.config.placeholder || '';
        this.maxLength = this.config.maxLength;
        this.minLength = this.config.minLength;
        this.defaultValue = this.config.default;
        this.initialValue = this.config.value;
        this.list = this.config.list || null;
        this.resourceMap = Boolean(this.config.resourceMap);
        this.errorMessage = this.config.errorMessage || null;
        this.regExPattern = this.config.regExPattern || null;
        this.regExFlags = this.config.regExFlags || '';
        this.liveCharacterMask = this.config.liveCharacterMask || null;
        this.autoPadFormat = this.config.autoPadFormat || null;
        this.forceUpperCase = Boolean(this.config.forceUpperCase);
        this.disallowedValues = this.config.disallowedValues || [];
        this.enforceCamelCase = this.config.enforceCamelCase ?? false;
        this.multiline = this.config.multiline ?? false;

        this.cachedRegex = null;
        this.cachedMask = null;
        this.cachedPadRegex = null;
        this.initRegex();
    }

    /**
     * Compiles configured validation and masking expressions into safe internal memory cache.
     */
    initRegex() {
        if (this.regExPattern) {
            try {
                this.cachedRegex = new RegExp(this.regExPattern, this.regExFlags);
            } catch (e) {
                console.error(`Invalid validation regex for field "${this.fieldId}":`, e);
            }
        }
        if (this.liveCharacterMask) {
            try {
                this.cachedMask = new RegExp(this.liveCharacterMask, 'g');
            } catch (e) {
                console.error(`Invalid mask regex for field "${this.fieldId}":`, e);
            }
        }
        if (this.autoPadFormat?.pattern) {
            try {
                this.cachedPadRegex = new RegExp(this.autoPadFormat.pattern);
            } catch (e) {
                console.error(`Invalid autoPad regex for field "${this.fieldId}":`, e);
            }
        }
    }
    /**
     * Sets the text field value, applying active masking, casing, and auto-pad formatting rules.
     * @param {string|number|null} value - Value to populate into the input element, or null/empty.
     */
    setInputValue(value) {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT'
            ? this.inputEl
            : this.inputEl?.querySelector('input');

        if (!inputNode) return;

        // 1. Handle Null / Empty values
        if (value === null || value === undefined || value === '') {
            inputNode.value = '';
            this.clearErrorMessage();
            return;
        }

        let strValue = String(value);

        // 2. Apply casing & character masking filters
        const isCardHandField = this.regExPattern?.includes('JQKA');
        if (isCardHandField) {
            strValue = strValue.toUpperCase().replace(/[^0-9JQKA,]/g, '');
        } else if (this.forceUpperCase || this.regExPattern?.includes('[A-Z]')) {
            strValue = strValue.toUpperCase();
        }

        if (this.cachedMask) {
            strValue = strValue.replace(this.cachedMask, '');
        }

        if (this.enforceCamelCase && typeof this.toCamelCase === 'function') {
            strValue = this.toCamelCase(strValue);
        }

        // 3. Apply auto-padding formatting rules if configured
        if (this.regExPattern === "^[A-Z]{2}\\d{2}$" && strValue.length > 0) {
            const cleanValue = strValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const letters = cleanValue.replace(/[^A-Z]/g, '');
            let digits = cleanValue.replace(/[^0-9]/g, '');

            if (letters.length === 2 && digits.length > 0) {
                while (digits.length < 2) {
                    digits = '0' + digits;
                }
                strValue = letters + digits;
            }
        } else if (strValue && this.cachedPadRegex && this.autoPadFormat?.replacement) {
            strValue = strValue.replace(this.cachedPadRegex, this.autoPadFormat.replacement);
        }

        // 4. Enforce maximum character length if specified
        if (this.maxLength && strValue.length > this.maxLength) {
            strValue = strValue.slice(0, this.maxLength);
        }

        // 5. Update DOM element & clear error state
        inputNode.value = strValue;
        this.clearErrorMessage();
    }
    /**
     * Extracts trimmed string values securely.
     */
    getValue() {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl?.querySelector('input');
        if (!inputNode || !inputNode.value) return '';

        inputNode.value = inputNode.value?.trim();
        if (this.enforceCamelCase && !this.isCamelCase(inputNode)){
            inputNode.value = this.toCamelCase(inputNode.value);
        }
        return inputNode.value;
    }

    /**
     * Unified display string proxy mapping directly into the statement replacement loops.
     */
    toString() {
        return this.getValue();
    }

    /**
     * Generates structural elements, maps layout attributes, and dynamically binds option datalists.
     */
    createInputElement() {
        const input = document.createElement(!this.multiline?'input':'textarea');
        if (!this.multiline) input.type = 'text';
        input.className = 'form-input-field'
        input.id = this.fieldId;

        if (this.placeholder) input.placeholder = this.placeholder;
        if (this.maxLength) input.maxLength = this.maxLength;

        const liveFormValues = this.context.currentValues || {};
        if (liveFormValues[this.fieldId] !== undefined) {
            input.value = liveFormValues[this.fieldId];
        } else if (this.defaultValue !== undefined) {
            input.value = this.defaultValue;
        } else if (this.initialValue !== undefined) {
            input.value = this.initialValue;
        }
        this.initialValue = input.value;

        const targetOptionsList = this.staticOptions;
        const datalistId = this.list || (targetOptionsList.length > 0 ? `${this.fieldId}-datalist` : null);

        if (!datalistId) {
            this.inputEl = input;
            return input;
        }

        input.setAttribute('list', datalistId);
        const dl = document.createElement('datalist');
        dl.id = datalistId;

        targetOptionsList.forEach(table => {
            const opt = document.createElement('option');
            opt.value = table;
            dl.appendChild(opt);
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'text-field-datalist-wrapper';
        wrapper.appendChild(input);
        wrapper.appendChild(dl);

        this.inputEl = wrapper;
        return wrapper;
    }

    /**
     * OVERRIDE: Validates input strings against dynamically compiled structures and resource lists.
     */
    validate() {
        const value = this.getValue();
        if (!value) return null;

        // Check if value is unchanged from its original state
        const isOriginalValue = value === this.initialValue;

        // Only fire uniqueness check if the user actually changed the value
        if (!isOriginalValue && this.disallowedValues.includes(value)) {
            return this.errorMessage || `"${value}" is already in use. Please choose a unique value.`;
        }

        const targetOptionsList = this.staticOptions;
        if (this.resourceMap && targetOptionsList.length > 0) {
            if (!targetOptionsList.includes(value)) {
                return this.errorMessage || `Invalid entry. Selection does not exist in the authorized registry list.`;
            }
        }

        if (this.minLength && value.length < this.minLength) {
            return this.errorMessage || `Entry must be at least ${this.minLength} characters long.`;
        }

        if (this.cachedRegex && !this.cachedRegex.test(value)) {
            return this.errorMessage || 'Field input format is invalid.';
        }
        return null;
    }

    /**
     * OVERRIDE: Attaches character masks cursor trackings and lifecycle blurring verification listeners.
     */
    bindEvents() {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl.querySelector('input');
        if (!inputNode) return;
        this.inputEl = inputNode;

        this.inputEl.addEventListener('focus', () => {
            this.focusedValue = this.getValue();
        });

        this.inputEl.addEventListener('input', () => {
            this.clearErrorMessage();
            const position = this.inputEl.selectionStart;
            const originalLength = this.inputEl.value.length;
            let txt = this.inputEl.value;

            const isCardHandField = this.regExPattern?.includes('JQKA');
            if (isCardHandField) {
                txt = txt.toUpperCase().replace(/[^0-9JQKA,]/g, '');
            } else if (this.forceUpperCase || this.regExPattern?.includes('[A-Z]')) {
                txt = txt.toUpperCase();
            }
            if (this.cachedMask) {
                txt = txt.replace(this.cachedMask, '');
            }

            this.inputEl.value = txt;
            const newLength = this.inputEl.value.length;
            this.inputEl.setSelectionRange(
                position + (newLength - originalLength),
                position + (newLength - originalLength)
            );
            this.logValues('input');
            this.onInput();
        });

        this.inputEl.addEventListener('blur', () => {
            const isMissingRequired = this.checkRequiredValidation();
            let value = this.getValue();
            const isCardHandField = this.regExPattern?.includes('JQKA');
            if (isCardHandField && value.length > 0) {
                value = value.toUpperCase().replace(/[^0-9JQKA,]/g, '');
            }

            // REPAIR PASS: Safe EGD non-destructive alphanumeric padding extractor
            if (this.regExPattern === "^[A-Z]{2}\\d{2}$" && value.length > 0) {
                const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const letters = cleanValue.replace(/[^A-Z]/g, '');
                let digits = cleanValue.replace(/[^0-9]/g, '');

                if (letters.length === 2 && digits.length > 0) {
                    while (digits.length < 2) {
                        digits = '0' + digits;
                    }
                    value = letters + digits;
                    this.inputEl.value = value;
                }
            } else if (value && this.cachedPadRegex && this.autoPadFormat?.replacement) {
                value = value.replace(this.cachedPadRegex, this.autoPadFormat.replacement);
                this.inputEl.value = value;
            }

            const errorReason = this.validate();

            // 2. If invalid, revert input DOM to the focused value and block model sync
            if (isMissingRequired || errorReason) {
                if (this.focusedValue !== undefined) {
                    this.setInputValue(this.focusedValue, false);
                }
                this.showErrorMessage(this.errorMessage || errorReason || this.requiredMessage);
                this.inputEl.focus();
                return;
            }

            this.clearErrorMessage();
            this.logValues('blur');
            this.onInput(this.getValue(), this.fieldId);
        });
    }
}