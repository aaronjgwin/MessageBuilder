import { BaseField } from './BaseField.js';

export class IntegerField extends BaseField {
    /**
     * Concrete IntegerField implementation inheriting from BaseField.
     * Manages clean numerical data capture with inline bounds containment checking rules.
     */
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.placeholder = this.config.placeholder || '';
        this.min = this.config.min;
        this.max = this.config.max;
        this.defaultValue = this.config.default;
        this.initialValue = this.config.value;
        this.errorMessage = this.config.errorMessage || null;
    }
    /**
     * Sets the integer value into the field and updates the DOM input.
     * @param {number|string|null} value - Integer, numeric string, or null/empty.
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

        // 2. Parse base-10 integer and assign to DOM
        const parsedInteger = parseInt(String(value), 10);
        inputNode.value = !isNaN(parsedInteger) ? String(parsedInteger) : '';

        this.clearErrorMessage();
    }
    /**
     * OVERRIDE: Extracts a pure, mathematically valid base-10 Integer Number from the field element
     * @returns {number|null} Pure integer parameter data, or null if empty
     */
    getValue() {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl?.querySelector('input');
        if (!inputNode) return null;

        const rawText = inputNode.value.trim();
        // Return null for empty fields or raw lone negative symbols if left behind
        if (!rawText || rawText === '-') return null;

        const parsedInteger = parseInt(rawText, 10);
        return isNaN(parsedInteger) ? null : parsedInteger;
    }

    /**
     * CRITICAL REPAIR: Unified display text proxy mapping directly into the replacement loop
     */
    toString() {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT' ? this.inputEl : this.inputEl?.querySelector('input');
        return inputNode ? inputNode.value.trim() : '';
    }

    /**
     * OVERRIDE: Generates structural element nodes, maps attributes, and hydra-formats initial data states
     * @returns {HTMLInputElement} Pure text box configured for strict numeric captures
     */
    createInputElement() {
        const activeContext = this.context || {};

        const input = document.createElement('input');
        input.type = 'text';
        input.id = this.fieldId;
        input.inputMode = 'numeric';

        if (this.placeholder) {
            input.placeholder = this.placeholder;
        }

        // Accessibility & Boundary Constraint Parameter Attributions
        if (this.min !== undefined) input.setAttribute('aria-valuemin', this.min);
        if (this.max !== undefined) input.setAttribute('aria-valuemax', this.max);

        // Safe evaluation of maxLength to accommodate negative symbols
        let calculatedMaxLength = 15;
        if (this.max !== undefined || this.min !== undefined) {
            const maxLen = this.max !== undefined ? String(this.max).length : 0;
            const minLen = this.min !== undefined ? String(this.min).length : 0;
            calculatedMaxLength = Math.max(maxLen, minLen);
        }
        input.maxLength = calculatedMaxLength;

        // Value Hydration Priority Chain
        const liveFormValues = activeContext.currentValues || {};
        let initialRawValue = '';

        if (liveFormValues[this.fieldId] !== undefined) {
            initialRawValue = liveFormValues[this.fieldId];
        } else if (this.defaultValue !== undefined) {
            initialRawValue = this.defaultValue;
        } else if (this.initialValue !== undefined) {
            initialRawValue = this.initialValue;
        }

        if (initialRawValue !== '') {
            const parsed = parseInt(initialRawValue, 10);
            input.value = !isNaN(parsed) ? String(parsed) : '';
        }

        this.inputEl = input;
        return input;
    }

    /**
     * OVERRIDE: Evaluates explicit numeric limits bounds verification parameters rules
     * @returns {string|null} Active validation message string, or null if matches rules
     */
    validate() {
        const integerValue = this.getValue();
        if (integerValue === null) return null;

        if (this.min !== undefined && integerValue < this.min) {
            return this.errorMessage || `Value must be at least ${this.min}.`;
        }
        if (this.max !== undefined && integerValue > this.max) {
            return this.errorMessage || `Value cannot exceed ${this.max}.`;
        }
        return null;
    }

    /**
     * Sanitizes raw text string inputs, selectively preserving leading negative states
     */
    sanitizeInputString(text) {
        const isNegative = text.trim().startsWith('-');
        const digitsOnly = text.replace(/[^0-9]/g, '');
        return (isNegative ? '-' : '') + digitsOnly;
    }

    /**
     * OVERRIDE: Attaches structural key monitoring and programmatic focus clamping listener pipelines
     */
    bindEvents() {
        if (!this.inputEl) return;

        this.inputEl.addEventListener('paste', (e) => {
            const clipboard = e.clipboardData || window.clipboardData;
            if (!clipboard) return;
            e.preventDefault();

            const pastedText = clipboard.getData('text');
            const cleanText = this.sanitizeInputString(pastedText);

            if (cleanText.length > 0) {
                const start = this.inputEl.selectionStart;
                const end = this.inputEl.selectionEnd;
                const currentVal = this.inputEl.value;
                const newVal = currentVal.slice(0, start) + cleanText + currentVal.slice(end);

                this.inputEl.value = newVal.slice(0, this.inputEl.maxLength);

                const newCursorPos = start + Math.min(cleanText.length, this.inputEl.maxLength - start);
                this.inputEl.setSelectionRange(newCursorPos, newCursorPos);
                this.logValues('paste');
                this.onInput();
            }
        });

        this.inputEl.addEventListener('input', () => {
            this.clearErrorMessage();
            const position = this.inputEl.selectionStart;
            const originalLength = this.inputEl.value.length;

            this.inputEl.value = this.sanitizeInputString(this.inputEl.value);

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
            let integerValue = this.getValue();
            const errorReason = this.validate();

            // If missing required or validation fails, revert to focused value, show error, and refocus
            if (isMissingRequired || errorReason || integerValue === null) {
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

            if (this.min !== undefined && integerValue < this.min) {
                integerValue = this.min;
            }
            if (this.max !== undefined && integerValue > this.max) {
                integerValue = this.max;
            }

            this.inputEl.value = integerValue.toString();
            this.clearErrorMessage();
            this.logValues('blur');
            this.onInput(this.getValue(), this.fieldId);
        });
    }
}