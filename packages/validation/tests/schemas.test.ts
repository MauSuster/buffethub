// packages/validation/tests/schemas.test.ts
import { describe, expect, it } from 'vitest';

import { signUpSchema } from '../src/schemas/auth.js';
import { providerRegistrationSchema } from '../src/schemas/provider.js';

describe('signUpSchema', () => {
  const base = {
    fullName: 'Maria da Silva',
    email: 'MARIA@Example.com ',
    phone: '(11) 91234-5678',
    password: 'senha1234',
    confirmPassword: 'senha1234',
    acceptedTerms: true as const,
    acceptedPrivacy: true as const,
  };

  it('normaliza e-mail e telefone em cadastro válido', () => {
    const result = signUpSchema.parse(base);

    expect(result.email).toBe('maria@example.com');
    expect(result.phone).toBe('11912345678');
    expect(result.marketingOptIn).toBe(false);
  });

  it('rejeita senhas divergentes', () => {
    const result = signUpSchema.safeParse({
      ...base,
      confirmPassword: 'outra1234',
    });

    expect(result.success).toBe(false);
  });

  it('exige aceite dos termos', () => {
    const result = signUpSchema.safeParse({
      ...base,
      acceptedTerms: false,
    });

    expect(result.success).toBe(false);
  });

  it('rejeita senha fraca', () => {
    const result = signUpSchema.safeParse({
      ...base,
      password: 'abcdefgh',
      confirmPassword: 'abcdefgh',
    });

    expect(result.success).toBe(false);
  });
});

describe('providerRegistrationSchema', () => {
  const base = {
    legalName: 'Buffet Festa Boa LTDA',
    tradeName: 'Festa Boa',
    document: '11.222.333/0001-81',
    stateRegistration: '',
    businessEmail: 'contato@festaboa.com.br',
    phone: '(11) 3214-5678',
    whatsapp: '(11) 91234-5678',
    website: 'https://www.festaboa.com.br',
    instagram: '@festaboa',
    description:
      'Buffet completo para casamentos e eventos corporativos na região.',
    foundedYear: '2015',
    employeeCount: '10',
    serviceRadiusKm: '50',
    minCapacity: '20',
    maxCapacity: '500',
    categorySlugs: ['buffet-completo'],
    address: {
      label: 'Sede',
      cep: '01310-930',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Sala 10',
      district: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP' as const,
      isDefault: true,
    },
    acceptedTerms: true as const,
  };

  it('aceita cadastro de fornecedor válido', () => {
    const result =
      providerRegistrationSchema.safeParse(base);

    expect(result.success).toBe(true);
  });

  it('converte números enviados como texto', () => {
    const result =
      providerRegistrationSchema.parse(base);

    expect(result.foundedYear).toBe(2015);
    expect(result.employeeCount).toBe(10);
    expect(result.serviceRadiusKm).toBe(50);
    expect(result.minCapacity).toBe(20);
    expect(result.maxCapacity).toBe(500);
  });

  it('converte campos opcionais vazios para undefined', () => {
    const result =
      providerRegistrationSchema.parse({
        ...base,
        stateRegistration: '',
        website: '',
        foundedYear: '',
        employeeCount: '',
        serviceRadiusKm: '',
        minCapacity: '',
        maxCapacity: '',
      });

    expect(result.stateRegistration).toBeUndefined();
    expect(result.website).toBeUndefined();
    expect(result.foundedYear).toBeUndefined();
    expect(result.employeeCount).toBeUndefined();
    expect(result.serviceRadiusKm).toBeUndefined();
    expect(result.minCapacity).toBeUndefined();
    expect(result.maxCapacity).toBeUndefined();
  });

  it('rejeita documento inválido', () => {
    const result =
      providerRegistrationSchema.safeParse({
        ...base,
        document: '11.222.333/0001-80',
      });

    expect(result.success).toBe(false);
  });

  it('rejeita capacidade mínima maior que a máxima', () => {
    const result =
      providerRegistrationSchema.safeParse({
        ...base,
        minCapacity: '500',
        maxCapacity: '100',
      });

    expect(result.success).toBe(false);

    if (!result.success) {
      const erroCapacidade =
        result.error.issues.find(
          (issue) =>
            issue.path.join('.') === 'maxCapacity',
        );

      expect(erroCapacidade?.message).toBe(
        'A capacidade máxima deve ser maior ou igual à capacidade mínima.',
      );
    }
  });

  it('exige ao menos uma categoria', () => {
    const result =
      providerRegistrationSchema.safeParse({
        ...base,
        categorySlugs: [],
      });

    expect(result.success).toBe(false);
  });

  it('exige aceite dos Termos de Parceria', () => {
    const result =
      providerRegistrationSchema.safeParse({
        ...base,
        acceptedTerms: false,
      });

    expect(result.success).toBe(false);
  });
});