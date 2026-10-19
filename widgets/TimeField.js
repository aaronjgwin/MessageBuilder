// widgets/TimeField.js
import { BaseField } from './BaseField.js';

export class TimeField extends BaseField {
    /**
     * Concrete time tracking component inheriting from BaseField.
     * Supports localized 12H/24H formats, optional seconds, custom separators, and shorthand auto-formatting.
     */

    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        // Extracted Config Properties & Defaults
        this.secondsRequired = this.config.secondsRequired ?? false;
        this.use24Hour = this.config.use24Hour ?? true;
        this.separator = this.config.separator || 'colon';
        this.defaultValue = this.config.default;
        this.initialValue = this.config.value;
        this.errorMessage = this.config.errorMessage || null;

        // Track the last value state to detect keystrokes accurately
        this.lastInputValue = '';

        // Resolve custom localized JSON constraints passed down from fields.json
        this.separators = {
            'dot': ['.', '.'],
            'none': ['', ''],
            'none/colon': ['', ':']
        }[this.separator] || [':', ':']; // colon

        // Instantiate regex validation engine
        this.regex = this.getFormat(this.use24Hour, this.secondsRequired, this.separators);
    }
    /**
     * Sets the time field value, formatting inputs and updating the DOM input element.
     * @param {string|null} value - Time string (e.g., "14:30", "2:30 PM", "230p"), or null/empty.
     */
    setInputValue(value) {
        const inputNode = this.inputEl && this.inputEl.tagName === 'INPUT'
            ? this.inputEl
            : this.inputEl?.querySelector('input');

        if (!inputNode) return;

        // 1. Handle Null / Empty values
        if (value === null || value === undefined || value === '') {
            inputNode.value = '';
            this.lastInputValue = '';
            this.clearErrorMessage();
            return;
        }

        // 2. Parse shorthand or raw time strings into standard configured output format
        const strValue = String(value).trim();
        const formattedTime = this.parseInput(strValue) || strValue;

        // 3. Update DOM element & internal state tracker
        inputNode.value = formattedTime;
        this.lastInputValue = formattedTime;

        this.clearErrorMessage();
    }
    getFormat(use24Hour, secondsRequired, separators) {
        const storedRegExs = {
            true: { // 24H
                true: "^(?:[01]\\d|2[0-3]){{d1}}[0-5]\\d{{d2}}[0-5]\\d$", // Required Seconds
                false: "^(?:[01]\\d|2[0-3]){{d1}}[0-5]\\d(?:{{d2}}[0-5]\\d)?$" // Optional Seconds
            },
            false: { // 12H
                true: "^(?:0?[1-9]|1[0-2]){{d1}}[0-5]\\d{{d2}}[0-5]\\d\\s?[aApP][mM]$", // Required Seconds
                false: "^(?:0?[1-9]|1[0-2]){{d1}}[0-5]\\d(?:{{d2}}[0-5]\\d)?\\s?[aApP][mM]$"  // Optional Seconds
            }
        };
        const selectedPattern = storedRegExs[use24Hour][secondsRequired];

        // Safely escape separator symbols for regex embedding
        const escapeRegex = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const d1 = escapeRegex(separators[0]);
        const d2 = escapeRegex(separators[1]);

        const finalPatternString = selectedPattern.replaceAll('{{d1}}', d1).replaceAll('{{d2}}', d2);

        return new RegExp(finalPatternString);
    }

    createPlaceholder(use24Hour, secondsRequired, separators) {
        return `00${separators[0]}00${secondsRequired || !use24Hour ? `${separators[1]}00` : ''}${use24Hour ? '' : ' AM'}${secondsRequired ? ''
            : ` or 00${separators[0]}00${separators[1]}00${use24Hour ? '' : ' AM'}`}`;
    }

    /**
     * Parses shorthand entries (e.g., "1a", "230p", "1234", "123456") into a standardized time string
     * matching active configuration parameters (24H/12H, seconds required, separators).
     */
    parseInput(inputStr) {
        if (!inputStr || !inputStr.trim()) return null;
        const str = inputStr.trim().toLowerCase();

        // 1. Detect meridian preference (AM/PM)
        let meridian = null;
        if (str.includes('p')) {
            meridian = 'PM';
        } else if (str.includes('a')) {
            meridian = 'AM';
        }

        // 2. Strip meridian characters & trailing spaces to isolate numeric time parts
        const cleanStr = str.replace(/[apm\s]/g, '');

        let hours = 0, minutes = 0, seconds = 0;
        const parts = cleanStr.split(/[:.]/);

        if (parts.length > 1) {
            // Delimited input: e.g. "1:30", "14:30:00", "2.30"
            hours = parseInt(parts[0], 10) || 0;
            minutes = parseInt(parts[1], 10) || 0;
            seconds = parts[2] ? (parseInt(parts[2], 10) || 0) : 0;
        } else {
            // Dynamic right-to-left numeric extraction
            let d = cleanStr.replace(/[^0-9]/g, '');
            if (!d) return null;

            if (d.length > 4) {
                seconds = parseInt(d.slice(-2), 10);
                d = d.slice(0, -2);
            }
            if (d.length > 2) {
                minutes = parseInt(d.slice(-2), 10);
                d = d.slice(0, -2);
            }
            hours = parseInt(d, 10) || 0;
        }

        // Adjust hours for 12-hour meridian offsets
        if (meridian === 'PM' && hours < 12) {
            hours += 12;
        } else if (meridian === 'AM' && hours === 12) {
            hours = 0;
        }

        return this.formatTime(hours, minutes, seconds, meridian);
    }

    /**
     * Formats parsed hours, minutes, and seconds into configured string output
     */
    formatTime(hours, minutes, seconds, meridian = null) {
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            return null;
        }

        let displayHours = hours;
        let displayMeridian = '';

        if (this.use24Hour) {
            displayHours = String(hours).padStart(2, '0');
        } else {
            let ampm = meridian || (hours >= 12 ? 'PM' : 'AM');
            let h12 = hours % 12;
            if (h12 === 0) h12 = 12;
            displayHours = String(h12).padStart(2, '0');
            displayMeridian = ` ${ampm.toUpperCase()}`;
        }

        const hh = displayHours;
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        const [sep1, sep2] = this.separators;

        if (this.secondsRequired) {
            return `${hh}${sep1}${mm}${sep2}${ss}${displayMeridian}`;
        } else {
            return seconds > 0
                ? `${hh}${sep1}${mm}${sep2}${ss}${displayMeridian}`
                : `${hh}${sep1}${mm}${displayMeridian}`;
        }
    }

    /**
     * OVERRIDE: Extracts current time string value out of the field element
     */
    getValue() {
        return this.inputEl ? this.inputEl.value.trim() : '';
    }

    toString() {
        return this.getValue();
    }

    /**
     * OVERRIDE: Builds text input element structure
     */
    createInputElement() {
        const input = document.createElement('input');
        input.type = 'text';
        input.id = this.fieldId;
        input.className = 'form-time-input';

        input.placeholder = this.createPlaceholder(this.use24Hour, this.secondsRequired, this.separators);
        input.maxLength = 12;

        const liveFormValues = this.context.currentValues || {};
        if (liveFormValues[this.fieldId] !== undefined) {
            input.value = liveFormValues[this.fieldId];
        } else if (this.defaultValue !== undefined) {
            input.value = this.defaultValue;
        } else if (this.initialValue !== undefined) {
            input.value = this.initialValue;
        }

        this.lastInputValue = input.value;
        this.inputEl = input;
        return input;
    }

    /**
     * OVERRIDE: Validates input string against localized format regex
     */
    validate() {
        const timeStr = this.getValue();
        if (!timeStr) return null;

        if (!this.regex.test(timeStr)) {
            return this.errorMessage || `Time format must match: ${this.inputEl.placeholder}`;
        }

        return null;
    }

    /**
     * OVERRIDE: Handles live input filtering and blur auto-completion
     */
    bindEvents() {
        if (!this.inputEl) return;

        // 1. Live Input Filtering (Allows digits, separators, spaces, and A/P/M for shorthand typing)
        this.inputEl.addEventListener('input', () => {
            this.clearErrorMessage();

            let currentRawInput = this.inputEl.value;

            // Permits shorthand entries like "1a", "230p", "1234"
            const filterRegex = /[^0-9.:aApPmM\s]/g;
            const sanitizedInput = currentRawInput.replace(filterRegex, '');

            this.inputEl.value = sanitizedInput;
            this.lastInputValue = sanitizedInput;

            this.logValues('input');
            this.onInput();
        });

        // 2. Blur Event: Autocorrect shorthand, validate, and revert on failure
        this.inputEl.addEventListener('blur', () => {
            const isMissingRequired = this.checkRequiredValidation();
            let activeText = this.inputEl.value.trim();

            if (activeText && !isMissingRequired) {
                // Autocorrect shorthand entries (e.g. "1a", "230p", "1234")
                const formatted = this.parseInput(activeText);
                if (formatted) {
                    this.inputEl.value = formatted;
                    this.lastInputValue = formatted;
                }
            }

            const errorReason = this.validate();

            // If required check fails or custom validation fails, revert to focused value, show error, and refocus
            if (isMissingRequired || errorReason) {
                if (this.focusedValue !== undefined) {
                    this.inputEl.value = String(this.focusedValue);
                    this.lastInputValue = String(this.focusedValue);
                } else if (this.defaultValue !== undefined) {
                    this.inputEl.value = String(this.defaultValue);
                    this.lastInputValue = String(this.defaultValue);
                } else {
                    this.inputEl.value = '';
                    this.lastInputValue = '';
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