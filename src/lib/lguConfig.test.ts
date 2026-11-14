import { describe, it, expect } from 'vitest';

import { isPathEnabled, type LGUConfig } from './lguConfig';

const features: LGUConfig['features'] = {
  openLGU: false,
  transparency: true,
  tourism: false,
  statistics: true,
};

describe('isPathEnabled', () => {
  it('hides routes owned by a disabled feature', () => {
    expect(isPathEnabled('/openlgu', features)).toBe(false);
    expect(isPathEnabled('/openlgu/person/abc', features)).toBe(false);
    expect(isPathEnabled('/openlgu?type=ordinance', features)).toBe(false);
    expect(isPathEnabled('/tourism', features)).toBe(false);
  });

  it('keeps routes owned by an enabled feature', () => {
    expect(isPathEnabled('/transparency/financial', features)).toBe(true);
    expect(isPathEnabled('/statistics', features)).toBe(true);
    expect(
      isPathEnabled('/openlgu/person/abc', { ...features, openLGU: true })
    ).toBe(true);
  });

  it('keeps ungated, look-alike and external links', () => {
    expect(isPathEnabled('/government/elected-officials', features)).toBe(true);
    expect(isPathEnabled('/openlgu-archive', features)).toBe(true);
    expect(isPathEnabled('https://www.foi.gov.ph', features)).toBe(true);
  });
});
