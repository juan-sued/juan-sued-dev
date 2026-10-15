import { z } from "zod";
import data from "@/content/data/github.json";

const curatedSchema = z.object({ user: z.string(), repos: z.array(z.object({ name: z.string(), description_pt: z.string(), description_en: z.string() })) });
const apiRepoSchema = z.object({
  name: z.string(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  pushed_at: z.string(),
  archived: z.boolean().optional(),
});

export type GitHubRepo = {
  name: string;
  url: string;
  description: { pt: string; en: string };
  language: string | null;
  stars: number;
  pushedAt: string | null;
};

export type GitHubSummary = { user: string; profileUrl: string; repos: GitHubRepo[] };

// Curated list in content/data/github.json; live metadata (language, stars, last push) comes from the public
// GitHub API, cached for an hour. If the API is unavailable the page still renders the curated entries.
export async function getGitHubSummary(): Promise<GitHubSummary> {
  const { user, repos } = curatedSchema.parse(data);
  const live = new Map<string, z.infer<typeof apiRepoSchema>>();
  try {
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
      headers: { accept: "application/vnd.github+json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      next: { revalidate: 3600 },
    });
    if (response.ok) for (const repo of apiRepoSchema.array().parse(await response.json())) live.set(repo.name, repo);
    else console.error("[github] request failed", response.status);
  } catch (error) {
    console.error("[github] unable to load repositories:", error instanceof Error ? error.name : "unknown");
  }
  return {
    user,
    profileUrl: `https://github.com/${user}`,
    repos: repos.map((repo) => {
      const meta = live.get(repo.name);
      return {
        name: repo.name,
        url: meta?.html_url ?? `https://github.com/${user}/${repo.name}`,
        description: { pt: repo.description_pt, en: repo.description_en },
        language: meta?.language ?? null,
        stars: meta?.stargazers_count ?? 0,
        pushedAt: meta?.pushed_at ?? null,
      };
    }),
  };
}
