import { describe, expect, it } from 'vitest';
import {
  formatBRL,
  formatDateBR,
  formatDateTimeBR,
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskPhoneBR,
  onlyDigits,
  slugify,
  truncate,
} from '../src/format.js';

/** Normaliza espaços não separáveis que o Intl insere na moeda. */
function normalizeSpace(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

describe('formatBRL', () => {
  it('formata centavos como moeda brasileira', () => {
    expect(normalizeSpace(formatBRL(199990))).toBe('R$ 1.999,90');
    expect(normalizeSpace(formatBRL(1990))).toBe('R$ 19,90');
    expect(normalizeSpace(formatBRL(0))).toBe('R$ 0,00');
  });
});

describe('máscaras de documentos brasileiros', () => {
  it('CPF', () => {
    expect(maskCPF('12345678909')).toBe('123.456.789-09');
  });
  it('CNPJ', () => {
    expect(maskCNPJ('12345678000190')).toBe('12.345.678/0001-90');
  });
  it('CEP', () => {
    expect(maskCEP('01310930')).toBe('01310-930');
  });
  it('telefone celular', () => {
    expect(maskPhoneBR('11912345678')).toBe('(11) 91234-5678');
  });
  it('telefone fixo', () => {
    expect(maskPhoneBR('1132145678')).toBe('(11) 3214-5678');
  });
});

describe('datas no fuso de São Paulo', () => {
  const instant = new Date('2025-03-08T12:00:00Z'); // 09:00 em SP

  it('formata data', () => {
    expect(formatDateBR(instant)).toBe('08/03/2025');
  });
  it('formata data e hora', () => {
    expect(formatDateTimeBR(instant)).toBe('08/03/2025 09:00');
  });
});

describe('helpers de texto', () => {
  it('onlyDigits', () => {
    expect(onlyDigits('(11) 3214-5678')).toBe('1132145678');
  });
  it('slugify remove acentos e normaliza', () => {
    expect(slugify('Buffet São João & Cia!')).toBe('buffet-sao-joao-cia');
  });
  it('truncate adiciona reticências', () => {
    expect(truncate('hello world', 5)).toBe('hell…');
    expect(truncate('curto', 10)).toBe('curto');
  });
});
