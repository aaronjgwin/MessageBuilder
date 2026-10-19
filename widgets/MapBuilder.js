import { BaseBuilder } from './BaseBuilder.js';

export class MapBuilder extends BaseBuilder {
    /**
     * Concrete MapBuilder component for managing key/value dictionary datasets.
     */
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        this.filterPlaceholder = this.config.filterPlaceholder || 'Filter map keys or values...';
        this.keyPlaceholder = this.config.keyPlaceholder || 'Enter new key...';
        this.valuePlaceholder = this.config.valuePlaceholder || 'Enter value...';

        this.showSearchRow = this.config.showSearchRow ?? true;
        this.showAddRow = this.config.showAddRow ?? true;
        this.clearField = this.config.clearField ?? false;

        const initialData = this.parseInitialData({});
        this.dictionary = (initialData && typeof initialData === 'object' && !Array.isArray(initialData))
            ? { ...initialData }
            : {};

        this.newMapKeyEl = null;
        this.newMapValueEl = null;
        this.newMapValueElContainer = null;
        this.insertionRowEl = null;

    }

    getValue() {
        return { ...this.dictionary };
    }

    isEmpty() {
        return Object.keys(this.dictionary).length === 0;
    }

    setInputValue(value) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            this.dictionary = { ...value };
        } else if (typeof value === 'string' && value.trim()) {
            try {
                const parsed = JSON.parse(value);
                this.dictionary = (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
                    ? parsed
                    : {};
            } catch {
                this.dictionary = {};
            }
        } else {
            this.dictionary = {};
        }

        if (this.newMapKeyEl) this.newMapKeyEl.value = '';
        if (this.newMapValueEl) this.newMapValueEl.value = '';

        if (this.searchFieldEl) {
            this.searchFieldEl.value = '';
            this.filterQuery = '';
        }

        this.renderLiveListItems();
    }

    createInputElement() {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'settings-card spaced-card-top';

        if (this.showSearchRow) {
            const searchRow = document.createElement('div');
            searchRow.className = 'new-entry-row inline-form-row section-border-bottom map-search-row';

            const searchWrapper = this.createSearchWrapper(this.filterPlaceholder, 'map-search-input');
            searchRow.appendChild(searchWrapper);
            cardContainer.appendChild(searchRow);
        }

        if (this.showAddRow) {
            const insertionRow = document.createElement('div');
            insertionRow.className = 'new-entry-row inline-form-row section-border-bottom map-insertion-row';
            this.insertionRowEl = insertionRow;
            cardContainer.appendChild(insertionRow);

            const newBadge = document.createElement('span');
            newBadge.className = 'text-badge-label';
            newBadge.textContent = 'NEW';
            insertionRow.appendChild(newBadge);

            this.createKeyValuePair(insertionRow);

            const appendRowBtn = document.createElement('button');
            appendRowBtn.type = 'button';
            appendRowBtn.className = 'chrome-btn-secondary map-add-btn';
            appendRowBtn.innerHTML = '&#43;';
            appendRowBtn.title = 'Add pair entry';
            appendRowBtn.addEventListener('click', () => this.handleAppendPairItem());
            insertionRow.appendChild(appendRowBtn);
        }

        this.inputEl = this.newMapKeyEl || this.searchFieldEl;

        const list = this.createListContainer('map-items-list');
        cardContainer.appendChild(list);

        this.renderLiveListItems();
        return cardContainer;
    }

    createKeyValuePair(insertionRow) {
        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.className = 'form-input-field map-key-input';
        keyInput.placeholder = this.keyPlaceholder;
        this.newMapKeyEl = keyInput;
        insertionRow.appendChild(keyInput);

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'form-input-field map-value-input';
        valueInput.placeholder = this.valuePlaceholder;
        this.newMapValueEl = valueInput;
        this.newMapValueElContainer = valueInput;
        insertionRow.appendChild(valueInput);
    }

    updateLockState() {
        super.updateLockState();
        if (this.insertionRowEl) {
            this.insertionRowEl.style.display = this.isEditingLocked ? 'none' : '';
        }
    }

    renderLiveListItems() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        Object.entries(this.dictionary).forEach(([mapKey, mapValue]) => {
            if (!this.matchesFilter(mapKey, mapValue)) return;

            const li = this.createRowNodeElement(mapKey, mapValue);
            this.listEl.appendChild(li);
        });
    }

    createRowNodeElement(key, val) {
        const li = document.createElement('li');
        li.className = 'settings-row map-item-row';
        li.setAttribute('role', 'listitem');

        const inputsBlock = document.createElement('div');
        inputsBlock.className = 'toolbar-actions-block map-row-inputs';

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.className = 'row-key form-input-field';
        keyInput.value = key;
        keyInput.readOnly = true;

        inputsBlock.appendChild(keyInput);

        const valueInput = this.createValueInputElement(key, val, false);
        inputsBlock.appendChild(valueInput);
        li.appendChild(inputsBlock);

        if (!this.isEditingLocked) {
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'chrome-btn-secondary dialog-action-btn';
            deleteBtn.textContent = !this.clearField ? 'Delete' : 'Clear';
            deleteBtn.disabled = this.checkDisabledStatus(key);
            if (this.clearField) {
                deleteBtn.addEventListener('click', () => this.handleClearItem(key));
            } else {
                deleteBtn.addEventListener('click', () => this.handleDeletePairItem(key));
            }
            li.appendChild(deleteBtn);
        }
        return li;
    }

    checkDisabledStatus(key){
        return false;
    }

    createValueInputElement(key, currentValue, isNewRow = false) {
        let valueInput;
        if (typeof currentValue === 'boolean') {
            valueInput = document.createElement('div');
            valueInput.className = 'map-row-toggle form-input-field';

            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'toggle-switch map-row-toggle';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = currentValue;
            checkbox.disabled = this.isEditingLocked;

            const slider = document.createElement('span');
            slider.className = 'toggle-slider';

            toggleLabel.appendChild(checkbox);
            toggleLabel.appendChild(slider);

            checkbox.addEventListener('change', (e) => {
                this.clearErrorMessage();
                this.dictionary[key] = e.target.checked;
                if (this.onInput) this.onInput(this.getValue(), this.fieldId);
            });
            valueInput.appendChild(toggleLabel);
        } else {
            valueInput = document.createElement('input');
            valueInput.type = 'text';
            valueInput.className = 'row-value form-input-field';
            valueInput.value = currentValue;
            valueInput.readOnly = this.isEditingLocked;

            valueInput.addEventListener('blur', () => {
                this.clearErrorMessage();
                this.dictionary[key] = valueInput.value;
                if (this.onInput) this.onInput(this.getValue(), this.fieldId);
            });
        }
        return valueInput;
    }

    handleAppendPairItem() {
        if (this.isEditingLocked || !this.newMapKeyEl || !this.newMapValueEl) return;

        const key = this.toCamelCase(this.newMapKeyEl.value.trim());
        const rawVal = this.newMapValueEl.value.trim();

        if (!key) {
            this.showErrorMessage("Please enter a valid key name.");
            if (this.onInput) this.onInput();
            return;
        }

        if (this.dictionary[key] !== undefined) {
            this.showErrorMessage(`The key identifier "${key}" already exists inside this map workspace grid.`);
            if (this.onInput) this.onInput();
            return;
        }

        let parsedVal = rawVal;
        const cleanVal = rawVal.toLowerCase();
        if (cleanVal === 'true') {
            parsedVal = true;
        } else if (cleanVal === 'false') {
            parsedVal = false;
        }

        this.clearErrorMessage();
        this.dictionary[key] = parsedVal;

        this.newMapKeyEl.value = '';
        this.newMapValueEl.value = '';

        if (this.searchFieldEl && this.filterQuery) {
            this.filterQuery = "";
            this.searchFieldEl.value = "";
        }

        this.renderLiveListItems();
        if (this.onInput) this.onInput(this.getValue(), this.fieldId);
    }

    handleDeletePairItem(targetKey) {
        if (this.isEditingLocked) return;
        delete this.dictionary[targetKey];
        this.renderLiveListItems();
        this.checkRequiredValidation();
        if (this.onInput) this.onInput(this.getValue(), this.fieldId);
    }

    handleClearItem(targetKey) {
        if (this.isEditingLocked) return;
        this.dictionary[targetKey] = '';
        this.renderLiveListItems();
        this.checkRequiredValidation();
        if (this.onInput) this.onInput(this.getValue(), this.fieldId);
    }

    bindEvents() {
        const runEnterAddRowCycle = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleAppendPairItem();
            }
        };

        if (this.newMapKeyEl) {
            this.newMapKeyEl.addEventListener('keydown', runEnterAddRowCycle);
            this.newMapKeyEl.addEventListener('blur', () => {
                this.newMapKeyEl.value = this.toCamelCase(this.newMapKeyEl.value.trim());
                this.checkRequiredValidation();
                if (this.onInput) this.onInput();
            });
        }

        if (this.newMapValueEl) {
            this.newMapValueEl.addEventListener('keydown', runEnterAddRowCycle);
        }
    }
}

export default MapBuilder;