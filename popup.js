import { FormBuilder } from './scripts/FormBuilder.js';
import { TabManager } from './scripts/TabManager.js';
import { VisibilityManager } from './scripts/VisibilityManager.js';
import { ConfigLoader } from './scripts/ConfigLoader.js';
import { InteractionCoordinator } from './scripts/InteractionCoordinator.js';
import { synopsisBuilder } from './scripts/TextFormatter.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. ANCHOR CORE FIXED CONTROLLER VIEW NODES
    const uiNodes = {
        tabContainer: document.getElementById('tabContainer'),
        statementOutput: document.getElementById('statementOutput'),
        copyBtn: document.getElementById('copyBtn'),
        navLeftBtn: document.getElementById('navLeftBtn'),
        navRightBtn: document.getElementById('navRightBtn'),
        formMountPoint: document.getElementById('formMountPoint'),
        settingsBtn: document.getElementById('toolbarSettingsBtn')
    };

    let config = {};

    // 2. INSTANTIATE LOGIC SUB-MANAGERS PIPELINE
    const visibility = new VisibilityManager(uiNodes.formMountPoint);
    const configLoader = new ConfigLoader();
    const tabManager = new TabManager(uiNodes.tabContainer, () => {
        renderSubmenuFieldsOnly();
    });
    const builder = new FormBuilder('formMountPoint');
    const activeManagers = { tabManager, visibility, builder };
    const coordinator = new InteractionCoordinator(uiNodes, activeManagers);

    if (uiNodes.navLeftBtn && uiNodes.tabContainer) {
        uiNodes.navLeftBtn.addEventListener('click', () => uiNodes.tabContainer.scrollBy({ left: -100, behavior: 'smooth' }));
    }

    if (uiNodes.navRightBtn && uiNodes.tabContainer) {
        uiNodes.navRightBtn.addEventListener('click', () => uiNodes.tabContainer.scrollBy({ left: 100, behavior: 'smooth' }));
    }
    // Direct standalone full-page tab action hook for the new toolbar button
    if (uiNodes.settingsBtn) {
        uiNodes.settingsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('settings/settings.html') });
        });
    }
    /**
     * Directs the rendering payload pipeline down into your FormBuilder factory engine
     */
    function renderSubmenuFieldsOnly() {
        const tabConfig = config.tabs ? config.tabs[tabManager.activeTab] : null;
        if (!tabConfig) return;

        let operationalFieldIds = tabConfig.fieldIds || [];

        const currentValues = builder.getValues();

        if (tabConfig.submenu) {
            const selectorKey = tabConfig.submenu.id;
            const hasActiveWidgetOnScreen = !!builder.activeWidgets[selectorKey];
            const fallbackValue = tabConfig.submenu.default || '';

            let selectedOptionValue = hasActiveWidgetOnScreen ? (currentValues[selectorKey] || fallbackValue) : fallbackValue;
            let activeOption = tabConfig.submenu.options.find(opt => opt.value === selectedOptionValue);
            operationalFieldIds = [selectorKey, ...(activeOption ? activeOption.fieldIds : [])];
        }

        const syntabData = {
            label: tabConfig.label,
            submenu: tabConfig.submenu,
            header: tabConfig.header,
            fieldIds: operationalFieldIds
        };

        const onInputCallback = () => {
            visibility.applyFilters(tabManager.activeTab, config.tabs, builder.getValues());
            updateStatement();
        };

        const contextEnvelope = {
            onInput: onInputCallback,
            currentValues: currentValues,
            staticTables: config.resources,
            defaultsMap: config.settingsDefaults,
            resources: config.resources,
            datasets: config.datasets // Supplies the parsed rosters
        };

        // FIXED PASS: Trigger rendering EXACTLY ONCE outside of any loops!
        builder.render(syntabData, config.fields, contextEnvelope);

        queueMicrotask(() => {
            visibility.applyFilters(tabManager.activeTab, config.tabs, builder.getValues());
            updateStatement();
        });
    }

    /**
     * Generates tab navigation items dynamically entirely out of the config map structure
     * Patched to intercept and deploy developer configurations into a clean external web tab page.
     */
    function renderTabs() {
        if (!config.tabs || Object.keys(config.tabs).length === 0) return;
        uiNodes.tabContainer.innerHTML = '';

        for (const key in config.tabs) {
            if (!Object.hasOwn(config.tabs, key)) continue;

            const tab = document.createElement('div');
            tab.className = `tab-item ${key === tabManager.activeTab ? 'active' : ''}`;
            tab.textContent = config.tabs[key].name;

            tab.addEventListener('click', () => {
                // INTERCEPT PASSTHROUGH: Open settings as a beautiful dedicated standalone tab page!
                if (key === 'developerSettings') {
                    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
                    return;
                }

                tabManager.activeTab = key;
                renderTabs();
                renderSubmenuFieldsOnly();
            });
            uiNodes.tabContainer.appendChild(tab);
        }
    }


    /**
     * Compiles your form metrics and outputs the summary synopsis block text live
     */
    function updateStatement() {
        const stringValues = builder.getStringValues();
        uiNodes.statementOutput.textContent = synopsisBuilder(
            config?.templates?.[stringValues?.['submenu']]?.propertyValues || [],
            stringValues,
            config?.settingsDefaults["stringFallback"]||'___',
            config.stringFallbacks
        ).join('\n');
    }

    /**
     * System initializer routine
     */
    async function initializeApp() {
        try {
            config = await configLoader.loadAll();
            activeManagers.tabs = config.tabs;

            if (config.tabs && Object.keys(config.tabs).length > 0) {
                tabManager.activeTab = Object.keys(config.tabs)[0]; // Extract the first layout string coordinate index [0]
            }

        } catch (err) {
            console.error('Failed to initialize dynamic extension engine dashboards:', err);
            return;
        }
        const headerWorkstationBox = document.getElementById('workstation');
        if (headerWorkstationBox) {
            await new Promise((resolve) => {
                chrome.storage.local.get(['workstation'], (result) => {
                    if (result.workstation) {
                        headerWorkstationBox.value = result.workstation;
                    }
                    resolve();
                });
            });

            headerWorkstationBox.addEventListener('input', () => {
                const sanitizedWorkstation = headerWorkstationBox.value.replace(/[^0-9]/g, '');
                headerWorkstationBox.value = sanitizedWorkstation;
                chrome.storage.local.set({ 'workstation': sanitizedWorkstation });
                updateStatement();
            });
        }

        coordinator.wireEvents(updateStatement, renderSubmenuFieldsOnly);
        renderTabs();
        renderSubmenuFieldsOnly();
    }

    await initializeApp();
});
