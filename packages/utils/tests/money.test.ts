import { describe, expect, it } from 'vitest';
import {
  applyBasisPoints,
  centsToReais,
  clampCents,
  reaisToCents,
  splitEvenly,
  sumCents,
} from '../src/money.js';

describe('reaisToCents', () => {
  it('converte reais para centavos inteiros', () => {
    expect(reaisToCents(19.9)).toBe(1990);
    expect(reaisToCents(0.1)).toBe(10);
    expect(reaisToCents(1)).toBe(100);
    expect(reaisToCents(0)).toBe(0);
  });

  it('trata imprecisão de ponto flutuante', () => {
    expect(reaisToCents(19.99)).toBe(1999);
    expect(reaisToCents(0.29)).toBe(29);
  });

  it('rejeita valores não finitos', () => {
    expect(() => reaisToCents(Number.NaN)).toThrow();
    expect(() => reaisToCents(Number.POSITIVE_INFINITY)).toThrow();
  });
});

describe('centsToReais', () => {
  it('converte centavos para reais', () => {
    expect(centsToReais(1990)).toBe(19.9);
    expect(centsToReais(0)).toBe(0);
  });

  it('rejeita centavos não inteiros', () => {
    expect(() => centsToReais(19.9)).toThrow();
  });
});

describe('applyBasisPoints', () => {
  it('aplica percentual em pontos-base', () => {
    expect(applyBasisPoints(100_000, 1000)).toBe(10_000); // 10%
    expect(applyBasisPoints(10_000, 875)).toBe(875); // 8.75%
    expect(applyBasisPoints(333, 1000)).toBe(33);
  });

  it('rejeita bps inválidos', () => {
    expect(() => applyBasisPoints(100, -1)).toThrow();
    expect(() => applyBasisPoints(100, 1.5)).toThrow();
  });
});

describe('splitEvenly', () => {
  it('distribui sem perder centavos', () => {
    expect(splitEvenly(100, 3)).toEqual([34, 33, 33]);
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333]);
    expect(splitEvenly(10, 4)).toEqual([3, 3, 2, 2]);
  });

  it('a soma das parcelas é sempre o total', () => {
    for (const [total, parts] of [
      [12345, 7],
      [99, 4],
      [100000, 12],
    ] as const) {
      expect(sumCents(splitEvenly(total, parts))).toBe(total);
    }
  });

  it('rejeita número de parcelas inválido', () => {
    expect(() => splitEvenly(100, 0)).toThrow();
  });
});

describe('sumCents / clampCents', () => {
  it('soma valores em centavos', () => {
    expect(sumCents([1, 2, 3])).toBe(6);
    expect(sumCents([])).toBe(0);
  });

  it('rejeita valores não inteiros na soma', () => {
    expect(() => sumCents([1, 2.5])).toThrow();
  });

  it('limita ao intervalo', () => {
    expect(clampCents(150, 0, 100)).toBe(100);
    expect(clampCents(-5, 0, 100)).toBe(0);
    expect(clampCents(50, 0, 100)).toBe(50);
  });
});
