import { describe, expect, it } from 'vitest';
import { isValidCEP, isValidCNPJ, isValidCPF, isValidPhoneBR } from '../src/br-documents.js';

describe('isValidCPF', () => {
  it('aceita CPFs válidos (com e sem máscara)', () => {
    expect(isValidCPF('111.444.777-35')).toBe(true);
    expect(isValidCPF('11144477735')).toBe(true);
  });

  it('rejeita dígitos verificadores incorretos', () => {
    expect(isValidCPF('111.444.777-30')).toBe(false);
    expect(isValidCPF('12345678900')).toBe(false);
  });

  it('rejeita sequências repetidas e tamanhos errados', () => {
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('111')).toBe(false);
  });
});

describe('isValidCNPJ', () => {
  it('aceita CNPJs válidos', () => {
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
    expect(isValidCNPJ('11222333000181')).toBe(true);
  });

  it('rejeita dígitos incorretos e repetições', () => {
    expect(isValidCNPJ('11.222.333/0001-80')).toBe(false);
    expect(isValidCNPJ('11111111111111')).toBe(false);
  });
});

describe('isValidCEP', () => {
  it('valida por formato de 8 dígitos', () => {
    expect(isValidCEP('01310-930')).toBe(true);
    expect(isValidCEP('01310930')).toBe(true);
    expect(isValidCEP('123')).toBe(false);
  });
});

describe('isValidPhoneBR', () => {
  it('aceita fixo (10) e celular (11 com nono dígito 9)', () => {
    expect(isValidPhoneBR('(11) 3214-5678')).toBe(true);
    expect(isValidPhoneBR('(11) 91234-5678')).toBe(true);
  });
  it('rejeita celular sem o nono dígito e tamanhos inválidos', () => {
    expect(isValidPhoneBR('11812345678')).toBe(false);
    expect(isValidPhoneBR('123')).toBe(false);
  });
});
