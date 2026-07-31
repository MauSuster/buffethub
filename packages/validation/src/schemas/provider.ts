// packages/validation/src/schemas/provider.ts
import { z } from 'zod';

import {
  cepSchema,
  cpfOrCnpjSchema,
  emailSchema,
  phoneSchema,
  slugSchema,
  ufSchema,
} from './common.js';

/**
 * Converte textos vazios em undefined.
 *
 * Isso permite que campos opcionais enviados por inputs HTML,
 * como "", sejam tratados corretamente pelo Zod.
 */
function textoOpcional(valor: unknown): unknown {
  if (typeof valor !== 'string') {
    return valor;
  }

  const texto = valor.trim();

  return texto === '' ? undefined : texto;
}

/**
 * Converte valores recebidos de inputs HTML em números opcionais.
 *
 * Exemplos:
 * ""        -> undefined
 * "10"      -> 10
 * "2020"    -> 2020
 * undefined -> undefined
 * 50        -> 50
 */
function numeroOpcional(valor: unknown): unknown {
  if (valor === '' || valor === null || valor === undefined) {
    return undefined;
  }

  if (typeof valor === 'string') {
    const texto = valor.trim();

    if (texto === '') {
      return undefined;
    }

    const numero = Number(texto);

    return Number.isNaN(numero) ? valor : numero;
  }

  return valor;
}

const anoAtual = new Date().getFullYear();

/**
 * Schema reutilizável para o endereço do fornecedor.
 */
export const addressSchema = z.object({
  label: z.preprocess(
    textoOpcional,
    z
      .string({
        required_error: 'Informe uma identificação válida para o endereço.',
        invalid_type_error:
          'A identificação do endereço deve ser um texto.',
      })
      .trim()
      .max(
        40,
        'A identificação do endereço deve ter no máximo 40 caracteres.',
      )
      .optional(),
  ),

  cep: cepSchema,

  street: z
    .string({
      required_error: 'Informe o logradouro.',
      invalid_type_error: 'O logradouro deve ser um texto.',
    })
    .trim()
    .min(2, 'Informe o logradouro.')
    .max(160, 'O logradouro deve ter no máximo 160 caracteres.'),

  number: z
    .string({
      required_error: 'Informe o número do endereço.',
      invalid_type_error: 'O número do endereço deve ser um texto.',
    })
    .trim()
    .min(1, 'Informe o número do endereço.')
    .max(20, 'O número deve ter no máximo 20 caracteres.'),

  complement: z.preprocess(
    textoOpcional,
    z
      .string({
        invalid_type_error: 'O complemento deve ser um texto.',
      })
      .trim()
      .max(80, 'O complemento deve ter no máximo 80 caracteres.')
      .optional(),
  ),

  district: z
    .string({
      required_error: 'Informe o bairro.',
      invalid_type_error: 'O bairro deve ser um texto.',
    })
    .trim()
    .min(2, 'Informe o bairro.')
    .max(80, 'O bairro deve ter no máximo 80 caracteres.'),

  city: z
    .string({
      required_error: 'Informe a cidade.',
      invalid_type_error: 'A cidade deve ser um texto.',
    })
    .trim()
    .min(2, 'Informe a cidade.')
    .max(80, 'A cidade deve ter no máximo 80 caracteres.'),

  state: ufSchema,

  isDefault: z
    .boolean({
      invalid_type_error:
        'A informação de endereço principal deve ser verdadeira ou falsa.',
    })
    .default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

/**
 * Schema principal para cadastro de fornecedores.
 *
 * Os campos numéricos utilizam z.preprocess para aceitar
 * os valores em formato de texto enviados pelos inputs HTML.
 */
export const providerRegistrationSchema = z
  .object({
    legalName: z
      .string({
        required_error: 'Informe a razão social.',
        invalid_type_error: 'A razão social deve ser um texto.',
      })
      .trim()
      .min(2, 'Informe a razão social.')
      .max(160, 'A razão social deve ter no máximo 160 caracteres.'),

    tradeName: z
      .string({
        required_error: 'Informe o nome fantasia.',
        invalid_type_error: 'O nome fantasia deve ser um texto.',
      })
      .trim()
      .min(2, 'Informe o nome fantasia.')
      .max(120, 'O nome fantasia deve ter no máximo 120 caracteres.'),

    document: cpfOrCnpjSchema,

    stateRegistration: z.preprocess(
      textoOpcional,
      z
        .string({
          invalid_type_error: 'A inscrição estadual deve ser um texto.',
        })
        .trim()
        .max(
          40,
          'A inscrição estadual deve ter no máximo 40 caracteres.',
        )
        .optional(),
    ),

    businessEmail: emailSchema,

    phone: phoneSchema,

    whatsapp: z.preprocess(
      textoOpcional,
      phoneSchema.optional(),
    ),

    website: z.preprocess(
      textoOpcional,
      z
        .string({
          invalid_type_error: 'O endereço do site deve ser um texto.',
        })
        .trim()
        .url(
          'Informe uma URL válida, começando com http:// ou https://.',
        )
        .optional(),
    ),

    instagram: z.preprocess(
      textoOpcional,
      z
        .string({
          invalid_type_error: 'O Instagram deve ser um texto.',
        })
        .trim()
        .max(
          60,
          'O Instagram deve ter no máximo 60 caracteres.',
        )
        .optional(),
    ),

    description: z
      .string({
        required_error: 'Descreva sua empresa.',
        invalid_type_error: 'A descrição deve ser um texto.',
      })
      .trim()
      .min(
        20,
        'Descreva sua empresa com pelo menos 20 caracteres.',
      )
      .max(
        2_000,
        'A descrição deve ter no máximo 2.000 caracteres.',
      ),

    foundedYear: z.preprocess(
      numeroOpcional,
      z
        .number({
          required_error: 'Informe o ano de fundação.',
          invalid_type_error:
            'Informe um ano de fundação válido.',
        })
        .int('O ano de fundação deve ser um número inteiro.')
        .min(
          1900,
          'O ano de fundação deve ser igual ou posterior a 1900.',
        )
        .max(
          anoAtual,
          `O ano de fundação não pode ser posterior a ${anoAtual}.`,
        )
        .optional(),
    ),

    employeeCount: z.preprocess(
      numeroOpcional,
      z
        .number({
          invalid_type_error:
            'Informe uma quantidade de funcionários válida.',
        })
        .int(
          'A quantidade de funcionários deve ser um número inteiro.',
        )
        .min(
          0,
          'A quantidade de funcionários não pode ser negativa.',
        )
        .max(
          100_000,
          'A quantidade de funcionários deve ser de no máximo 100.000.',
        )
        .optional(),
    ),

    serviceRadiusKm: z.preprocess(
      numeroOpcional,
      z
        .number({
          invalid_type_error:
            'Informe um raio de atendimento válido.',
        })
        .int(
          'O raio de atendimento deve ser um número inteiro.',
        )
        .min(
          0,
          'O raio de atendimento não pode ser negativo.',
        )
        .max(
          2_000,
          'O raio de atendimento deve ser de no máximo 2.000 km.',
        )
        .optional(),
    ),

    minCapacity: z.preprocess(
      numeroOpcional,
      z
        .number({
          invalid_type_error:
            'Informe uma capacidade mínima válida.',
        })
        .int(
          'A capacidade mínima deve ser um número inteiro.',
        )
        .min(
          0,
          'A capacidade mínima não pode ser negativa.',
        )
        .max(
          1_000_000,
          'A capacidade mínima informada é muito alta.',
        )
        .optional(),
    ),

    maxCapacity: z.preprocess(
      numeroOpcional,
      z
        .number({
          invalid_type_error:
            'Informe uma capacidade máxima válida.',
        })
        .int(
          'A capacidade máxima deve ser um número inteiro.',
        )
        .min(
          0,
          'A capacidade máxima não pode ser negativa.',
        )
        .max(
          1_000_000,
          'A capacidade máxima informada é muito alta.',
        )
        .optional(),
    ),

    categorySlugs: z
      .array(slugSchema, {
        required_error: 'Selecione pelo menos uma categoria.',
        invalid_type_error:
          'As categorias selecionadas são inválidas.',
      })
      .min(1, 'Selecione pelo menos uma categoria.'),

    address: addressSchema,

    acceptedTerms: z.literal(true, {
      errorMap: () => ({
        message:
          'É necessário aceitar os Termos de Parceria para continuar.',
      }),
    }),
  })
  .refine(
    (dados) =>
      dados.minCapacity === undefined ||
      dados.maxCapacity === undefined ||
      dados.minCapacity <= dados.maxCapacity,
    {
      message:
        'A capacidade máxima deve ser maior ou igual à capacidade mínima.',
      path: ['maxCapacity'],
    },
  );

export type ProviderRegistrationInput = z.infer<
  typeof providerRegistrationSchema
>;