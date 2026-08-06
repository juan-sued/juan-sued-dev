// Importa as certificações já publicadas (arquivos PDF no bucket "certifications")
// para a tabela public.certifications. Upsert idempotente pela storage_path.
//
// Não roda durante build nem em migrações. Executar manualmente após aplicar a
// migração add_certifications_management:
//
//   $keys = supabase projects api-keys --project-ref <ref> --output json | ConvertFrom-Json
//   $env:SUPABASE_SERVICE_ROLE_KEY = ($keys | Where-Object { $_.id -eq 'service_role' }).api_key
//   node --env-file=.env.local scripts/import-existing-certifications.ts

import { createClient } from "@supabase/supabase-js";

type ImportCertification = {
  title_pt: string;
  title_en: string;
  issuer: string;
  category: string;
  completed_at: string;
  workload_hours: number;
  storage_path: string;
  featured: boolean;
  recruiter_visible: boolean;
  display_order: number;
  publication_status: "published";
  published_at: string;
};

const CERTIFICATIONS: readonly ImportCertification[] = [
  {
    title_pt: "SQL: explorando consultas e manipulação de dados",
    title_en: "SQL: Exploring Queries and Data Manipulation",
    issuer: "Alura",
    category: "database",
    completed_at: "2026-03-15",
    workload_hours: 14,
    storage_path: "alura/2026/alura-sql-consultas-manipulacao-dados.pdf",
    featured: true,
    recruiter_visible: true,
    display_order: 0,
    publication_status: "published",
    published_at: "2026-08-05T00:00:00Z",
  },
  {
    title_pt: "Carreira Node.js: boas-vindas e primeiros passos",
    title_en: "Node.js Career: Welcome and First Steps",
    issuer: "Alura",
    category: "backend",
    completed_at: "2026-01-13",
    workload_hours: 2,
    storage_path: "alura/2026/alura-nodejs-primeiros-passos.pdf",
    featured: false,
    recruiter_visible: true,
    display_order: 1,
    publication_status: "published",
    published_at: "2026-08-05T00:00:00Z",
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let pending = 0;

  for (const cert of CERTIFICATIONS) {
    const { error: infoError } = await supabase.storage.from("certifications").info(cert.storage_path);
    if (infoError) {
      console.error(`[skip] objeto não encontrado no bucket: ${cert.storage_path} (${infoError.message})`);
      pending++;
      continue;
    }

    const { error } = await supabase.from("certifications").upsert(
      { storage_bucket: "certifications", ...cert },
      { onConflict: "storage_path" },
    );
    if (error) {
      console.error(`[error] upsert falhou para ${cert.storage_path}: ${error.message}`);
      pending++;
      continue;
    }
    console.log(`[ok] importada ${cert.storage_path}`);
  }

  if (pending === 0) {
    console.log("Importação concluída sem pendências.");
    process.exit(0);
  }
  console.error(`Importação concluída com ${pending} pendência(s).`);
  process.exit(2);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
