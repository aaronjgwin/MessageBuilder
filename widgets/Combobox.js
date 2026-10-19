import { BaseField } from './BaseField.js';

export class Combobox extends BaseField {
    /**
     * Concrete Combobox component combining a dropdown selector with a text input.
     * Supports relational selection matching and dynamic format overrides.
     */
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.options = this.config.options || [];
        this.toStringFormat = this.config.toStringFormat || '${select} ${text}';
        this.defaultValue = this.config.default;
        this.leadingZeros = this.config.leadingZeros || [];
        this.maskPattern = this.config.maskPattern || null;
        this.placeholder = this.config.placeholder || '';
        this.lengths = this.config.lengths || {};
        this.linkedField = this.config.linkedField || null;
        this.matchedFormat = this.config.matchedFormat || null;
        this.errorMessage = this.config.errorMessage || null;

        // Internal State
        this.selectEl = null;
        this.textEl = null;
        this.maskRegex = this.maskPattern ? new RegExp(this.maskPattern, 'g') : null;
    }

    /**
     * Sets the value for both the select dropdown and text input.
     * @param {Object|string|null} value - Object { select, text }, JSON string, plain string, or null.
     */
    setInputValue(value) {
        if (!this.selectEl || !this.textEl) return;

        let selectVal = this.defaultValue !== undefined ? this.defaultValue : (this.options[0] || '');
        let textVal = '';

        if (value !== null && value !== undefined && value !== '') {
            let parsedValue = value;

            // Handle JSON string input
            if (typeof value === 'string' && value.trim().startsWith('{')) {
                try {
                    parsedValue = JSON.parse(value);
                } catch {
                    parsedValue = value;
                }
            }

            // Extract values from Object representation
            if (parsedValue && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
                if (parsedValue.select !== undefined || parsedValue.role !== undefined || parsedValue.title !== undefined) {
                    selectVal = parsedValue.select ?? parsedValue.role ?? parsedValue.title;
                }
                if (parsedValue.text !== undefined || parsedValue.id !== undefined) {
                    textVal = parsedValue.text ?? parsedValue.id;
                }
            }
            // Fallback for plain string inputs
            else if (typeof parsedValue === 'string') {
                textVal = parsedValue;
            }
        }

        // 1. Update Select Element (fallback to default or first option if invalid option passed)
        if (this.options.includes(String(selectVal))) {
            this.selectEl.value = String(selectVal);
        } else if (this.options.length > 0) {
            this.selectEl.value = this.options[0];
        }

        // 2. Update Text Input Element
        this.textEl.value = String(textVal ?? '');

        // 3. Sync Max Length attributes, apply leading zeros, and clear errors
        this.updateTextInputAttributes();
        this.formatWithLeadingZeros();
        this.clearErrorMessage();
    }

    /**
     * OVERRIDE: Extracts dynamic structural values out of both child elements
     */
    getValue() {
        if (!this.selectEl || !this.textEl) return { select: '', text: '' };
        return { select: this.selectEl.value, text: this.textEl.value.trim() };
    }

    /**
     * Generates a structural string representation using the configuration pattern.
     * Features live cross-field comparative checks to activate custom matched format templates.
     */
    toString() {
        const data = this.getValue();
        if (!data.text && !data.select) return !this.stringFallback ? '' : this.stringFallback;

        const currentSelectVal = data.select || '';
        const currentTextVal = data.text || '';

        // Determine our baseline string format template pattern configuration
        let formatPattern = this.toStringFormat;

        // COMPARATIVE LINK MATCHING ENGINE
        if (this.linkedField && this.matchedFormat) {
            const mountNode = document.getElementById('formMountPoint');
            const siblingGroup = mountNode?.querySelector(`[data-base-id="${this.linkedField}"]`);
            const siblingSelect = siblingGroup?.querySelector('.combobox-selector');

            if (siblingSelect && siblingSelect.value === currentSelectVal) {
                formatPattern = this.matchedFormat;
            }
        }

        // Bracket-style template replacement processor ({select}, {id}, {label})
        if (formatPattern.includes('{')) {
            return formatPattern.replace(/\{([\w_]+)\}/g, (match, token) => {
                const cleanToken = token.toLowerCase();

                if (['select', 'role', 'title'].includes(cleanToken)) {
                    return currentSelectVal;
                }
                if (cleanToken === 'label') {
                    return this.label || currentSelectVal;
                }
                if (['id', 'text'].includes(cleanToken)) {
                    return currentTextVal || '----';
                }
                return '';
            }).replace(/\s+/g, ' ').trim();
        }

        // Standard macro-style substitution engine fallback (${select}, ${text})
        return formatPattern.replace(/\${(select|role|text|id)}/g, (match, token) => { console.log('in', this.fieldId);
            const cleanToken = token.toLowerCase();
            if (cleanToken === 'select' || cleanToken === 'role') return currentSelectVal;
            if (cleanToken === 'text' || cleanToken === 'id') return currentTextVal;
            return '';
        });
    }

    getRequiredLength(currentSelection) {
        return this.lengths[currentSelection] !== undefined ? this.lengths[currentSelection] : (this.lengths.default || 4);
    }

    updateTextInputAttributes() {
        if (!this.selectEl || !this.textEl) return;
        this.textEl.maxLength = this.getRequiredLength(this.selectEl.value);
    }

    formatWithLeadingZeros() {
        if (!this.selectEl || !this.textEl) return;
        const currentSelection = this.selectEl.value;
        let textVal = this.textEl.value.trim();
        if (!textVal) return;

        const targetLength = this.getRequiredLength(currentSelection);

        if (this.leadingZeros.includes(currentSelection)) {
            while (textVal.length < targetLength) {
                textVal = '0' + textVal;
            }
            this.textEl.value = textVal;
        }
    }

    createInputElement() {
        const container = document.createElement('div');
        container.className = 'combobox-field-container';

        const select = document.createElement('select');
        select.className = 'combobox-selector';

        this.options.forEach(optVal => {
            const opt = document.createElement('option');
            opt.value = optVal;
            opt.textContent = optVal;
            select.appendChild(opt);
        });

        if (this.defaultValue !== undefined) {
            select.value = this.defaultValue;
        }
        this.selectEl = select;

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'combobox-text-input';
        textInput.id = this.fieldId;
        if (this.placeholder) {
            textInput.placeholder = this.placeholder;
        }
        this.textEl = textInput;
        this.updateTextInputAttributes();

        const liveFormValues = this.context.currentValues || {};
        let initialData = liveFormValues[this.fieldId] || this.config.value || null;

        if (typeof initialData === 'string' && initialData.trim().startsWith('{')) {
            try { initialData = JSON.parse(initialData); } catch (e) { initialData = null; }
        }

        if (initialData && typeof initialData === 'object') {
            const selectValue = initialData.select ?? initialData.role;
            const textValue = initialData.text ?? initialData.id;
            if (selectValue !== undefined) select.value = selectValue;
            if (textValue !== undefined) textInput.value = textValue;
        }

        container.appendChild(select);
        container.appendChild(textInput);
        return container;
    }

    validate() {
        if (!this.selectEl || !this.textEl) return null;
        const textVal = this.textEl.value.trim();
        if (!textVal) return null;

        const currentSelection = this.selectEl.value;
        const requiredLength = this.getRequiredLength(currentSelection);

        if (textVal.length !== requiredLength) {
            return this.errorMessage || `The entry for "${currentSelection}" must be exactly ${requiredLength} digits.`;
        }
        return null;
    }

    checkRequiredValidation() {
        if (!this.isRequired) return false;
        const data = this.getValue();
        if (!data.text) {
            const fallbackMsg = `${this.label || 'This field'} requires a text entry.`;
            this.showErrorMessage(this.requiredMessage || fallbackMsg);
            return true;
        }
        return false;
    }

    bindEvents() {
        if (!this.selectEl || !this.textEl) return;
        this.inputEl = this.textEl;

        this.selectEl.addEventListener('change', () => {
            this.updateTextInputAttributes();
            this.formatWithLeadingZeros();
            const errorReason = this.validate();
            if (errorReason) this.showErrorMessage(errorReason);
            else this.clearErrorMessage();
            this.logValues('select-change');
            this.onInput(this.getValue(), this.fieldId);
        });

        this.textEl.addEventListener('input', () => {
            if (this.maskRegex) {
                this.textEl.value = this.textEl.value.replace(this.maskRegex, '');
            }
            this.clearErrorMessage();
            this.logValues('text-input');
            this.onInput();
        });

        this.textEl.addEventListener('blur', () => {
            const isMissingRequired = this.checkRequiredValidation();
            if (isMissingRequired) {
                this.onInput();
                return;
            }
            this.formatWithLeadingZeros();
            const errorReason = this.validate();
            if (errorReason) {
                this.showErrorMessage(errorReason);
            } else {
                this.clearErrorMessage();
            }
            this.logValues('text-blur');
            this.onInput(this.getValue(), this.fieldId);
        });
    }
}