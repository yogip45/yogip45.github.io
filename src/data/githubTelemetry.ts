export interface GitHubRepoItem {
  name: string;
  description: string;
  html_url: string;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
  fork: boolean;
}

export interface GitHubTelemetryData {
  username: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  topLanguages: { name: string; pct: number; color: string }[];
  repos: GitHubRepoItem[];
  fetchedAt: string;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Astro: "#ff5a03",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Python: "#3572A5",
  SQL: "#e38c00",
};

export function getLangColor(lang: string | null): string {
  if (!lang) return "#d47633";
  return LANG_COLORS[lang] || "#d47633";
}

export async function fetchGitHubTelemetry(
  username = "yogip45",
): Promise<GitHubTelemetryData> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "yogip45-portfolio-astro",
  };

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(
        `https://api.github.com/users/${username}/repos?sort=pushed&direction=desc&per_page=30`,
        { headers },
      ),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      throw new Error("GitHub API rate limit or network error");
    }

    const user = await userRes.json();
    const rawRepos: any[] = await reposRes.json();

    const nonForks = rawRepos.filter((r) => !r.fork);
    const totalStars = nonForks.reduce(
      (sum, r) => sum + (r.stargazers_count || 0),
      0,
    );

    // Hitung distribusi bahasa pemrograman utama dari repo aktif
    const langCounts: Record<string, number> = {};
    nonForks.forEach((r) => {
      if (r.language) {
        langCounts[r.language] = (langCounts[r.language] || 0) + 1;
      }
    });

    const totalLangRepos =
      Object.values(langCounts).reduce((a, b) => a + b, 0) || 1;
    const topLanguages = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        pct: Math.max(5, Math.round((count / totalLangRepos) * 100)),
        color: getLangColor(name),
      }));

    const repos: GitHubRepoItem[] = nonForks.slice(0, 6).map((r) => ({
      name: r.name,
      description:
        r.description ||
        "Repository without description — inspect source on GitHub.",
      html_url: r.html_url,
      homepage: r.homepage || null,
      language: r.language || null,
      stargazers_count: r.stargazers_count || 0,
      forks_count: r.forks_count || 0,
      pushed_at: r.pushed_at,
      fork: Boolean(r.fork),
    }));

    return {
      username,
      profileUrl: user.html_url || `https://github.com/${username}`,
      publicRepos: user.public_repos ?? nonForks.length,
      followers: user.followers ?? 0,
      totalStars,
      topLanguages,
      repos,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    // Fallback aman jika build offline
    return {
      username,
      profileUrl: `https://github.com/${username}`,
      publicRepos: 12,
      followers: 10,
      totalStars: 5,
      topLanguages: [
        { name: "PHP", pct: 40, color: "#4F5D95" },
        { name: "TypeScript", pct: 25, color: "#3178c6" },
        { name: "Astro", pct: 20, color: "#ff5a03" },
        { name: "JavaScript", pct: 15, color: "#f1e05a" },
      ],
      repos: [
        {
          name: "yogip45.github.io",
          description:
            "Personal portfolio & Last.fm Audio Station built with Astro and Tailwind CSS.",
          html_url: "https://github.com/yogip45/yogip45.github.io",
          homepage: "https://yogip45.github.io",
          language: "Astro",
          stargazers_count: 1,
          forks_count: 0,
          pushed_at: new Date().toISOString(),
          fork: false,
        },
      ],
      fetchedAt: new Date().toISOString(),
    };
  }
}
