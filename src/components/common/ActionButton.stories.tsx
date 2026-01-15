import type { Meta, StoryObj } from '@storybook/react';
import { ActionButton } from './ActionButton';
import { ThreeDotsIcon, EditIcon, TrashIcon, RefreshIcon } from '../../icons/actions';

const meta: Meta<typeof ActionButton> = {
  title: 'Common/ActionButton',
  component: ActionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'danger', 'success', 'warning', 'info'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ActionButton>;

export const Primary: Story = {
  args: {
    icon: <ThreeDotsIcon />,
    tooltip: 'Acciones',
    variant: 'primary',
  },
};

export const Edit: Story = {
  args: {
    icon: <EditIcon />,
    tooltip: 'Editar',
    variant: 'primary',
  },
};

export const Danger: Story = {
  args: {
    icon: <TrashIcon />,
    tooltip: 'Eliminar',
    variant: 'danger',
  },
};

export const Success: Story = {
  args: {
    icon: <RefreshIcon />,
    tooltip: 'Restaurar',
    variant: 'success',
  },
};

export const Disabled: Story = {
  args: {
    icon: <ThreeDotsIcon />,
    tooltip: 'No disponible',
    disabled: true,
  },
};
