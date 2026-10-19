export class InteractionCoordinator {
    constructor(uiNodes, managers) {
        this.nodes = uiNodes;
        this.managers = managers;
    }

    wireEvents(triggerUpdateCallback, triggerRenderCallback) {
        if (this.nodes.navLeftBtn && this.nodes.tabContainer) {
            this.nodes.navLeftBtn.addEventListener('click', () => {
                this.nodes.tabContainer.scrollBy({ left: -100, behavior: 'smooth' });
            });
        }

        if (this.nodes.navRightBtn && this.nodes.tabContainer) {
            this.nodes.navRightBtn.addEventListener('click', () => {
                this.nodes.tabContainer.scrollBy({ left: 100, behavior: 'smooth' });
            });
        }

        if (this.nodes.copyBtn && this.nodes.statementOutput) {
            this.nodes.copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(this.nodes.statementOutput.textContent).then(() => {
                    const originalText = this.nodes.copyBtn.textContent;
                    this.nodes.copyBtn.textContent = '✔️ Copied!';
                    this.nodes.copyBtn.classList.add('copied');
                    setTimeout(() => {
                        this.nodes.copyBtn.textContent = originalText;
                        this.nodes.copyBtn.classList.remove('copied');
                    }, 2000);
                });
            });
        }

        if (this.nodes.formMountPoint) {
            const handleEvent = (e) => {
                // CRITICAL UPDATE: Find parent block and extract pristine attribute identity
                const parentGroup = e.target.closest('.input-group');
                const cleanFieldId = parentGroup ? parentGroup.getAttribute('data-base-id') : '';

                const tabConfig = this.managers.tabs[this.managers.tabManager.activeTab];

                if (cleanFieldId === tabConfig?.submenu?.id || cleanFieldId === 'hasId') {
                    triggerRenderCallback();
                } else {
                    if (e.type === 'change') {
                        this.managers.visibility.applyFilters(
                            this.managers.tabManager.activeTab,
                            this.managers.tabs,
                            this.managers.builder.getValues()
                        );
                    }
                    triggerUpdateCallback();
                }
            };

            this.nodes.formMountPoint.addEventListener('input', handleEvent);
            this.nodes.formMountPoint.addEventListener('change', handleEvent);
        }
    }
}
