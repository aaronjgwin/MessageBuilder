import { BaseField } from './BaseField.js';

/**
 * BaseBuilder Component
 * Intermediate abstract class extending BaseField to handle shared
 * collection mechanisms for ArrayBuilder and MapBuilder widgets.
 */
export class BaseBuilder extends BaseField {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}, dataState = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        this.filterQuery = '';
        this.listEl = null;
        this.searchFieldEl = null;

        this.showEditToggle = this.config.showEditToggle ?? false;

    }

    render() {
        const rootContainer = super.render();
        this.renderHeaderToggle();
        return rootContainer;
    }

    /**
     * Standardized JSON deserializer for initial form state or config values.
     * @param {Array|Object} fallback - Default container fallback if parsing fails
     */
    parseInitialData(fallback = []) {
        const liveFormValues = this.context.currentValues || {};
        let data = liveFormValues[this.fieldId] ?? this.config.value ?? fallback;

        if (typeof data === 'string') {
            const trimmed = data.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                    return JSON.parse(trimmed);
                } catch (e) {
                    return fallback;
                }
            }
        }
        return data;
    }

    /**
     * Optional post-mounting lifecycle hook.
     * Override in subclasses if DOM tasks are needed after parent node attachment.
     */
    postRender() {
        // Safe default fallback for callers expecting postRender()
    }

    /**
     * Shared UI builder for the search/filter input wrapper with icon.
     */
    createSearchWrapper(placeholder, customInputClass = '') {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'unified-input-wrapper';

        const searchIcon = document.createElement('span');
        searchIcon.innerHTML = '&#128269;';
        searchIcon.className = 'search-icon-indicator';

        const filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = `form-input-field ${customInputClass}`.trim();
        filterInput.placeholder = placeholder || 'Filter items...';

        filterInput.addEventListener('input', () => {
            this.filterQuery = filterInput.value.trim().toLowerCase();
            this.renderLiveListItems();
        });

        this.searchFieldEl = filterInput;
        searchWrapper.appendChild(searchIcon);
        searchWrapper.appendChild(filterInput);

        return searchWrapper;
    }

    /**
     * Standardized DOM factory for collection list containers (`<ul>`).
     */
    createListContainer(customClass = '') {
        const list = document.createElement('ul');
        list.className = `unstyled-list ${customClass}`.trim();
        list.setAttribute('role', 'list');
        this.listEl = list;
        return list;
    }

    /**
     * Helper to evaluate search filter matches across multiple string targets.
     */
    matchesFilter(...values) {
        if (!this.filterQuery) return true;
        return values.some(val =>
            String(val ?? '').toLowerCase().includes(this.filterQuery) // todo
        );
    }

    /**
     * Consolidated required field validation for collections.
     */
    checkRequiredValidation() {
        if (!this.isRequired) return false;

        if (this.isEmpty()) {
            const fallbackMsg = `${this.config.label || this.fieldId} requires at least one entry.`;
            this.showErrorMessage(this.config.requiredMessage || fallbackMsg);
            return true;
        }

        this.clearErrorMessage();
        return false;
    }

    /**
     * Abstract Methods Enforcements
     */
    isEmpty() {
        throw new Error(`Abstract Method 'isEmpty()' must be implemented by subclass "${this.constructor.name}".`);
    }

    renderLiveListItems() {
        throw new Error(`Abstract Method 'renderLiveListItems()' must be implemented by subclass "${this.constructor.name}".`);
    }

    renderHeaderToggle() {
        if (!this.showEditToggle) return;

        if (this.headerRow.querySelector('.toggle-group-wrapper')) return;

        const toggleGroup = document.createElement('div');
        toggleGroup.className = 'toggle-group-wrapper';

        const editToggleWrapper = document.createElement('label');
        editToggleWrapper.className = 'toggle-switch edit-lock-toggle';
        editToggleWrapper.title = this.isEditingLocked ? 'Unlock editing' : 'Lock editing';

        const toggleCheckbox = document.createElement('input');
        toggleCheckbox.type = 'checkbox';
        toggleCheckbox.checked = !this.isEditingLocked;

        const toggleSlider = document.createElement('span');
        toggleSlider.className = 'toggle-slider';

        editToggleWrapper.appendChild(toggleCheckbox);
        editToggleWrapper.appendChild(toggleSlider);

        toggleCheckbox.addEventListener('change', (e) => {
            this.isEditingLocked = !e.target.checked;
            editToggleWrapper.title = this.isEditingLocked ? 'Unlock editing' : 'Lock editing';
            this.updateLockState();
            this.renderLiveListItems();
        });

        toggleGroup.appendChild(editToggleWrapper);
        this.headerRow.appendChild(toggleGroup);

        if(this.isEditingLocked){
            this.updateLockState();
            this.renderLiveListItems();
        }
    }

}

export default BaseBuilder;