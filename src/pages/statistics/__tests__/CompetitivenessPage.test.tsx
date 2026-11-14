import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, it, expect, vi } from 'vitest';

import type { CmciData } from '@/types/statisticsTypes';

import CompetitivenessPage from '../CompetitivenessPage';

// Mutable stand-in for cmci.json so each test can shape the data
const mockCmci = vi.hoisted(() => ({}) as CmciData);
vi.mock('@/data/statistics/cmci.json', () => ({ default: mockCmci }));

// Recharts needs a sized container; render children directly in happy-dom
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <CompetitivenessPage />
    </MemoryRouter>
  );

describe('CompetitivenessPage', () => {
  beforeEach(() => {
    Object.assign(mockCmci, {
      meta: { source: 'CMCI', years: [2022, 2023, 2024] },
      overall_score: [null, null, null],
      pillars: [],
    });
  });

  it('renders an empty state for placeholder data (null scores, no pillars)', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Competitiveness' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Competitiveness scores not yet available')
    ).toBeInTheDocument();
    expect(screen.queryByText('Overall Score')).not.toBeInTheDocument();
  });

  it('renders an empty state when the series has no years', () => {
    mockCmci.meta.years = [];
    mockCmci.overall_score = [];
    renderPage();

    expect(
      screen.getByText('Competitiveness scores not yet available')
    ).toBeInTheDocument();
  });

  it('uses the latest scored year and shows a pillar empty state when pillars are missing', () => {
    mockCmci.overall_score = [41.5, 43.25, null];
    renderPage();

    expect(screen.getByText('CMCI 2023')).toBeInTheDocument();
    expect(screen.getByText('43.25')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pillars/i }));
    expect(screen.getByText('No pillar breakdown yet')).toBeInTheDocument();
  });
});
