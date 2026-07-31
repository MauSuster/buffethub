import { centsToReais } from './money.js';

const BRL_TIME_ZONE = 'America/Sao_Paulo';

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, '');
}

/** Formata centavos como moeda brasileira: 199990 -> "R$ 1.999,90". */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centsToReais(cents));
}

/** Formata uma data como dd/MM/aaaa no fuso de São Paulo. */
export function formatDateBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRL_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/** Formata data e hora como dd/MM/aaaa HH:mm no fuso de São Paulo. */
export function formatDateTimeBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRL_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
    .format(date)
    .replace(',', '');
}

/** Aplica máscara de CPF: 12345678909 -> "123.456.789-09". Valores parciais são mascarados progressivamente. */
export function maskCPF(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Aplica máscara de CNPJ: 12345678000190 -> "12.345.678/0001-90". */
export function maskCNPJ(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/** Aplica máscara de CEP: 01310930 -> "01310-930". */
export function maskCEP(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

/**
 * Aplica máscara de telefone brasileiro.
 * Celular (11 dígitos): "(11) 91234-5678". Fixo (10 dígitos): "(11) 1234-5678".
 */
export function maskPhoneBR(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/** Trunca um texto adicionando reticências, respeitando o limite de caracteres. */
export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Gera um slug URL-safe a partir de um texto (remove acentos, espaços viram hífen). */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
