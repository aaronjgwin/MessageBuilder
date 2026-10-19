export class BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        this.fieldId = this.sanitizeId(fieldId);
        this.config = fieldConfig || {};
        this.context = dataContext;
        this.modelKey = this.config.modelKey || this.fieldId;
        this.model = this.context.currentValues || this.context.model || null;
        this.inputEl = null;
        this.errorGroupEl = null;
        this.errorTextEl = null;
        this.focusedValue = null;
        // main config
        this.label = this.config.label || `${this.fieldId} has no label property. Please update in Settings > Fields`;
        this.required = this.config.required ?? false;
        this.requiredMessage = this.config.requiredMessage || `${this.config.label || this.fieldId} is required.`;
        this.disabled = this.config.disabled ?? false;
        this.isEditingLocked = this.config.isEditingLocked ?? false;
        this.hideLabel = this.config.hideLabel ?? false;
        this.headerRow =  document.createElement('div');
        this.group =  document.createElement('div');
        this.keyLocks = this.config.keyLocks || null;
        this.stringFallback = this.config.stringFallback || null;
        //
        this.onInput = (...args) => {
            this.syncToModel();
            if (typeof onInputCallback === 'function') {
                return onInputCallback(...args);
            }
        };

    }

    /**
     * Defensive utility to sanitize element IDs for raw DOM attributes.
     */
    sanitizeId(id) {
        if (typeof id !== 'string') return 'field-' + Math.random().toString(36).slice(2, 11);
        return id.replace(/[^a-zA-Z0-9_\-]/g, '');
    }

    get isRequired() { return this.required; }
    get hasError() { return !!this.errorTextEl; }

    /**
     * Abstract Interface Enforcements
     */
    getValue() { throw new Error(`Abstract Method 'getValue()' must be implemented by subclass "${this.constructor.name}".`); }
    createInputElement() { throw new Error(`Abstract Method 'createInputElement()' must be implemented by subclass "${this.constructor.name}".`); }
    bindEvents() { throw new Error(`Abstract Method 'bindEvents()' must be implemented by subclass "${this.constructor.name}".`); }

    // ==========================================
    // DATA BINDING & STATE SYNC METHODS
    // ==========================================

    /**
     * Binds or re-binds a JavaScript data object to this field instance.
     */
    bindModel(modelObject, key = this.fieldId) {
        this.model = modelObject;
        this.modelKey = key;

        // 1. Capture pristine initial value from model if config.value wasn't provided
        if (this.initialValue === undefined && this.model && this.model[this.modelKey] !== undefined) {
            this.initialValue = this.model[this.modelKey];
        }

        // 2. Hydrate the DOM element with the model's data
        this.syncFromModel();
    }

    /**
     * UI -> MODEL: Reads current DOM/subclass value and writes it to the bound model.
     */
    syncToModel() {
        if (!this.model) return;
        try {
            const currentVal = this.getValue();
            this.model[this.modelKey] = currentVal;
        } catch (e) {
            // Failsafe if child getValue() is called before fully rendered
        }
    }

    /**
     * MODEL -> UI: Reads value from the bound model and populates the DOM input.
     */
    syncFromModel() {
        if (!this.model || this.model[this.modelKey] === undefined) return;
        this.setValue(this.model[this.modelKey], false);
    }

    /**
     * Updates the DOM element value, updates the bound model, and optionally triggers onInput.
     */
    setValue(value, notify = true) {
        this.setInputValue(value);

        if (this.model) {
            this.model[this.modelKey] = value;
        }
        if (notify) {
            this.onInput(value, this.fieldId);
        }
    }

    /**
     * Universal DOM value injector. Subclasses with complex structures can override this.
     */
    setInputValue(value) {

        if (!this.inputEl) return;

        const targetNode = this.inputEl.tagName === 'INPUT' || this.inputEl.tagName === 'SELECT' || this.inputEl.tagName === 'TEXTAREA'
            ? this.inputEl
            : this.inputEl.querySelector('input, select, textarea');

        if (targetNode) {
            targetNode.value = value ?? '';
        }

    }

    // ==========================================
    // RENDER & DOM LIFECYCLE
    // ==========================================

    /**
     * Universal DOM wrapper generator
     */
    render() {
        this.group.className = `${this.constructor.name.toLowerCase()}-widget input-group`;
        this.errorGroupEl = this.group;

        this.headerRow =  document.createElement('div');
        this.headerRow.className = 'field-header-row';

        if(!this.hideLabel) {
            const label = document.createElement('label');
            label.setAttribute('for', this.fieldId);
            label.textContent = this.label || '';

            if (this.isRequired) {
                const asterisk = document.createElement('span');
                asterisk.className = 'field-asterisk';
                asterisk.textContent = ' *';
                label.appendChild(asterisk);
            }

            this.headerRow.appendChild(label);
        }
        this.group.appendChild(this.headerRow);
        this.inputEl = this.createInputElement();
        this.group.appendChild(this.inputEl);

        if(this.keyLocks){
            const collection = [];
            const entry = this.keyLocks;
            if (entry?.ids?.length>0){
                entry?.ids.forEach(key =>{
                    collection.push(entry?.labels?.[key] ?? key);
                });
            }
            if (collection.length>0) {
                const aside = document.createElement('aside');
                aside.textContent = `This field is locked and can't be changed until it is detached from ${entry.context}: ${collection.join(', ')}`;
                aside.className = 'warning';
                this.group.appendChild(aside);
                this.inputEl.disabled = true;
            }
        }

        this.bindEvents();

        this.inputEl.addEventListener('focus', () => {
            this.focusedValue = this.getValue();
        });

        // Sync initial model data to DOM if bound model exists
        if (this.model && this.model[this.modelKey] !== undefined) {
            this.setInputValue(this.model[this.modelKey]);
        }

        return this.group;
    }

     updateLockState() {
        if (!this.inputEl) return;

        const isTargetDisabled = this.disabled || this.isEditingLocked;

        if (isTargetDisabled) {
            this.inputEl.setAttribute('disabled', 'true');
            this.inputEl.classList.add('is-locked');
        } else {
            this.inputEl.removeAttribute('disabled');
            this.inputEl.classList.remove('is-locked');
        }
    }

    /**
     * Hardened validation to accurately evaluate Strings, Arrays, Booleans, and Numbers.
     */
    checkRequiredValidation() {
        if (!this.isRequired) return false;
        const value = this.getValue();
        let isEmpty = false;

        if (value === null || value === undefined) {
            isEmpty = true;
        } else if (typeof value === 'string') {
            isEmpty = value.trim() === '';
        } else if (Array.isArray(value)) {
            isEmpty = value.length === 0;
        } else if (typeof value === 'number') {
            isEmpty = false;
        }

        if (isEmpty) {
            this.showErrorMessage(this.requiredMessage);
            return true;
        }
        this.clearErrorMessage();
        return false;
    }

    showErrorMessage(message) {
        this.clearErrorMessage();
        if (this.errorGroupEl) {
            this.errorGroupEl.classList.add('has-error');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error-message';
            errorDiv.textContent = message;
            this.errorTextEl = errorDiv;
            this.errorGroupEl.appendChild(errorDiv);
        }
    }

    clearErrorMessage() {
        if (this.errorGroupEl) {
            this.errorGroupEl.classList.remove('has-error');
        }
        if (this.errorTextEl && this.errorTextEl.parentNode) {
            this.errorTextEl.parentNode.removeChild(this.errorTextEl);
            this.errorTextEl = null;
        }
    }

    logValues(location){
        //console.log(location, this.inputEl, "|.v: ", this.inputEl.value?.trim(), "|gv: ", this.getValue(), "|ts: ", this.toString());
    }

    // Helper method to convert strings to camelCase
    toCamelCase(str) {
        return str
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
                index === 0 ? word.toLowerCase() : word.toUpperCase()
            )
            .replace(/\s+/g, '')
            .replace(/[^a-zA-Z0-9]/g, '');
    }
    isCamelCase(str) {
        return str.length > 0 && str === this.toCamelCase(str);
    }
    capitalize(str) {
        if (typeof str !== 'string' || !str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    toTitleCase(str) {
        if (typeof str !== 'string' || !str) return '';
        return str
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Splits camelCase
            .replace(/[-_]/g, ' ')               // Replaces hyphens/underscores with spaces
            .replace(/\b\w/g, char => char.toUpperCase());
    }
}

export default BaseField;
