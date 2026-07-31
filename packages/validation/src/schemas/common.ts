import { z } from 'zod';
import { isValidCEP, isValidCNPJ, isValidCPF, isValidPhoneBR } from '../br-documents.js';

/** Unidades federativas do Brasil. */
export const UFS = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

const stripNonDigits = (value: string) => value.replace(/\D+/g, '');

export const emailSchema = z
  .string({ required_error: 'O e-mail é obrigatório' })
  .trim()
  .toLowerCase()
  .email('Informe um e-mail válido');

export const passwordSchema = z
  .string({ required_error: 'A senha é obrigatória' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha deve ter no máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'A senha deve conter ao menos uma letra')
  .regex(/[0-9]/, 'A senha deve conter ao menos um número');

export const fullNameSchema = z
  .string({ required_error: 'O nome é obrigatório' })
  .trim()
  .min(3, 'Informe o nome completo')
  .max(120, 'Nome muito longo')
  .refine((value) => value.includes(' '), 'Informe nome e sobrenome');

export const phoneSchema = z
  .string({ required_error: 'O telefone é obrigatório' })
  .transform(stripNonDigits)
  .refine(isValidPhoneBR, 'Informe um telefone válido com DDD');

export const cpfSchema = z
  .string({ required_error: 'O CPF é obrigatório' })
  .transform(stripNonDigits)
  .refine(isValidCPF, 'CPF inválido');

export const cnpjSchema = z
  .string({ required_error: 'O CNPJ é obrigatório' })
  .transform(stripNonDigits)
  .refine(isValidCNPJ, 'CNPJ inválido');

/** Aceita CPF ou CNPJ (fornecedor pessoa física ou jurídica). */
export const cpfOrCnpjSchema = z
  .string({ required_error: 'O documento é obrigatório' })
  .transform(stripNonDigits)
  .refine((value) => isValidCPF(value) || isValidCNPJ(value), 'Informe um CPF ou CNPJ válido');

export const cepSchema = z
  .string({ required_error: 'O CEP é obrigatório' })
  .transform(stripNonDigits)
  .refine(isValidCEP, 'CEP inválido');

export const ufSchema = z.enum(UFS, {
  errorMap: () => ({ message: 'Selecione um estado válido' }),
});

export const slugSchema = z
  .string()
  .min(1, 'Slug obrigatório')
  .max(120, 'Slug muito longo')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug deve conter apenas letras minúsculas, números e hífens',
  );

export const uuidSchema = z.string().uuid('Identificador inválido');

/** Valor monetário em centavos: inteiro não negativo. */
export const moneyCentsSchema = z
  .number({ invalid_type_error: 'Valor inválido' })
  .int('O valor deve estar em centavos (inteiro)')
  .nonnegative('O valor não pode ser negativo');

export const guestCountSchema = z
  .number({ invalid_type_error: 'Quantidade inválida' })
  .int('Informe um número inteiro de convidados')
  .min(1, 'Deve haver ao menos 1 convidado')
  .max(100_000, 'Quantidade de convidados acima do permitido');
