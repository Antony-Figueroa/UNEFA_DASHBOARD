import * as React from 'react';
import { StoryContext, Addon_DecoratorFunction } from '@storybook/types';

declare const ServerComponentDecorator: (Story: React.FC, { parameters }: StoryContext) => React.ReactNode;
declare const decorators: Addon_DecoratorFunction<any>[];
declare const parameters: {
    react: {
        rsc: boolean;
    };
};

export { ServerComponentDecorator, decorators, parameters };
