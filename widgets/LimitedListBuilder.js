import ArrayBuilder from "./ArrayBuilder.js";

export class LimitedListBuilder extends ArrayBuilder {
    constructor(fieldId, fieldConfig, onInputCallback, dataContext = {}) {
        super(fieldId, fieldConfig, onInputCallback, dataContext);
        this.options = Array.isArray(this.config.options) ? this.config.options : [];
        this.blockChanges = true;
    }

    createSearchWrapper(placeholder, customInputClass = '') {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'unified-input-wrapper';

        const addIcon = document.createElement('span');
        addIcon.innerHTML = '➕';
        addIcon.className = 'search-icon-indicator';

        this.searchFieldEl = document.createElement('select');
        this.searchFieldEl.className = `form-input-field ${customInputClass}`.trim();
        //this.searchFieldEl.addEventListener('change', () => {});
        this.populateOptionsSelect();

        searchWrapper.appendChild(addIcon);
        searchWrapper.appendChild(this.searchFieldEl);

        return searchWrapper;
    }

    render() {
        super.render();
        this.group.classList.add(`${super.constructor.name.toLowerCase()}-widget`);
        return this.group;
    }

    populateOptionsSelect() {
        this.searchFieldEl.innerHTML = '';

        const optionsList = (this.options || []).filter(field => !(this.items || []).includes(field));

        const sortedOptions = [...optionsList].sort((a, b) => {
            const textA = this.displayValues?.[a] ?? a;
            const textB = this.displayValues?.[b] ?? b;
            return textA.localeCompare(textB);
        });

        this.searchFieldEl.add(new Option('-- Select --', ''));

        sortedOptions.forEach(optionKey => {
            this.searchFieldEl.add(new Option(this.displayValues?.[optionKey] ?? optionKey, optionKey));
        });
    }

    handleAppendRowItem(){
        super.handleAppendRowItem();
        this.populateOptionsSelect();
    }

    handleDeleteRowItem(targetIndex) {
        super.handleDeleteRowItem(targetIndex);
        this.populateOptionsSelect();
    }

}