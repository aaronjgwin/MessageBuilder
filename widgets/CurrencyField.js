import { BaseField } from './BaseField.js';

export class CurrencyField extends BaseField {
    /**
     * Concrete currency implementation inheriting from BaseField.
     * Manages high-precision financial tracking with automatic decimal alignment masks.
     */
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.separator = this.config.separator || 'comma';
        this.centsRequired = !!this.config.centsRequired;
        this.toStringSymbol = this.config.toStringSymbol || '';
        this.alignRight = !!this.config.alignRight;
        this.placeholder = this.config.placeholder || '';
        this.defaultValue = this.config.default;
        this.initialValue = this.config.value;
        this.min = this.config.min;
        this.max = this.config.max;
        this.errorMessage = this.config.errorMessage || null;
        this.invalidMessage = this.config.invalidMessage || null;

        // Internal state cache for clean mathematical numbers
        this._rawNumericValue = null;

        // Pre-compile localized regular expression pattern once at startup
        const patternString = this.getFormat(this.separator, this.centsRequired);
        this.validationRegex = new RegExp(patternString);
    }

    /**
     * Resolves the string pattern from stored format rules
     */
    getFormat(separator, centsRequired) {
        const storedRegExs = {
            "commaSeparatedOptionalDecimal": "^(?:0|[1-9]\\d{0,2}(?:,\\d{3})*)(?:\\.\\d{2})?$",
            "commaSeparatedRequiredDecimal": "^(?:0|[1-9]\\d{0,2}(?:,\\d{3})*)\\.\\d{2}$",
            "dotSeparatedOptionalDecimal": "^(?:0|[1-9]\\d{0,2}(?:\\.\\d{3})*)(?:,\\d{2})?$",
            "dotSeparatedRequiredDecimal": "^(?:0|[1-9]\\d{0,2}(?:\\.\\d{3})*),\\d{2}$",
            "spaceSeparatedOptionalDecimal": "^(?:0|[1-9]\\d{0,2}(?: \\d{3})*)(?:[\\.,]\\d{2})?$",
            "spaceSeparatedRequiredDecimal": "^(?:0|[1-9]\\d{0,2}(?: \\d{3})*)(?:[\\.,]\\d{2})$"
        };

        switch (separator) {
            case 'dot':
                return centsRequired ? storedRegExs.dotSeparatedRequiredDecimal : storedRegExs.dotSeparatedOptionalDecimal;
            case 'space':
                return centsRequired ? storedRegExs.spaceSeparatedRequiredDecimal : storedRegExs.spaceSeparatedOptionalDecimal;
            default:
                return centsRequired ? storedRegExs.commaSeparatedRequiredDecimal : storedRegExs.commaSeparatedOptionalDecimal;
        }
    }
    /**
     * Sets the currency field value, updating both the formatted DOM text and cached float number.
     * @param {number|string|null} value - Numeric amount, formatted/unformatted string, or null/empty.
     */
    setInputValue(value) {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT'
            ? this.inputEl
            : this.inputEl?.querySelector('input');

        // 1. Handle Null / Empty values
        if (value === null || value === undefined || value === '') {
            this._rawNumericValue = null;
            if (inputNode) inputNode.value = '';
            this.clearErrorMessage();
            return;
        }

        // 2. Format display string using localized currency rules
        const formattedDisplay = this.formatValueToCurrency(value);

        // 3. Update internal _rawNumericValue float cache
        if (typeof value === 'number') {
            this._rawNumericValue = isNaN(value) ? null : value;
        } else {
            let mathString = String(value).trim();
            if (this.separator === 'dot') {
                mathString = mathString.replace(/\./g, '').replace(',', '.');
            } else if (this.separator === 'space') {
                mathString = mathString.replace(/ /g, '').replace(',', '.');
            } else {
                mathString = mathString.replace(/,/g, '');
            }

            const parsed = parseFloat(mathString);
            this._rawNumericValue = isNaN(parsed) ? null : parsed;
        }

        // 4. Update DOM element
        if (inputNode) {
            inputNode.value = formattedDisplay;
        }

        this.clearErrorMessage();
    }
    /**
     * OVERRIDE: Returns the instantly cached pure Float Number without repeating string cleanup parsing.
     * @returns {number|null} Raw numerical float parameter, or null if field remains empty
     */
    getValue() {
        return this._rawNumericValue;
    }

    /**
     * Dynamic localized currency layout formatter.
     * Automatically aligns output text with exactly what validationRegex expects to see.
     */
    formatValueToCurrency(inputValue) {
        if (inputValue === undefined || inputValue === null || inputValue === '') return '';

        let cleanStr = String(inputValue).trim();
        const isNegative = cleanStr.startsWith('-');

        if (this.separator === 'dot') {
            cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
        } else if (this.separator === 'space') {
            cleanStr = cleanStr.replace(/ /g, '').replace(',', '.');
        } else {
            cleanStr = cleanStr.replace(/,/g, '');
        }

        let floatValue = parseFloat(cleanStr);
        if (isNaN(floatValue)) return '';

        if (isNegative && floatValue > 0) floatValue *= -1;

        const localeMap = { 'comma': 'en-US', 'dot': 'de-DE', 'space': 'fr-FR' };
        const targetLocale = localeMap[this.separator] || 'en-US';

        // Force exactly 2 decimals if centsRequired is active, or if a fractional value exists
        const hasFraction = floatValue % 1 !== 0;
        const minFractionDigits = (this.centsRequired || hasFraction) ? 2 : 0;

        return new Intl.NumberFormat(targetLocale, {
            minimumFractionDigits: minFractionDigits,
            maximumFractionDigits: 2
        }).format(floatValue);
    }

    /**
     * OVERRIDE: Generates structural elements, maps attributes, and hydra-formats baseline values
     * @returns {HTMLElement} A layout wrapper div container block mapping the input field inline
     */
    createInputElement() {
        const activeContext = this.context || {};
        const wrapper = document.createElement('div');
        wrapper.className = 'currency-input-wrapper';
        if (this.toStringSymbol.length > 0) wrapper.setAttribute("data-symbol", this.toStringSymbol);

        if (this.alignRight) {
            wrapper.classList.add('align-right');
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.id = this.fieldId;
        input.inputMode = 'decimal';
        input.maxLength = 15;
        input.placeholder = this.placeholder;

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
            input.value = this.formatValueToCurrency(initialRawValue);
            let mathString = String(initialRawValue).trim();
            if (this.separator === 'dot') mathString = mathString.replace(/\./g, '').replace(',', '.');
            else if (this.separator === 'space') mathString = mathString.replace(/ /g, '').replace(',', '.');
            else mathString = mathString.replace(/,/g, '');

            const parsed = parseFloat(mathString);
            this._rawNumericValue = isNaN(parsed) ? null : parsed;
        } else {
            this._rawNumericValue = null;
        }

        wrapper.appendChild(input);
        return wrapper;
    }

    /**
     * OVERRIDE: Optional range check and boundary limit parameters validation logic rules
     * @returns {string|null} Active validation message text, or null if complete
     */
    validate() {
        const textValue = this.inputEl ? this.inputEl.value.trim() : '';
        if (textValue === '') return null;

        // 1. Strict formatting style validation via pre-compiled dynamic regex match bounds
        const isPatternValid = this.validationRegex.test(textValue);
        if (!isPatternValid) {
            return this.invalidMessage || `Invalid format. Expected layout like: ${this.placeholder || '16,000'}`;
        }

        const numericValue = this.getValue();
        if (numericValue === null) return null;

        // 2. Minimum monetary boundary enforcement check
        if (this.min !== undefined && numericValue < this.min) {
            return this.errorMessage || `Amount cannot be less than ${this.toStringSymbol}${this.min}`;
        }

        // 3. Maximum monetary boundary enforcement check
        if (this.max !== undefined && numericValue > this.max) {
            return this.errorMessage || `Amount cannot exceed ${this.toStringSymbol}${this.max}`;
        }

        return null;
    }

    /**
     * OVERRIDE: Integrates financial validation checking masks, continuous filtering, and blur locking loops
     */
    bindEvents() {
        const wrapper = this.inputEl;
        const input = wrapper.querySelector('input');
        if (!input) return;

        this.inputEl = input;

        // Continuous typing character filter layout modifier
        this.inputEl.addEventListener('input', () => {
            this.clearErrorMessage();
            const position = this.inputEl.selectionStart;
            const originalLength = this.inputEl.value.length;
            const isNegative = this.inputEl.value.trim().startsWith('-');

            let allowedCharactersRegex = /[^0-9.]/g;
            if (this.separator === 'dot') allowedCharactersRegex = /[^0-9,]/g;
            if (this.separator === 'space') allowedCharactersRegex = /[^0-9.,]/g;

            let cleanDigits = this.inputEl.value.replace(allowedCharactersRegex, '');
            const targetSplitChar = this.separator === 'dot' ? ',' : '.';
            const parts = cleanDigits.split(targetSplitChar);

            if (parts.length > 2) {
                cleanDigits = parts[0] + targetSplitChar + parts.slice(1).join('');
            }

            this.inputEl.value = (isNegative ? '-' : '') + cleanDigits;

            const newLength = this.inputEl.value.length;
            this.inputEl.setSelectionRange(
                position + (newLength - originalLength),
                position + (newLength - originalLength)
            );

            if (typeof this.onInput === 'function') this.onInput();
        });

        // Blurring lifecycle format structural conversions execution pass
        this.inputEl.addEventListener('blur', () => {
            const isMissingRequired = this.checkRequiredValidation();
            const currentRawValue = this.inputExtractedValue ? this.inputEl.value.trim() : this.inputEl.value.trim();

            // Temporarily format/parse for validation checks
            if (currentRawValue && !isMissingRequired) {
                let mathString = currentRawValue;
                if (this.separator === 'dot') mathString = mathString.replace(/\./g, '').replace(',', '.');
                else if (this.separator === 'space') mathString = mathString.replace(/ /g, '').replace(',', '.');
                else mathString = mathString.replace(/,/g, '');
                mathString = mathString.replace(/[^0-9.\-]/g, '');

                const parsed = parseFloat(mathString);
                this._rawNumericValue = isNaN(parsed) ? null : parsed;
                this.inputEl.value = this.formatValueToCurrency(currentRawValue);
            } else {
                this._rawNumericValue = null;
            }

            const errorReason = this.validate();

            // If missing required, parsing failed, or validation failed, revert to focused value, show error, and refocus
            if (isMissingRequired || errorReason || (currentRawValue && this._rawNumericValue === null)) {
                if (this.focusedValue !== undefined) {
                    this.inputEl.value = String(this.focusedValue);
                    // Re-evaluate raw numeric value for the focused state
                    let mathString = String(this.focusedValue);
                    if (this.separator === 'dot') mathString = mathString.replace(/\./g, '').replace(',', '.');
                    else if (this.separator === 'space') mathString = mathString.replace(/ /g, '').replace(',', '.');
                    else mathString = mathString.replace(/,/g, '');
                    const parsed = parseFloat(mathString.replace(/[^0-9.\-]/g, ''));
                    this._rawNumericValue = isNaN(parsed) ? null : parsed;
                } else if (this.defaultValue !== undefined) {
                    this.inputEl.value = String(this.defaultValue);
                    this._rawNumericValue = parseFloat(this.defaultValue) || null;
                } else {
                    this.inputEl.value = '';
                    this._rawNumericValue = null;
                }

                this.showErrorMessage(errorReason || this.requiredMessage);
                this.inputEl.focus();
                return;
            }

            this.clearErrorMessage();
            this.logValues('blur');
            if (typeof this.onInput === 'function') this.onInput(this.getValue(), this.fieldId);
        });
    }

    /**
     * String representation serialization pipeline
     */
    toString() {
        const textValue = this.inputEl ? this.inputEl.value.trim() : '';
        if (!textValue) return '';
        return `${this.toStringSymbol}${textValue}`.trim();
    }
}

export default CurrencyField;