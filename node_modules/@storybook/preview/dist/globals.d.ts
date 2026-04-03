declare const globalsNameReferenceMap: {
    readonly '@storybook/global': "__STORYBOOK_MODULE_GLOBAL__";
    readonly '@storybook/channels': "__STORYBOOK_MODULE_CHANNELS__";
    readonly '@storybook/client-logger': "__STORYBOOK_MODULE_CLIENT_LOGGER__";
    readonly '@storybook/core-events': "__STORYBOOK_MODULE_CORE_EVENTS__";
    readonly '@storybook/core-events/preview-errors': "__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__";
    readonly '@storybook/preview-api': "__STORYBOOK_MODULE_PREVIEW_API__";
    readonly '@storybook/types': "__STORYBOOK_MODULE_TYPES__";
};
declare const globalPackages: ("@storybook/global" | "@storybook/channels" | "@storybook/client-logger" | "@storybook/core-events" | "@storybook/core-events/preview-errors" | "@storybook/preview-api" | "@storybook/types")[];

export { globalPackages, globalsNameReferenceMap };
