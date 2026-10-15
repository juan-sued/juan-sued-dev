import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/server-content";
import { ProjectPage } from "@/components/projects";
import { getPreferences } from "@/lib/preferences";
import { getCachedProfile } from "@/lib/repositories/profile-cache";
import { getProject, getProjects } from "@/lib/repositories/projects";
import { pageMetadata } from "@/lib/seo";

export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProjects()).map(project => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject((await params).slug);
  if (!project) return {};
  return pageMetadata(`/projetos/${project.slug}`, `${project.name} - Estudo de caso de Juan Sued`, project.summary.pt, project.cover ? `/projects/${project.slug}/og.jpg` : undefined);
}

export default async function Page({ params }: Props) {
  const project = await getProject((await params).slug);
  if (!project) notFound();
  const [{ locale }, profile] = await Promise.all([getPreferences(), getCachedProfile()]);
  return <main id="content"><ProjectPage project={project} locale={locale}/><Footer locale={locale} profile={profile}/></main>;
}
