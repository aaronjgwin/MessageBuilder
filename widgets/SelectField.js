import { BaseField } from './BaseField.js';

export class SelectField extends BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.name = this.config.name || '';
        this.placeholder = this.config.placeholder || '';
        this.options = Array.isArray(this.config.options) ? this.config.options : [];
        this.defaultValue = this.config.default;
        this.initialValue = this.config.value;
        this.displayValues = this.config.displayValues || null;
    }
    /**
     * Sets the selected option in the dropdown.
     * @param {string|number|Object|null} value - Option value, option object { value, label }, or null.
     */
    setInputValue(value) {
        if (!this.inputEl) return;

        let targetValue = '';

        if (value !== null && value !== undefined) {
            // Extract value property if an option object was passed
            if (typeof value === 'object' && value.value !== undefined) {
                targetValue = String(value.value);
            } else {
                targetValue = String(value);
            }
        } else if (this.defaultValue != null) {
            targetValue = String(this.defaultValue);
        }

        this.inputEl.value = targetValue;
        this.clearErrorMessage();
    }

    getValue() {
        return this?.inputEl?.value?.trim() ?? null;
    }

    validate() {
        const value = this.getValue();
        if (!value) return null; // Required validation is already handled by checkRequiredValidation()

        // Optional: Ensure the selected value actually exists in the current options list
        const optionValues = this.options.map(opt =>
            opt && typeof opt === 'object' ? String(opt.value) : String(opt)
        );

        if (optionValues.length > 0 && !optionValues.includes(value)) {
            return this.errorMessage || `Invalid selection. Please choose a valid option from the list.`;
        }

        return null;
    }

    /**
     * CRITICAL REPAIR: Unified display text proxy mapping directly into the replacement loop
     */
    toString() {
        return this.getValue();
    }

    createInputElement() {
        const select = document.createElement('select');
        select.id = this.fieldId;
        select.className = 'form-dropdown-select';
        select.required = this.isRequired;
        if (this.name) select.name = this.name;

        // 1. Build Placeholder Option
        if (this.placeholder || this.isRequired) {
            const placeholderOpt = document.createElement('option');
            placeholderOpt.value = '';
            placeholderOpt.textContent = this.placeholder || '-- Select an Option --';
            placeholderOpt.disabled = true;
            placeholderOpt.selected = true;
            placeholderOpt.hidden = true;
            placeholderOpt.defaultSelected = true;
            select.appendChild(placeholderOpt);
        }

        // 2. Populate Option List
        const optionItems = this.options || [];
        optionItems.forEach(optVal => {
            const opt = document.createElement('option');
            const isObject = optVal && typeof optVal === 'object';
            const valueToken = isObject ? optVal.value : optVal;
            const labelText = isObject ? optVal.label : optVal;

            opt.value = valueToken;
            opt.textContent = labelText;
            select.appendChild(opt); // todo
            // value.add(new Option(this.displayValues?.[val] ?? val, val));
        });

        // 3. Resolve Initial Value Safely (ignoring null/undefined)
        const liveFormValues = this.context.currentValues || {};
        let targetInitialValue = '';

        if (liveFormValues[this.fieldId] != null) { // checks both null & undefined
            targetInitialValue = liveFormValues[this.fieldId];
        } else if (this.defaultValue != null) {
            targetInitialValue = this.defaultValue;
        } else if (this.initialValue != null) {
            targetInitialValue = this.initialValue;
        }

        // 4. ALWAYS set select.value at the end (forces value="" placeholder if empty)
        select.value = String(targetInitialValue);

        this.inputEl = select;
        return select;
    }

    bindEvents() {
        if (!this.inputEl) return;

        this.inputEl.addEventListener('change', () => {
            this.clearErrorMessage();
            this.logValues('change');
            this.onInput(this.getValue(), this.fieldId);
        });

        this.inputEl.addEventListener('blur', () => {
            const isMissingRequired = this.checkRequiredValidation();
            const errorReason = this.validate();

            // If missing required or custom validation fails, revert to focused value, show error, and refocus
            if (isMissingRequired || errorReason) {
                if (this.focusedValue !== undefined) {
                    this.inputEl.value = String(this.focusedValue);
                } else if (this.defaultValue !== undefined) {
                    this.inputEl.value = String(this.defaultValue);
                } else {
                    this.inputEl.value = '';
                }

                this.showErrorMessage(errorReason || this.requiredMessage);
                this.inputEl.focus();
                return;
            }

            this.clearErrorMessage();
            this.logValues('blur');
            this.onInput(this.getValue(), this.fieldId);
        });
    }
}