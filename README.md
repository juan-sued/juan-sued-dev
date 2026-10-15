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

Todo o conteúdo é local, versionado no repositório — sem banco nem serviço externo.

- `content/data/*.json`: perfil, experiências, competências, formação, cases, certificações e currículos. Edite estes arquivos e faça deploy.
- `public/certifications/<emissor>/<ano>/*.pdf`: PDFs dos certificados (`storage_path` em `certifications.json` é relativo a esta pasta).
- `public/resumes/ats.pdf` e `visual.pdf`: currículos.
- `lib/repositories/*.ts`: leitura tipada e validada com Zod; mantêm a API usada pelas páginas.
- `lib/analytics.ts`: camada sem tracker ativo; ponto de integração para PostHog consent-aware.
- `public/images/juan-sued-profile.png`: foto local usada via `next/image`.

## Contato

`POST /api/contact` valida o payload, rejeita honeypot, verifica Cloudflare Turnstile e envia o e-mail via [Resend](https://resend.com) (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`). Nada é armazenado. Em produção, Turnstile ou Resend ausente bloqueia o envio (fail closed); fora de produção a mensagem só é registrada no console.

Rate limit fica em memória do processo: máximo de 5 tentativas por IP com hash, por janela de 60 segundos; não é compartilhado entre instâncias serverless.

## Ambiente

Copie nomes de `.env.example` para `.env.local` (ou para o provedor de deploy). Nunca versione `.env.local`.

- `NEXT_PUBLIC_SITE_URL`: URL pública sem barra final; metadata, canonical, Open Graph, sitemap, robots e JSON-LD.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`: entrega do formulário de contato (somente servidor).
- `NEXT_PUBLIC_ANALYTICS_DEBUG`: opcional; `true` para logs locais de analytics.

## Deploy

1. Importe o repositório; preset Next.js.
2. Configure as variáveis acima.
3. Rode `npm run build`; redeploy após mudar qualquer `NEXT_PUBLIC_`.

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
