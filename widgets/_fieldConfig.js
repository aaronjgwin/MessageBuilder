// _fieldConfig.js
/*
const fieldConfigList = new Map([
    // BaseField
    ['label', {'type': 'String'}],
    ['type', {'type': 'String'}],
    ['required', {'type': 'Boolean'}],
    ['requiredMessage', {'type': 'String'}]
]);

export const widgetConfigs = {
/*
    // ArrayBuilder
    'array': new Map([
        ...fieldConfigList,
        ['jsonFileName', {'type': 'Array', 'source': 'datasets'}],
        ['showSearchAddRow', {'type': 'Boolean'}],
        ['isEditingLocked', {'type': 'Boolean'}],
        ['filterPlaceholder', {'type': 'String', 'placeholder': 'Example: Filter rows...'}],
        ['errorMessage', {'type': 'String'}]
    ]),

    // AutocompleteInput
    'autocomplete': new Map([
        ...fieldConfigList,
        ['jsonFileName', {'type': 'Array', 'source': 'datasets'}],
        ['displayFormat', {'type': 'String', 'placeholder': 'Example: {Name} ({ID})'}],
        ['placeholderSelect', {'type': 'String', 'placeholder': 'Example: Search name...'}],
        ['placeholderInput', {'type': 'String', 'placeholder': 'Example: ID or DOB'}],
        ['toStringFormat', {'type': 'String', 'placeholder': 'Example: {select} ({text})'}]
    ]),

    // CheckboxGroupField
    'checkboxGroup': new Map([
        ...fieldConfigList,
        ['jsonFileName', {'type': 'Array', 'source': 'datasets'}],
        ['options', {'type': 'Array', 'source': 'resources-arrays'}],
        ['resourceMap', {'type': 'Array', 'source': 'resources-maps'}],
        ['displayFormat', {'type': 'String', 'placeholder': 'Example: {Name} ({ID})'}],
        ['toStringFormat', {'type': 'String', 'placeholder': 'Example: {select} - {text}'}],
        ['prefix', {'type': 'String', 'placeholder': 'Example: # or Floor-'}],
        ['includePrefixInString', {'type': 'Boolean'}],
        ['default', {'type': 'String', 'placeholder': 'Example: "4", "6", "10"'}],
        //['value', {'type': 'Array'}],
        ['groupBy', {'type': 'String', 'placeholder': 'Example: {Shift}'}],
        ['sortOrder', {'type': 'String', 'placeholder': 'Example: Graves, Swings, Days'}],
        ['errorMessage', {'type': 'String'}]
    ]),

    // Combobox
    'combobox': new Map([
        ...fieldConfigList,
        ['jsonFileName', {'type': 'Array', 'source': 'datasets'}],
        ['displayFormat', {'type': 'String', 'placeholder': 'Example: {Name} ({ID})'}],
        ['placeholderSelect', {'type': 'String', 'placeholder': 'Example: Search option...'}],
        ['placeholderInput', {'type': 'String', 'placeholder': 'Example: Enter value...'}],
        ['toStringFormat', {'type': 'String', 'placeholder': 'Example: {select} - {text}'}]
    ]),

    // CurrencyField
    'currency': new Map([
        ...fieldConfigList,
        ['separator', {'type': 'Array', 'options': ['comma', 'none']}],
        ['centsRequired', {'type': 'Boolean'}],
        ['toStringSymbol', {'type': 'String', 'placeholder': 'Example: $'}],
        ['alignRight', {'type': 'Boolean'}],
        ['placeholder', {'type': 'String', 'placeholder': 'Example: $0.00'}],
        ['default', {'type': 'Currency', 'placeholder': 'Example: 0.00'}],
        //['value', {'type': 'Currency'}],
        ['min', {'type': 'Integer'}],
        ['max', {'type': 'Integer'}],
        ['errorMessage', {'type': 'String'}],
        ['invalidMessage', {'type': 'String'}]
    ]),

    // IntegerField
    'integer': new Map([
        ...fieldConfigList,
        ['min', {'type': 'Integer'}],
        ['max', {'type': 'Integer'}],
        ['default', {'type': 'Integer', 'placeholder': 'Example: 0'}],
        //['value', {'type': 'Integer'}],
        ['placeholder', {'type': 'String', 'placeholder': 'Example: Enter integer...'}],
        ['errorMessage', {'type': 'String'}],
        ['invalidMessage', {'type': 'String'}]
    ]),

    // MapBuilder
    'map': new Map([
        ...fieldConfigList,
        ['jsonFileName', {'type': 'Array', 'source': 'datasets'}],
        ['keyField', {'type': 'String', 'placeholder': 'Example: id'}],
        ['valueField', {'type': 'String', 'placeholder': 'Example: label'}],
        ['placeholder', {'type': 'String', 'placeholder': 'Example: Search entries...'}]
    ]),

    // objectSelect
    'objectSelect': new Map([
        ...fieldConfigList,
        ['labelKey', {'type': 'String', 'placeholder': 'Example: name'}],
        ['valueKey', {'type': 'String', 'placeholder': 'Example: id'}],
        ['placeholder', {'type': 'String', 'placeholder': 'Example: -- Select Option --'}],
        ['default', {'type': 'String'}]
        //['value', {'type': 'String'}]
    ]),

    // SelectField
    'select': new Map([
        ...fieldConfigList,
        ['name', {'type': 'String'}],
        ['placeholder', {'type': 'String', 'placeholder': 'Example: -- Select Option --'}],
        ['default', {'type': 'String'}],
        //['value', {'type': 'String'}],
        ['options', {'type': 'Array', 'source': 'resources-arrays'}]
    ]),

    // TextField
    'text': new Map([
        ...fieldConfigList,
        ['jsonFileName', {'type': 'Array', 'source': 'datasets'}],
        ['placeholder', {'type': 'String', 'placeholder': 'Example: Sample text'}],
        ['default', {'type': 'String'}],
        //['value', {'type': 'String'}],
        ['minLength', {'type': 'Integer'}],
        ['maxLength', {'type': 'Integer'}],
        //['list', {'type': 'String'}],
        //['regExPattern', {'type': 'String'}],
        // ['regExFlags', {'type': 'String'}],
        //['liveCharacterMask', {'type': 'String'}],
        ['resourceMap', {'type': 'Array', 'source': 'resources-maps'}],
        ['forceUpperCase', {'type': 'Boolean'}],
        ['errorMessage', {'type': 'String'}]
    ]),

    // TimeField
    'time': new Map([
        ...fieldConfigList,
        ['use24Hour', {'type': 'Boolean'}],
        ['secondsRequired', {'type': 'Boolean'}],
        ['separator', {'type': 'Array', 'options': ['colon', 'dot', 'none', 'none/colon']}],
        ['default', {'type': 'String', 'placeholder': 'Example: 12:00 PM'}],
        //['value', {'type': 'String'}],
        ['errorMessage', {'type': 'String'}]
    ])

};*/

export const widgetList = [
    //'array',
    'autocomplete',
    'checkboxGroup',
    'combobox',
    'currency',
    'integer',
    //'map',
    'objectSelect',
    'select',
    'text',
    'time'
];

const fieldConfigList = [
    // BaseField
    'label', 'type', 'required', 'requiredMessage', 'isEditingLocked'
];

export const widgetConfigs = {

    // ArrayBuilder
    'array': [
        ...fieldConfigList,
        'jsonFileName', 'showSearchAddRow', 'showAddButton', 'filterPlaceholder', 'errorMessage', 'showEditToggle'
    ],

    // AutocompleteInput
    'autocomplete': [
        ...fieldConfigList,
        'jsonFileName', 'displayFormat', 'placeholderSelect', 'placeholderInput', 'toStringFormat'
    ],

    // CheckboxGroupField
    'checkboxGroup': [
        ...fieldConfigList,
        'jsonFileName', 'options', 'resourceMap', 'displayFormat', 'toStringFormat', 'prefix', 'includePrefixInString', 'default', 'groupBy', 'sortOrder', 'errorMessage'
    ],

    // Combobox
    'combobox': [
        ...fieldConfigList,
        'jsonFileName', 'displayFormat', 'placeholderSelect', 'placeholderInput', 'toStringFormat'
    ],

    // CurrencyField
    'currency': [
        ...fieldConfigList,
        'separator', 'centsRequired', 'toStringSymbol', 'alignRight', 'placeholder', 'default', 'min', 'max', 'errorMessage', 'invalidMessage'
    ],

    // IntegerField
    'integer': [
        ...fieldConfigList,
        'min', 'max', 'default', 'placeholder', 'errorMessage', 'invalidMessage'
    ],

    // MapBuilder
    'map': [
        ...fieldConfigList,
        'jsonFileName', 'keyField', 'valueField', 'placeholder', 'showEditToggle'
    ],

    // ObjectSelect
    'objectSelect': [
        ...fieldConfigList,
        'labelKey', 'valueKey', 'placeholder', 'default', 'displayFormat'
    ],

    // SelectField
    'select': [
        ...fieldConfigList,
        'name', 'placeholder', 'default', 'options'
    ],

    // 'TextField'
    'text': [
        ...fieldConfigList,
        'jsonFileName', 'placeholder', 'default', 'minLength', 'maxLength', 'resourceMap', 'forceUpperCase', 'errorMessage', 'regExPattern'
    ],

    // TimeField
    'time': [
        ...fieldConfigList,
        'use24Hour', 'secondsRequired', 'separator', 'default', 'errorMessage'
    ]

};

export const masterFieldConfigList = new Map([
    // Base Fields
    ['label', { type: 'text' }],
    ['type', { type: 'select', context: 'widgetList' }],
    ['required', { type: 'toggle' }],
    ['requiredMessage', { type: 'text' }],

    // General Form Controls
    ['default', { type: 'text', placeholder: 'Example: Default value...' }],
    ['placeholder', { type: 'text', placeholder: 'Example: Enter value...' }],
    ['errorMessage', { type: 'text' }],
    ['invalidMessage', { type: 'text' }],
    ['name', { type: 'text' }],

    // Data Sources & References
    ['jsonFileName', { type: 'select', context: 'activeDatasets' }],
    ['resourceArray', { type: 'select', context: 'resourcesArrayKeys' }],
    ['resourceMap', { type: 'select', context: 'resourcesMapKeys' }],
    ['options', { type: 'text', placeholder: 'Example: Red, Green, Blue' }],

    // Formatting & Layout
    ['displayFormat', { type: 'text', placeholder: 'Example: {Name} ({ID})' }],
    ['toStringFormat', { type: 'text', placeholder: 'Example: {select} ({text})' }],
    ['placeholderSelect', { type: 'text', placeholder: 'Example: Search option...' }],
    ['placeholderInput', { type: 'text', placeholder: 'Example: Enter value...' }],
    ['prefix', { type: 'text', placeholder: 'Example: # or Floor-' }],
    ['includePrefixInString', { type: 'toggle' }],
    ['groupBy', { type: 'text', placeholder: 'Example: {Shift}' }],
    ['sortOrder', { type: 'text', placeholder: 'Example: Graves, Swings, Days' }],

    // Array / UI Flags
    ['showSearchAddRow', { type: 'toggle' }],
    ['showAddButton', { type: 'toggle' }],
    ['showEditToggle', { type: 'toggle' }],
    ['isEditingLocked', { type: 'toggle' }],
    ['filterPlaceholder', { type: 'text', placeholder: 'Example: Filter rows...' }],

    // Numbers & Currency
    ['min', { type: 'integer' }],
    ['max', { type: 'integer' }],
    ['separator', { type: 'select', options: ['comma', 'dot', 'colon', 'none', 'none/colon'] }],
    ['centsRequired', { type: 'toggle' }],
    ['toStringSymbol', { type: 'text', placeholder: 'Example: $' }],
    ['alignRight', { type: 'toggle' }],

    // Text & String Rules
    ['minLength', { type: 'integer' }],
    ['maxLength', { type: 'integer' }],
    ['forceUpperCase', { type: 'toggle' }],
    ['regExPattern', {'type': 'String'}],

    // Object / Map Selectors
    ['keyField', { type: 'text', placeholder: 'Example: id' }],
    ['valueField', { type: 'text', placeholder: 'Example: label' }],
    ['labelKey', { type: 'text', placeholder: 'Example: name' }],
    ['valueKey', { type: 'text', placeholder: 'Example: id' }],

    // Time Fields
    ['use24Hour', { type: 'toggle' }],
    ['secondsRequired', { type: 'toggle' }]
]);

/* MISSING
| Property | Typical Control Type | Example Value(s) |
| --- | --- | --- |
| `excludedTables` | `select` / `text` | `["rouletteTables", "crapsTables"]` |
| `groupBy` | `text` | `"{Shift}"` |
| `includePrefixInString` | `toggle` | `true` |
| `leadingZeros` | `select` / `text` | `["Officer"]` |
| `lengths` | `text` / `object` | `{"Officer": 4, "default": 3}` |
| `matchedType` | `text` / `select` | `"properties"` |
| `partialMatchedFormat` | `text` | `"{Title} {FirstName} {LastName}"` |
| `placeholderInput` | `text` | `"ID or DOB"` |
| `placeholderSelect` | `text` | `"Type to search name..."` |
| `propertyFilter` | `text` / `object` | `{"key": "Department", "value": ["Table Games", "Casino Operation"]}` |
| `searchFields` | `select` / `text` | `["FirstName", "LastName", "Title", "Department"]` |
| `sortOrder` | `text` | `"Graves, Swings, Days"` |
 */