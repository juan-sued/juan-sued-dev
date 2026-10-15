import { Footer, GitHubProjects } from "@/components/server-content";
import { ProjectsGrid } from "@/components/projects";
import { getPreferences } from "@/lib/preferences";
import { getCachedProfile } from "@/lib/repositories/profile-cache";
import { getGitHubSummary } from "@/lib/repositories/github";
import { getProjects } from "@/lib/repositories/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/projetos", "Projetos", "Produtos reais em produção: BikerWay, Conta e Canta, 8Pixie e PromoGrupo, com decisões técnicas, stack e telas.");

export default async function Page() {
  const [{ locale }, profile, github, projects] = await Promise.all([getPreferences(), getCachedProfile(), getGitHubSummary(), getProjects()]);
  return <main id="content"><ProjectsGrid projects={projects} locale={locale}/><GitHubProjects locale={locale} github={github}/><Footer locale={locale} profile={profile}/></main>;
}
