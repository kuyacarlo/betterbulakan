import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

import MunicipalIncomePage from '../MunicipalIncomePage';

// ari.json is empty until verified BLGF figures are encoded
vi.mock('@/data/statistics/ari.json', () => ({ default: [] }));

describe('MunicipalIncomePage', () => {
  it('renders an empty state instead of crashing when ari.json is empty', () => {
    render(
      <MemoryRouter>
        <MunicipalIncomePage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Municipal Income' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Income data not yet available')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /View BLGF dataset/i })
    ).toHaveAttribute('href', expect.stringContaining('data.bettergov.ph'));
    expect(screen.queryByText('Total Income')).not.toBeInTheDocument();
  });
});
