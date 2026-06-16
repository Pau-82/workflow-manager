import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../src/components/ui/button';

describe('Button', () => {
  it('renders its label', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy();
  });

  it('is disabled while loading', () => {
    render(<Button loading>Guardar</Button>);
    expect(screen.getByRole('button').hasAttribute('disabled')).toBe(true);
  });
});
