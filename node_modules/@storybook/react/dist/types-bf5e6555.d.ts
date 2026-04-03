import { ComponentType } from 'react';
import { WebRenderer } from '@storybook/types';

interface ReactRenderer extends WebRenderer {
    component: ComponentType<this['T']>;
    storyResult: StoryFnReactReturnType;
}
type StoryFnReactReturnType = JSX.Element;

export { ReactRenderer as R };
