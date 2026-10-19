import { BaseField } from './BaseField.js';

export class ToggleField extends BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.defaultValue = this.config.default !== undefined ? Boolean(this.config.default) : false;
        this.initialValue = this.config.value !== undefined ? Boolean(this.config.value) : undefined;
    }
    /**
     * Sets the checked state of the toggle checkbox.
     * @param {boolean|string|number|null} value - Boolean value or equivalent representation.
     */
    setInputValue(value) {
        if (!this.inputEl) return;

        let checked = false;

        if (typeof value === 'boolean') {
            checked = value;
        } else if (typeof value === 'string') {
            const cleanStr = value.trim().toLowerCase();
            checked = cleanStr === 'true' || cleanStr === '1' || cleanStr === 'yes' || cleanStr === 'on';
        } else if (typeof value === 'number') {
            checked = value === 1;
        } else if (value === null || value === undefined) {
            checked = Boolean(this.defaultValue);
        } else {
            checked = Boolean(value);
        }

        this.inputEl.checked = checked;
        this.clearErrorMessage();
    }
    getValue() {
        return this?.inputEl?.checked ?? false;
    }

    toString() {
        return String(this.getValue());
    }

    createInputElement() {
        const wrapper = document.createElement('label');
        wrapper.className = 'toggle-field-container';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = this.fieldId;
        checkbox.className = 'toggle-field-input map-value-toggle edit-lock-toggle';

        const slider = document.createElement('span');
        slider.className = 'toggle-field-slider';

        wrapper.appendChild(checkbox);
        wrapper.appendChild(slider);

        if (this.label) {
            const labelSpan = document.createElement('span');
            labelSpan.className = 'toggle-field-label';
            labelSpan.textContent = this.label;
            wrapper.appendChild(labelSpan);
        }

        const liveFormValues = this.context.currentValues || {};
        let targetInitialValue = false;
        if (liveFormValues[this.fieldId] !== undefined) {
            targetInitialValue = Boolean(liveFormValues[this.fieldId]);
        } else if (this.initialValue !== undefined) {
            targetInitialValue = Boolean(this.initialValue);
        } else if (this.defaultValue !== undefined) {
            targetInitialValue = Boolean(this.defaultValue);
        }

        checkbox.checked = targetInitialValue;

        this.inputEl = checkbox;
        return wrapper;
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
            this.logValues('blur');
            if (isMissingRequired) {
                this.onInput();
            }
        });
    }
}