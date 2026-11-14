import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import FinancialPage from '../index';

// sre.json is empty until SRE reports are encoded, so budgetData is []
vi.mock('@/data/transparency/budgetData', () => ({ default: [] }));

describe('FinancialPage', () => {
  it('renders an empty state instead of crashing when there is no budget data', () => {
    render(
      <MemoryRouter>
        <FinancialPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /Financial Performance/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Financial reports not yet available')
    ).toBeInTheDocument();
    expect(screen.getByText('Financial Report')).toBeInTheDocument();
    expect(screen.queryByText('Income Composition')).not.toBeInTheDocument();
  });
});
