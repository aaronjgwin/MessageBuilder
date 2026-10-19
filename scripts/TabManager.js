export class TabManager {
    /**
     * @param {HTMLElement} container - The #tabContainer node from popup.html
     * @param {Function} onTabChangeCallback - Event listener firing when a user swaps tabs
     */
    constructor(container, onTabChangeCallback) {
        this.container = container;
        this.onTabChange = onTabChangeCallback;
        // The default initial activeTab state is deliberately left blank.
        // This is hydrated dynamically from tabs.json during the app's boot lifecycle.
        this.activeTab = '';
    }

    /**
     * Renders the tab buttons dynamically entirely from your config file data layers
     * @param {Object} tabsConfig - The layout definitions tree loaded out of tabs.json
     */
    render(tabsConfig) {
        if (!tabsConfig) return;
        this.container.innerHTML = '';

        for (const key in tabsConfig) {
            if (!Object.hasOwn(tabsConfig, key)) continue;

            const tab = document.createElement('div');
            tab.className = `tab-item ${key === this.activeTab ? 'active' : ''}`;
            tab.textContent = tabsConfig[key].name;


            // Direct data attribute linking to simplify external selector inspections
            tab.setAttribute('data-tab-key', key);

            tab.addEventListener('click', () => {
                this.activeTab = key;
                this.render(tabsConfig); // Re-render local states to toggle the active CSS flag
                this.onTabChange(key);   // Notify parent orchestrator live
            });
            this.container.appendChild(tab);
        }
    }
}
