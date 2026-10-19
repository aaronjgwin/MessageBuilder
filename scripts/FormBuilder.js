import { TextField } from '../widgets/TextField.js';
import { SelectField } from '../widgets/SelectField.js';
import { CurrencyField } from '../widgets/CurrencyField.js';
import { IntegerField } from '../widgets/IntegerField.js';
import { TimeField } from '../widgets/TimeField.js';
import { CheckboxGroupField } from '../widgets/CheckboxGroupField.js'; // Backed by named export matching your disk
import { Combobox } from '../widgets/Combobox.js';
import { ObjectSelectField } from '../widgets/ObjectSelectField.js';
import { AutocompleteInput } from '../widgets/AutocompleteInput.js';
import { ArrayBuilder } from '../widgets/ArrayBuilder.js';
import { MapBuilder } from '../widgets/MapBuilder.js';
import { ToggleField } from "../widgets/ToggleField.js";

const WIDGET_MAP = {
    "text": TextField,
    "select": SelectField,
    "currency": CurrencyField,
    "integer": IntegerField,
    "time": TimeField,
    "checkboxGroup": CheckboxGroupField,
    "combobox": Combobox,
    "objectSelect": ObjectSelectField,
    "autocomplete": AutocompleteInput,
    "array": ArrayBuilder,
    "map": MapBuilder,
    "toggle": ToggleField
};

export class FormBuilder {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.activeWidgets = {};
    }

    /**
     * Orchestrates the rendering pipeline, mapping JSON parameters to specific widget classes dynamically
     */
    render(tabData, masterFields, dataContext = {}) {
        this.container.innerHTML = '';
        this.activeWidgets = {}; // Reset tracking memory on layout shift
        if (!tabData) return;

        const h2 = document.createElement('h2');
        h2.textContent = tabData.header;
        this.container.appendChild(h2);

        const sub = tabData.submenu;
        if (sub && !tabData.submenuConfig) {
            tabData.submenuConfig = {
                label: sub.label || '',
                type: 'select',
                name: 'submenu',
                options: sub.options.map(opt => ({
                    label: opt.label,
                    value: opt.value
                })),
                default: sub.default,
                id: sub.id
            };
        }

        tabData.fieldIds.forEach(fieldId => {
            const isSubmenuSelector = (sub && fieldId === sub.id);

            const field = isSubmenuSelector ? tabData.submenuConfig : masterFields[fieldId];
            if (!field) return;

            const WidgetClass = WIDGET_MAP[field.type];
            if (!WidgetClass) {
                console.error(`Unmapped field type configuration asset entry: "${field.type}" for layout node: "${fieldId}"`);
                return;
            }

            // PERSISTENT DATA INTERCEPTION BRIDGE PASS:
            // Write the dynamically fetched array directly onto the canonical master config object
            if (field.jsonFileName) {
                const targetFileName = field.jsonFileName;
                field.staticOptions = dataContext.datasets?.[targetFileName] || [];
            }

            let widgetInstance;

            if (field.type === 'objectSelect') {
                const recordsPayload = field.staticOptions || [];

                if (!field.placeholder && dataContext.settingsDefaults?.objectSelectPlaceholder) {
                    field.placeholder = dataContext.settingsDefaults.objectSelectPlaceholder;
                }

                const widgetEnvContext = {
                    records: recordsPayload,
                    defaultsMap: dataContext.settingsDefaults,
                    currentValues: dataContext.currentValues
                };

                widgetInstance = new ObjectSelectField(fieldId, field, dataContext.onInput, widgetEnvContext);
            } else if (field.type === 'text') {
                const textEnvContext = {
                    staticTables: dataContext.staticTables,
                    currentValues: dataContext.currentValues
                };
                widgetInstance = new TextField(fieldId, field, dataContext.onInput, textEnvContext);
            } else {
                widgetInstance = new WidgetClass(fieldId, field, dataContext.onInput, dataContext);
            }

            if (widgetInstance) {
                const mountedGroupNode = widgetInstance.render();
                mountedGroupNode.setAttribute('data-base-id', fieldId);
                this.container.appendChild(mountedGroupNode);
                this.activeWidgets[fieldId] = widgetInstance;
            }
        });
    }

    /**
     * Extracts values out of forms safely without leaking background arrays
     */
    getValues() {
        const values = {};
        for (const key in this.activeWidgets) {
            if (!Object.hasOwn(this.activeWidgets, key)) continue;
            const widget = this.activeWidgets[key];
            if (!widget) continue;

            const widgetVal = widget.getValue();
            if (widgetVal && typeof widgetVal === 'object' && !Array.isArray(widgetVal)) {
                Object.assign(values, widgetVal);
            }
            values[key] = widgetVal;

            if(typeof widget.getMapValue === 'function'){
                values[key+'Map'] = widget.getMapValue();
            }
        }
        values.workstation = this.getWorkstationValue();
        values.submenu = this.getSubmenuValue();
        return values;
    }

    /**
     * Extracts text footprints out of fields natively to optimize string substitution loops
     */
    getStringValues() {
        const stringValues = {};
        for (const key in this.activeWidgets) {
            if (!Object.hasOwn(this.activeWidgets, key)) continue;
            const widget = this.activeWidgets[key];
            if (!widget) continue;

            if (typeof widget.toString === 'function' && widget.toString !== Object.prototype.toString) {
                stringValues[key] = widget.toString();
            } else {
                const raw = widget.getValue();
                if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
                    stringValues[key] = raw.text || raw.id || raw.label || '';
                } else {
                    stringValues[key] = String(raw ?? '');
                }
            }
            if(typeof widget.toMapString === 'function'){
                stringValues[key+'Map'] = widget.toMapString();
            }
        }
        stringValues.workstation = this.getWorkstationValue();
        stringValues.submenu = this.getSubmenuValue();
        return stringValues;
    }

    getWorkstationValue(){
       return document.getElementById('workstation')?.value.trim();
    }
    getSubmenuValue() {
        return document.querySelector('[name="submenu"]')?.value.trim() ?? '';
    }

}
