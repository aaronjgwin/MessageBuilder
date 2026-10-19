export class VisibilityManager {
    constructor(formMountPoint) {
        this.formMountPoint = formMountPoint;
    }

    applyFilters(activeTab, tabsConfig, currentValues) {
        const tabConfig = tabsConfig[activeTab];
        if (!tabConfig) return;

        const allInputGroups = this.formMountPoint.querySelectorAll('.input-group');
        allInputGroups.forEach(group => group.style.display = 'flex');

        if (tabConfig.submenu) {
            const selectorKey = tabConfig.submenu.id;
            let selectedOptionLabel = currentValues[selectorKey] || tabConfig.submenu.default;

            if (selectedOptionLabel === 'Scans' && currentValues.scanMain) {
                selectedOptionLabel = `Scans-${currentValues.scanMain}`;
            }

            let matchedOption = tabConfig.submenu.options.find(opt => opt.label === selectedOptionLabel);
            if (!matchedOption && selectedOptionLabel.includes('-')) {
                matchedOption = tabConfig.submenu.options.find(opt => opt.label === selectedOptionLabel.split('-')[0]);
            }

            if (matchedOption) {
                const protectedFields = [selectorKey, ...matchedOption.fieldIds].map(id => id.trim().toLowerCase());

                allInputGroups.forEach(group => {
                    // CRITICAL UPDATE: Extract identity cleanly from the data attribute map
                    const rawFieldId = group.getAttribute('data-base-id');
                    if (rawFieldId) {
                        const cleanFieldId = rawFieldId.trim().toLowerCase();
                        if (!protectedFields.includes(cleanFieldId)) {
                            group.style.display = 'none';
                        }
                    }
                });
            }
        }
    }
}
