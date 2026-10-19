export class ConfigLoader {
    /**
     * Universal fetch utility to securely grab local asset JSON files
     */
    async _fetchJson(filename, dir = "json") {
        const response = await fetch(chrome.runtime.getURL(`${dir}/${filename}`));
        if (!response.ok) throw new Error(`Failed to load asset stream: ${filename}`);
        return response.json();
    }

    /**
     * Loads all configuration files from disk and prepares the dynamic fields database
     */
    async loadAll(integrateData = true) {
        let updatedTemplates = null;

        // Fetch baseline system control files first, including your newly updated settings
        const [ fields, tabs, settings, resources, templates, manifest ] = await Promise.all([
            this._fetchJson('fields.json'),
            this._fetchJson('tabs.json'),
            this._fetchJson('settings.json'),
            this._fetchJson('resources.json'),
            this._fetchJson('templates.json'),
            this._fetchJson('manifest.json','.')
        ]);

        const tabsRawConfig = structuredClone(tabs);

        // Transform tab submenu option strings into structured objects using templates data
        Object.values(tabs).forEach(tab => {
            if (tab?.submenu?.options && Array.isArray(tab.submenu.options)) {
                tab.submenu.options = tab.submenu.options.map(optVal => {
                    const templateNode = templates.data?.[optVal];
                    return {
                        label: templateNode?.templateName || optVal,
                        value: optVal,
                        fieldIds: templateNode?.fieldIds ?? []
                    };
                });
            }
        });

        // Generate concurrent asynchronous fetch operations dynamically on the fly
        const datasets = {}, datasetsDictionary = {};
        const registryFetchOperations = settings?.datasets.map(async (registryKey) => {
            const dirValue = "datasets";
            try {
                const fileContentArray = await this._fetchJson(`${registryKey}.json`, dirValue);
                datasets[registryKey] = fileContentArray.data;
                datasetsDictionary[registryKey] = fileContentArray.dictionary;
            } catch (err) {
                console.error(`Automated Loader Error: Failed to resolve custom dataset catalog "${dirValue}/${registryKey}.json":`, err);
                datasets[registryKey] = {}; // Graceful fallback to prevent application crashes
                datasetsDictionary[registryKey] = {};
            }
        });
        // Resolve all registry data file streams concurrently inside a single execution block
        await Promise.all(registryFetchOperations);

        /**
         * Applies default settings
         */
        const stringFallbacks = {};
        if(integrateData) {
            // Dynamically hook and bind ALL text-field input resource maps cleanly!
            for (const key in fields) {
                const field = fields[key];
                if (!field || !field.type) continue;

                // 1. Process linked defaults matrix rules
                settings?.linkedDefaults.forEach(rule => {
                    if (rule.fieldType && rule.fieldType === field.type) {
                        const targetProperty = rule.fieldProperty;
                        const sourceDefaultKey = rule.defaultsProperty;

                        // Apply the global fallback only if the field property isn't explicitly overridden
                        if (isUndefinedOrNull(field[targetProperty]) && !isUndefinedOrNull(settings?.defaults[sourceDefaultKey])) {

                            field[targetProperty] = settings?.defaults[sourceDefaultKey];
                        }
                    }
                });

                // 2. Process legacy option conversions
                if (typeof field.options === 'string') {
                    field.options = resources[field.options] || [];
                    if (field.options.length === 0) {
                        console.error('field: ', key, 'options: ', field.options, ' is not found.');
                    }
                }

                // 3. Process layout resource mappings
                if (field.resourceMap) {
                    const targetListName = field.resourceMap;
                    if (resources[targetListName]) {
                        field.staticOptions = resources[targetListName];
                    }
                }

                // 4. Gets stringFallbacks
                if (field.stringFallback) stringFallbacks[key] = field.stringFallback;

            }

            /**
             * Adds workstation to fields
             */
            // Natively recovers session workstation storage data cleanly inside the asset pipeline!
            if (fields.workstation) { // revisit
                const storageResult = await new Promise((resolve) => {
                    chrome.storage.local.get(['savedWorkstation'], (res) => resolve(res));
                });
                if (storageResult?.savedWorkstation) {
                    fields.workstation.default = storageResult.savedWorkstation;
                }
            }

            /**
             * Updates Templates
             */
            updatedTemplates = applyTemplateDefaults(
                templates.data,
                settings?.defaults
            );
        }


        return {
            fields: fields || [],
            tabs: tabs || {},
            tabsConfig: tabsRawConfig || {},
            resources: resources || {},
            templates: (integrateData ? updatedTemplates : templates.data) || {},
            //templatesDictionary: templates.dictionary || {},
            datasets: datasets || {},
            datasetsDictionary: datasetsDictionary || {},
            //manifest: manifest,
            settingsDatasets: settings?.datasets || [],
            settingsDefaults: settings?.defaults || {},
            settingsLinkedDefaults: settings?.linkedDefaults || [],
            stringFallbacks: stringFallbacks
        };
    }
}

function applyTemplateDefaults(templates, defaults) {
    if (!templates || !defaults) return templates;

    // Loop through every template key (e.g., "chip", "softDrop", "makeEmAll")
    Object.keys(templates).forEach(templateKey => {
        const template = templates[templateKey];

        if (Array.isArray(template.propertyValues)) {
            template.propertyValues = template.propertyValues.map((value , index) => {
                if (value?.value !== null) return value?.value;
                return defaults?.[value.default] ?? null;
            });
        }
    });

    return templates;
}

function isUndefinedOrNull(target){
    return target === undefined || target === null;
}