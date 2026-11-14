import { readFileSync } from 'node:fs';

// Reads a JSON file under src/data so specs can branch on whether real data has been published yet
export function readDataJson<T>(relativePath: string): T {
  const url = new URL(`../../src/data/${relativePath}`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf8')) as T;
}

/** True once ari.json has at least one BLGF income record. */
export const hasIncomeData =
  readDataJson<unknown[]>('statistics/ari.json').length > 0;

/** True once cmci.json has at least one published overall score. */
export const hasCmciData = readDataJson<{
  overall_score: (number | null)[];
}>('statistics/cmci.json').overall_score.some(s => typeof s === 'number');

/** Mirrors config/lgu.config.json features.openLGU. */
export const openLGUEnabled = (
  JSON.parse(
    readFileSync(
      new URL('../../config/lgu.config.json', import.meta.url),
      'utf8'
    )
  ) as { features: { openLGU: boolean } }
).features.openLGU;

/** True once sre.json has at least one SRE quarter. */
export const hasBudgetData =
  readDataJson<unknown[]>('transparency/sre.json').length > 0;
