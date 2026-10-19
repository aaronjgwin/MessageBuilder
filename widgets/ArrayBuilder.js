import { BaseBuilder } from './BaseBuilder.js';

export class ArrayBuilder extends BaseBuilder {
    /**
     * Concrete ArrayBuilder component for managing list arrays visually.
     */
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);

        const initialData = this.parseInitialData([]);
        this.items = Array.isArray(initialData) ? [...initialData] : [];

        this.unifiedInputEl = null;
        this.appendRowBtn = null;
        this.draggedElementInstance = null;

        this.showSearchAddRow = this.config.showSearchAddRow ?? true;
        this.showAddButton = this.config.showAddButton ?? true;
        this.overrideAddBtnEvent = typeof this.config.overrideAddBtnEvent === 'function' ? this.config.overrideAddBtnEvent : null;

        this.allowObjectEdit = this.config.allowObjectEdit ?? false;
        this.allowDrag = this.config.allowDrag ?? true;
        this.isEditingLocked = this.config.isEditingLocked ?? false;
        this.multiline = this.config.multiline ?? false;
        this.hideValues = this.config.useSelectTags || null;
        this.displayValues = this.config.displayValues || null;
        this.blockChanges = this.config.blockChanges ?? false;

        this.placeholder = this.config.filterPlaceholder || 'Search or enter new value...';
    }

    getValue() {
        return [...this.items];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    setInputValue(values) {
        if (Array.isArray(values)) {
            let items = [];
            values.forEach(obj =>{
                items.push(typeof obj === 'object' ? new RecordItem(obj) : obj);
            });
            this.items = items;
        } else if (typeof values === 'string' && values.trim()) {
            try {
                const parsed = JSON.parse(values);
                this.items = Array.isArray(parsed) ? parsed : [values];
            } catch {
                this.items = values.split(',').map(item => item.trim()).filter(Boolean);
            }
        } else if (values && typeof values === 'object') {
            this.items = Object.values(values);
        } else {
            this.items = [];
        }

        if (this.unifiedInputEl) {
            this.unifiedInputEl.value = '';
            this.filterQuery = '';
        }

        this.renderLiveListItems();
    }

    createInputElement() {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'settings-card spaced-card-top';
        cardContainer.id = this.fieldId;
        cardContainer.role = 'widget';
        cardContainer.ariaDescription = 'This widget represents a JavaScript Array. You have the ability to filter, edit, add, reorder, and delete array items';

        if (this.showSearchAddRow) {
            const combinedControlRow = document.createElement('div');
            combinedControlRow.className = 'new-entry-row inline-form-row section-border-bottom array-control-row';

            const unifiedInputWrapper = this.createSearchWrapper(this.placeholder, 'array-main-input');
            this.unifiedInputEl = this.searchFieldEl;
            this.inputEl = this.unifiedInputEl;

            combinedControlRow.appendChild(unifiedInputWrapper);

            if (this.showAddButton) {
                const appendRowBtn = document.createElement('button');
                appendRowBtn.type = 'button';
                appendRowBtn.className = 'chrome-btn-secondary array-add-btn';
                appendRowBtn.innerHTML = '&#43;';
                appendRowBtn.title = 'Add row item';
                appendRowBtn.disabled = this.isEditingLocked;
                const addHandler = this.overrideAddBtnEvent
                    ? (e) => this.overrideAddBtnEvent(e)
                    : () => this.handleAppendRowItem();

                appendRowBtn.addEventListener('click', addHandler);
                combinedControlRow.appendChild(appendRowBtn);
                this.appendRowBtn = appendRowBtn;
            }

            cardContainer.appendChild(combinedControlRow);
        }

        const list = this.createListContainer('array-items-list');
        cardContainer.appendChild(list);

        this.renderLiveListItems();
        return cardContainer;
    }

    updateLockState() {
        super.updateLockState();
        if (this.appendRowBtn) this.appendRowBtn.disabled = this.isEditingLocked;
    }

    renderLiveListItems() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        this.items.forEach((valueString, index) => {
            if (!this.matchesFilter(valueString)) return;

            const li = this.createRowNodeElement(valueString, index);
            this.listEl.appendChild(li);
        });
    }

    createRowNodeElement(val, index) {
        const li = document.createElement('li');
        li.className = `settings-row draggable-array-row array-item-row ${this.isEditingLocked && !this.allowDrag ? 'is-locked' : ''}`;
        li.setAttribute('role', 'listitem');
        li.setAttribute('draggable', this.isEditingLocked && !this.allowDrag ? 'false' : 'true');
        li.dataset.index = index;

        const inputsBlock = document.createElement('div');
        inputsBlock.className = 'toolbar-actions-block array-row-inputs';

        const dragHandle = document.createElement('span');
        dragHandle.innerHTML = '&equiv;';
        dragHandle.className = 'array-row-drag-handle';
        inputsBlock.appendChild(dragHandle);

        const indexBadge = document.createElement('span');
        indexBadge.className = 'row-index settings-row-title';
        indexBadge.textContent = `${index + 1}`;
        inputsBlock.appendChild(indexBadge);

        inputsBlock.appendChild(this.createInput(val, index));

        if (this.config?.getItemType) {
            let itemType = this.config.getItemType(val);
            const badgeEl = document.createElement('span');
            badgeEl.className = `badge-type badge-${String(itemType).toLowerCase()}`;
            badgeEl.textContent = String(itemType).toUpperCase();
            inputsBlock.appendChild(badgeEl);
        }

        li.appendChild(inputsBlock);

        const isEdit = this.allowObjectEdit;
        const actionBtn = document.createElement('button');
        actionBtn.type = 'button';
        actionBtn.className = 'chrome-btn-secondary dialog-action-btn';
        actionBtn.textContent = isEdit ? 'Edit' : 'Delete';
        actionBtn.disabled = !isEdit && this.isEditingLocked;

        actionBtn.addEventListener('click', (e) => {
            if (isEdit) {
                e.preventDefault();
                e.stopPropagation();
                this.handleEditRowItem(index);
            } else if (!this.isEditingLocked) {
                this.handleDeleteRowItem(index);
            }
        });

        li.appendChild(actionBtn);

        if (!this.isEditingLocked) {
            this.bindDragDropRowLifecycleEvents(li);
        }
        return li;
    }

    createInput(val, index){
        let value;
        switch (true) {
            case !!this.displayValues:
                this.blockChanges = true;
                value = document.createElement('select');
                value.add(new Option(this.displayValues[val] ?? val, val));
                value.setAttribute('style',
                    '-webkit-appearance: none; ' +
                    '-moz-appearance: none; ' +
                    'appearance: none; ' +
                    'cursor: default; ' +
                    'user-select: text; ');
                break;

            default:
                value = document.createElement(!this.multiline?'input':'textarea');
                if (!this.multiline) value.type = 'text';
                value.value = typeof val !== 'object' ? val : Object.values(val).join(' | ');
                value.addEventListener('input', () => {
                    this.clearErrorMessage();
                    this.items[index] = value.value;
                    if (this.onInput) this.onInput(this.getValue(), this.fieldId);
                });
                break;
        }
        value.className = 'row-value form-input-field';
        value.disabled = this.isEditingLocked || this.blockChanges;
        return value;
    }

    bindDragDropRowLifecycleEvents(rowElement) {
        rowElement.addEventListener('dragstart', (e) => {
            this.draggedElementInstance = rowElement;
            rowElement.classList.add('is-dragging-row');
            e.dataTransfer.effectAllowed = 'move';
        });

        rowElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetRow = e.target.closest('.draggable-array-row');
            if (!targetRow || targetRow === this.draggedElementInstance) return;

            const bounding = targetRow.getBoundingClientRect();
            const offset = e.clientY - bounding.top;
            const isAfter = offset > bounding.height / 2;

            targetRow.classList.remove('drag-target-above', 'drag-target-below');
            if (isAfter) {
                targetRow.classList.add('drag-target-below');
            } else {
                targetRow.classList.add('drag-target-above');
            }
        });

        rowElement.addEventListener('dragleave', (e) => {
            const targetRow = e.target.closest('.draggable-array-row');
            if (targetRow) {
                targetRow.classList.remove('drag-target-above', 'drag-target-below');
            }
        });

        rowElement.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetRow = e.target.closest('.draggable-array-row');

            if (targetRow && targetRow !== this.draggedElementInstance) {
                const srcIndex = parseInt(this.draggedElementInstance.dataset.index, 10);
                const destIndex = parseInt(targetRow.dataset.index, 10);

                if (!isNaN(srcIndex) && !isNaN(destIndex)) {
                    const targetDataRecord = this.items.splice(srcIndex, 1)[0];
                    this.items.splice(destIndex, 0, targetDataRecord);
                    if (this.onInput) this.onInput(this.getValue(), this.fieldId);
                }
            }
            this.renderLiveListItems();
        });

        rowElement.addEventListener('dragend', () => {
            rowElement.classList.remove('is-dragging-row');
            if (this.listEl) {
                Array.from(this.listEl.children).forEach(li => {
                    li.classList.remove('drag-target-above', 'drag-target-below', 'is-dragging-row');
                });
            }
            this.draggedElementInstance = null;
        });
    }

    handleAppendRowItem() {
        if (!this.unifiedInputEl) return;
        const val = this.unifiedInputEl.value.trim();

        if (!val) {
            this.showErrorMessage(this.config.requiredMessage || "Please enter an item value before appending a row.");
            if (this.onInput) this.onInput(this.getValue(), this.fieldId);
            return;
        }

        this.clearErrorMessage();
        this.items.push(val);
        this.unifiedInputEl.value = '';
        this.filterQuery = "";

        this.renderLiveListItems();
        if (this.onInput) this.onInput(this.getValue(), this.fieldId);
    }

    handleEditRowItem(targetIndex) {
        if (typeof this.config.onEditItem === 'function') {
            this.config.onEditItem(targetIndex, this.items[targetIndex]);
        }
    }

    handleDeleteRowItem(targetIndex) {
        this.items.splice(targetIndex, 1);
        this.renderLiveListItems();
        this.checkRequiredValidation();
        if (this.onInput) this.onInput(this.getValue(), this.fieldId);
    }

    bindEvents() {
        if (!this.unifiedInputEl) return;

        this.unifiedInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.showAddButton !== false) {
                e.preventDefault();
                this.handleAppendRowItem();
            }
        });

        this.unifiedInputEl.addEventListener('blur', () => {
            this.checkRequiredValidation();
            if (this.onInput) this.onInput();
        });
    }
}
class RecordItem {
    constructor(data) {
        Object.assign(this, data);
    }

    toString() {
        return Object.values(this)
            .filter(val => typeof val === 'string')
            .join(' ');
    }
}

export default ArrayBuilder;