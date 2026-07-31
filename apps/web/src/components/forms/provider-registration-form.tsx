// apps/web/src/components/forms/provider-registration-form.tsx
'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  providerRegistrationSchema,
  UFS,
  type ProviderRegistrationInput,
} from '@buffethub/validation';
import {
  maskCEP,
  maskCNPJ,
  maskCPF,
  maskPhoneBR,
  onlyDigits,
} from '@buffethub/utils';

import { registerProviderAction } from '@/lib/actions/provider';
import { applyServerErrors, toOptionalNumber } from '@/lib/forms';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import type { ActionState } from '@/lib/actions/types';

type OpcaoCategoria = {
  slug: string;
  name: string;
};

type UF = (typeof UFS)[number];

type ValoresFormulario = {
  legalName: string;
  tradeName: string;
  document: string;
  stateRegistration: string;
  businessEmail: string;
  phone: string;
  whatsapp: string;
  website: string;
  instagram: string;
  description: string;
  foundedYear: string;
  employeeCount: string;
  serviceRadiusKm: string;
  minCapacity: string;
  maxCapacity: string;
  categorySlugs: string[];
  cep: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: '' | UF;
  acceptedTerms: boolean;
};

type PropriedadesTituloSecao = {
  indice: string;
  titulo: string;
  descricao?: string;
};

type PropriedadesFormularioCadastro = {
  categories: OpcaoCategoria[];
};

function TituloSecao({
  indice,
  titulo,
  descricao,
}: PropriedadesTituloSecao) {
  return (
    <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
      <span className="font-display text-sm font-semibold text-accent-foreground">
        {indice}
      </span>

      <div>
        <h2 className="font-display text-lg font-semibold">
          {titulo}
        </h2>

        {descricao ? (
          <p className="text-sm text-muted-foreground">
            {descricao}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ProviderRegistrationForm({
  categories: categorias,
}: PropriedadesFormularioCadastro) {
  const [estadoAcao, definirEstadoAcao] =
    useState<ActionState>({
      status: 'idle',
    });

  const formulario = useForm<ValoresFormulario>({
    resolver: zodResolver(
      providerRegistrationSchema,
    ) as unknown as Resolver<ValoresFormulario>,

    defaultValues: {
      legalName: '',
      tradeName: '',
      document: '',
      stateRegistration: '',
      businessEmail: '',
      phone: '',
      whatsapp: '',
      website: '',
      instagram: '',
      description: '',
      foundedYear: '',
      employeeCount: '',
      serviceRadiusKm: '',
      minCapacity: '',
      maxCapacity: '',
      categorySlugs: [],
      cep: '',
      street: '',
      number: '',
      complement: '',
      district: '',
      city: '',
      state: '',
      acceptedTerms: false,
    },
  });

  const {
    register: registrarCampo,
    formState: {
      errors: erros,
      isSubmitting: enviandoFormulario,
    },
  } = formulario;

  const campoDocumento = registrarCampo('document');
  const campoTelefone = registrarCampo('phone');
  const campoWhatsApp = registrarCampo('whatsapp');
  const campoCep = registrarCampo('cep');

  const enviarFormulario = formulario.handleSubmit(
    async (valores) => {
      definirEstadoAcao({ status: 'idle' });

      if (!valores.state) {
        formulario.setError('state', {
          type: 'manual',
          message: 'Selecione o estado.',
        });

        return;
      }

      if (!valores.acceptedTerms) {
        formulario.setError('acceptedTerms', {
          type: 'manual',
          message:
            'É necessário aceitar os Termos de Parceria para continuar.',
        });

        return;
      }

      const dadosCadastro: ProviderRegistrationInput = {
        legalName: valores.legalName.trim(),
        tradeName: valores.tradeName.trim(),
        document: valores.document,

        stateRegistration:
          valores.stateRegistration.trim() || undefined,

        businessEmail: valores.businessEmail
          .trim()
          .toLowerCase(),

        phone: valores.phone,

        whatsapp:
          valores.whatsapp.trim() || undefined,

        website:
          valores.website.trim() || undefined,

        instagram:
          valores.instagram.trim() || undefined,

        description: valores.description.trim(),

        foundedYear: toOptionalNumber(
          valores.foundedYear,
        ),

        employeeCount: toOptionalNumber(
          valores.employeeCount,
        ),

        serviceRadiusKm: toOptionalNumber(
          valores.serviceRadiusKm,
        ),

        minCapacity: toOptionalNumber(
          valores.minCapacity,
        ),

        maxCapacity: toOptionalNumber(
          valores.maxCapacity,
        ),

        categorySlugs: valores.categorySlugs,

        address: {
          cep: valores.cep,
          street: valores.street.trim(),
          number: valores.number.trim(),

          complement:
            valores.complement.trim() || undefined,

          district: valores.district.trim(),
          city: valores.city.trim(),
          state: valores.state,
          isDefault: true,
        },

        acceptedTerms: true,
      };

      const resultado =
        await registerProviderAction(dadosCadastro);

      if (resultado.status === 'error') {
        applyServerErrors(
          formulario.setError,
          resultado.fieldErrors,
        );

        definirEstadoAcao(resultado);
        return;
      }

      definirEstadoAcao(resultado);
    },
  );

  return (
    <form
      onSubmit={enviarFormulario}
      className="space-y-10"
      noValidate
    >
      {estadoAcao.status === 'error' ? (
        <Alert variant="error">
          {estadoAcao.message}
        </Alert>
      ) : null}

      <section aria-labelledby="titulo-dados-empresa">
        <div id="titulo-dados-empresa">
          <TituloSecao
            indice="01"
            titulo="Informações da empresa"
            descricao="Informe os dados de identificação e os canais de contato da sua empresa."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Razão social"
            htmlFor="legalName"
            error={erros.legalName?.message}
            required
          >
            <Input
              id="legalName"
              placeholder="Ex.: BuffetHub Serviços de Eventos Ltda."
              autoComplete="organization"
              aria-invalid={Boolean(erros.legalName)}
              {...registrarCampo('legalName')}
            />
          </Field>

          <Field
            label="Nome fantasia"
            htmlFor="tradeName"
            error={erros.tradeName?.message}
            required
          >
            <Input
              id="tradeName"
              placeholder="Ex.: BuffetHub Eventos"
              autoComplete="organization"
              aria-invalid={Boolean(erros.tradeName)}
              {...registrarCampo('tradeName')}
            />
          </Field>

          <Field
            label="CPF ou CNPJ"
            htmlFor="document"
            error={erros.document?.message}
            required
          >
            <Input
              id="document"
              inputMode="numeric"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              autoComplete="off"
              maxLength={18}
              aria-invalid={Boolean(erros.document)}
              {...campoDocumento}
              onChange={(evento) => {
                const numeros = onlyDigits(evento.target.value);

                evento.target.value =
                  numeros.length > 11
                    ? maskCNPJ(numeros)
                    : maskCPF(numeros);

                void campoDocumento.onChange(evento);
              }}
            />
          </Field>

          <Field
            label="Inscrição estadual"
            htmlFor="stateRegistration"
            error={erros.stateRegistration?.message}
            hint="Opcional"
          >
            <Input
              id="stateRegistration"
              placeholder="Digite a inscrição estadual"
              autoComplete="off"
              aria-invalid={Boolean(erros.stateRegistration)}
              {...registrarCampo('stateRegistration')}
            />
          </Field>

          <Field
            label="E-mail comercial"
            htmlFor="businessEmail"
            error={erros.businessEmail?.message}
            required
          >
            <Input
              id="businessEmail"
              type="email"
              inputMode="email"
              placeholder="contato@suaempresa.com.br"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(erros.businessEmail)}
              {...registrarCampo('businessEmail')}
            />
          </Field>

          <Field
            label="Telefone comercial"
            htmlFor="phone"
            error={erros.phone?.message}
            required
          >
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              placeholder="(11) 3333-4444"
              autoComplete="tel"
              maxLength={15}
              aria-invalid={Boolean(erros.phone)}
              {...campoTelefone}
              onChange={(evento) => {
                evento.target.value = maskPhoneBR(
                  evento.target.value,
                );

                void campoTelefone.onChange(evento);
              }}
            />
          </Field>

          <Field
            label="WhatsApp"
            htmlFor="whatsapp"
            error={erros.whatsapp?.message}
            hint="Opcional"
          >
            <Input
              id="whatsapp"
              type="tel"
              inputMode="tel"
              placeholder="(11) 91234-5678"
              autoComplete="tel"
              maxLength={15}
              aria-invalid={Boolean(erros.whatsapp)}
              {...campoWhatsApp}
              onChange={(evento) => {
                evento.target.value = maskPhoneBR(
                  evento.target.value,
                );

                void campoWhatsApp.onChange(evento);
              }}
            />
          </Field>

          <Field
            label="Site oficial"
            htmlFor="website"
            error={erros.website?.message}
            hint="Opcional"
          >
            <Input
              id="website"
              type="url"
              inputMode="url"
              placeholder="https://www.suaempresa.com.br"
              autoComplete="url"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(erros.website)}
              {...registrarCampo('website')}
            />
          </Field>

          <Field
            label="Instagram"
            htmlFor="instagram"
            error={erros.instagram?.message}
            hint="Opcional"
          >
            <Input
              id="instagram"
              placeholder="@suaempresa"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(erros.instagram)}
              {...registrarCampo('instagram')}
            />
          </Field>

          <Field
            label="Ano de fundação"
            htmlFor="foundedYear"
            error={erros.foundedYear?.message}
            hint="Opcional"
          >
            <Input
              id="foundedYear"
              inputMode="numeric"
              placeholder="Ex.: 2015"
              maxLength={4}
              aria-invalid={Boolean(erros.foundedYear)}
              {...registrarCampo('foundedYear', {
                onChange: (evento) => {
                  evento.target.value = onlyDigits(
                    evento.target.value,
                  ).slice(0, 4);
                },
              })}
            />
          </Field>

          <Field
            label="Quantidade de funcionários"
            htmlFor="employeeCount"
            error={erros.employeeCount?.message}
            hint="Opcional"
          >
            <Input
              id="employeeCount"
              inputMode="numeric"
              placeholder="Ex.: 10"
              aria-invalid={Boolean(erros.employeeCount)}
              {...registrarCampo('employeeCount', {
                onChange: (evento) => {
                  evento.target.value = onlyDigits(
                    evento.target.value,
                  );
                },
              })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field
            label="Sobre a empresa"
            htmlFor="description"
            error={erros.description?.message}
            hint="Conte o que torna seus serviços especiais. Escreva pelo menos 20 caracteres."
            required
          >
            <Textarea
              id="description"
              rows={5}
              placeholder="Apresente sua empresa, seus diferenciais, sua experiência e os principais tipos de evento que atende."
              aria-invalid={Boolean(erros.description)}
              {...registrarCampo('description')}
            />
          </Field>
        </div>
      </section>

      <section aria-labelledby="titulo-categorias">
        <div id="titulo-categorias">
          <TituloSecao
            indice="02"
            titulo="Categorias de serviços"
            descricao="Selecione todos os serviços oferecidos pela sua empresa."
          />
        </div>

        <fieldset>
          <legend className="sr-only">
            Categorias de serviços oferecidas
          </legend>

          {categorias.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:grid-cols-3">
              {categorias.map((categoria) => (
                <label
                  key={categoria.slug}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <Checkbox
                    value={categoria.slug}
                    aria-invalid={Boolean(erros.categorySlugs)}
                    {...registrarCampo('categorySlugs')}
                  />

                  <span>{categoria.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhuma categoria está disponível no momento.
            </p>
          )}
        </fieldset>

        {erros.categorySlugs ? (
          <p
            className="mt-2 text-xs font-medium text-destructive"
            role="alert"
          >
            {erros.categorySlugs.message as string}
          </p>
        ) : null}
      </section>

      <section aria-labelledby="titulo-atendimento">
        <div id="titulo-atendimento">
          <TituloSecao
            indice="03"
            titulo="Área e capacidade de atendimento"
            descricao="Informe a distância atendida e o tamanho dos eventos que sua empresa consegue realizar."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Raio de atendimento"
            htmlFor="serviceRadiusKm"
            error={erros.serviceRadiusKm?.message}
            hint="Distância em quilômetros"
          >
            <Input
              id="serviceRadiusKm"
              inputMode="numeric"
              placeholder="Ex.: 50"
              aria-invalid={Boolean(erros.serviceRadiusKm)}
              {...registrarCampo('serviceRadiusKm', {
                onChange: (evento) => {
                  evento.target.value = onlyDigits(
                    evento.target.value,
                  );
                },
              })}
            />
          </Field>

          <Field
            label="Capacidade mínima"
            htmlFor="minCapacity"
            error={erros.minCapacity?.message}
            hint="Quantidade de convidados"
          >
            <Input
              id="minCapacity"
              inputMode="numeric"
              placeholder="Ex.: 20"
              aria-invalid={Boolean(erros.minCapacity)}
              {...registrarCampo('minCapacity', {
                onChange: (evento) => {
                  evento.target.value = onlyDigits(
                    evento.target.value,
                  );
                },
              })}
            />
          </Field>

          <Field
            label="Capacidade máxima"
            htmlFor="maxCapacity"
            error={erros.maxCapacity?.message}
            hint="Quantidade de convidados"
          >
            <Input
              id="maxCapacity"
              inputMode="numeric"
              placeholder="Ex.: 500"
              aria-invalid={Boolean(erros.maxCapacity)}
              {...registrarCampo('maxCapacity', {
                onChange: (evento) => {
                  evento.target.value = onlyDigits(
                    evento.target.value,
                  );
                },
              })}
            />
          </Field>
        </div>
      </section>

      <section aria-labelledby="titulo-endereco">
        <div id="titulo-endereco">
          <TituloSecao
            indice="04"
            titulo="Endereço da empresa"
            descricao="Informe o endereço principal onde sua operação está localizada."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-6">
          <Field
            className="sm:col-span-2"
            label="CEP"
            htmlFor="cep"
            error={erros.cep?.message}
            required
          >
            <Input
              id="cep"
              inputMode="numeric"
              placeholder="00000-000"
              autoComplete="postal-code"
              maxLength={9}
              aria-invalid={Boolean(erros.cep)}
              {...campoCep}
              onChange={(evento) => {
                evento.target.value = maskCEP(
                  evento.target.value,
                );

                void campoCep.onChange(evento);
              }}
            />
          </Field>

          <Field
            className="sm:col-span-4"
            label="Rua ou avenida"
            htmlFor="street"
            error={erros.street?.message}
            required
          >
            <Input
              id="street"
              placeholder="Ex.: Avenida da Liberdade"
              autoComplete="address-line1"
              aria-invalid={Boolean(erros.street)}
              {...registrarCampo('street')}
            />
          </Field>

          <Field
            className="sm:col-span-1"
            label="Número"
            htmlFor="number"
            error={erros.number?.message}
            required
          >
            <Input
              id="number"
              placeholder="Ex.: 123"
              autoComplete="address-line2"
              aria-invalid={Boolean(erros.number)}
              {...registrarCampo('number')}
            />
          </Field>

          <Field
            className="sm:col-span-2"
            label="Complemento"
            htmlFor="complement"
            error={erros.complement?.message}
            hint="Opcional"
          >
            <Input
              id="complement"
              placeholder="Ex.: Sala 10, bloco B"
              autoComplete="address-line2"
              aria-invalid={Boolean(erros.complement)}
              {...registrarCampo('complement')}
            />
          </Field>

          <Field
            className="sm:col-span-3"
            label="Bairro"
            htmlFor="district"
            error={erros.district?.message}
            required
          >
            <Input
              id="district"
              placeholder="Ex.: Liberdade"
              autoComplete="address-level3"
              aria-invalid={Boolean(erros.district)}
              {...registrarCampo('district')}
            />
          </Field>

          <Field
            className="sm:col-span-4"
            label="Cidade"
            htmlFor="city"
            error={erros.city?.message}
            required
          >
            <Input
              id="city"
              placeholder="Ex.: São Paulo"
              autoComplete="address-level2"
              aria-invalid={Boolean(erros.city)}
              {...registrarCampo('city')}
            />
          </Field>

          <Field
            className="sm:col-span-2"
            label="Estado"
            htmlFor="state"
            error={erros.state?.message}
            required
          >
            <Select
              id="state"
              defaultValue=""
              autoComplete="address-level1"
              aria-invalid={Boolean(erros.state)}
              {...registrarCampo('state')}
            >
              <option value="" disabled>
                Selecione a UF
              </option>

              {UFS.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <div className="space-y-4 border-t border-border pt-6">
        <div>
          <label
            htmlFor="acceptedTerms"
            className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground"
          >
            <Checkbox
              id="acceptedTerms"
              aria-invalid={Boolean(erros.acceptedTerms)}
              {...registrarCampo('acceptedTerms')}
            />

            <span>
              Declaro que li e concordo com os{' '}
              <span className="font-medium text-foreground">
                Termos de Parceria
              </span>{' '}
              e com a{' '}
              <span className="font-medium text-foreground">
                Política de Privacidade
              </span>{' '}
              do BuffetHub.
            </span>
          </label>

          {erros.acceptedTerms ? (
            <p
              className="mt-2 text-xs font-medium text-destructive"
              role="alert"
            >
              {erros.acceptedTerms.message as string}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={enviandoFormulario}
          aria-busy={enviandoFormulario}
        >
          {enviandoFormulario ? <Spinner /> : null}

          {enviandoFormulario
            ? 'Enviando cadastro...'
            : 'Enviar cadastro para análise'}
        </Button>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Seu cadastro será analisado pela equipe do BuffetHub. Enquanto
          aguarda a aprovação, você poderá continuar preenchendo as
          informações e preparando o catálogo da sua empresa.
        </p>
      </div>
    </form>
  );
}