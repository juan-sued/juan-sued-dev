# Juan Sued Portfolio

Portfolio bilíngue com Next.js App Router, TypeScript e Tailwind CSS. Conteúdo público; cases usam dados e arquitetura genéricos.

## Rodar

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Conteúdo

Todo o conteúdo (perfil, experiências, competências, formação, cases e certificações) vem do banco Supabase — não há mais arquivo local com dados hardcoded. Repositórios em `lib/repositories/` leem views públicas (`published_*`); `/admin/content` e `/admin/content/certifications` editam via Supabase Auth + RLS admin-only.

- `lib/repositories/profile.ts` / `cases.ts` / `experiences.ts` / `skills.ts` / `education.ts` / `certifications.ts`: leitura pública tipada com Zod.
- `lib/analytics.ts`: camada sem tracker ativo; ponto de integração para PostHog consent-aware.
- `public/images/juan-sued-profile.png`: foto local usada via `next/image`.
- Currículos (ATS e visual): PDFs no bucket `resumes` do Supabase Storage, gerenciados via `/admin/content/resumes`.

## Admin CRM

`/admin` usa Supabase Auth e `admin_users` para acesso. CRM permite administrar contatos, notas, oportunidades e logs de auditoria. Usuário autenticado sem membership é bloqueado.

Contato público carrega script oficial Turnstile com renderização explícita e mantém token só em memória até enviar `POST /api/contact`. Handler valida payload, rejeita honeypot, verifica Turnstile antes de gravar e usa cliente server-side com service role para inserir submissão. Em produção, chave ou token ausente, erro de rede ou resposta inválida bloqueia envio (fail closed). Sem site key fora de produção, formulário envia sem token para desenvolvimento local.

Rate limit fica em memória do processo: máximo de 5 tentativas por IP com hash, por janela de 60 segundos. Limite não é compartilhado entre instâncias Vercel e reinicia após cold start; use rate limiter compartilhado se proteção distribuída for necessária.

## Ambiente

Copie nomes de `.env.example` para ambiente local ou Vercel e preencha valores fora do repositório. Nunca versione `.env.local`, service role, Turnstile secret, token CLI ou senha de banco.

Variáveis usadas:

- `NEXT_PUBLIC_SITE_URL`: URL pública sem barra final; metadata, canonical, Open Graph, sitemap, robots e JSON-LD.
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto Supabase.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: chave pública Supabase para browser e sessão server-side.
- `SUPABASE_SERVICE_ROLE_KEY`: somente servidor; intake de contatos. Nunca prefixe com `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: site key pública Cloudflare Turnstile.
- `TURNSTILE_SECRET_KEY`: somente servidor; verificação Turnstile.
- `ADMIN_USER_ID`: variável de legado presente no template; autorização atual usa tabela `admin_users` e não lê esta variável.
- `NEXT_PUBLIC_ANALYTICS_DEBUG`: opcional; use `true` para logs locais de analytics.

## Supabase Migrations

Migrations versionadas ficam em `supabase/migrations`.

```bash
npm run supabase:migration:new -- nome_da_migration
npm run supabase:migration:list
npm run supabase:db:push
```

Revise SQL, schema e RLS antes de `db:push`. Aplique migrations em ordem em ambiente alvo. Após deploy, siga [checklist manual de RLS](docs/rls-checklist.md).

## Deploy Vercel

1. Importe repositório; selecione preset Next.js.
2. Configure variáveis para Production, Preview quando necessário, Development quando necessário: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
3. `ADMIN_USER_ID` somente se outro deploy ainda depender dele; CRM atual não usa variável.
4. Rode build padrão `npm run build`.
5. Ajuste domínio final e `NEXT_PUBLIC_SITE_URL`; faça redeploy após mudar qualquer `NEXT_PUBLIC_`.

## Decisões

- Server shell e conteúdo estático; interações concentradas em client components.
- Estado local persistido para idioma e tema.
- Links externos usam `target="_blank"` e `rel="noopener noreferrer"`.
- Dados confidenciais, métricas não comprovadas e screenshots internos não são usados.

## Próximas Melhorias

- Integrar provider de analytics com consentimento.
- Adicionar testes E2E Playwright.
- Gerar imagem social Open Graph dedicada.
- Substituir rate limit em memória por armazenamento compartilhado antes de escalar serverless.
