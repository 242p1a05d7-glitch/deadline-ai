import { GitHubProfile, GitHubRepo } from '../types';

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  htmlUrl: string;
  labels: string[];
  createdAt: string;
}

/**
 * Fetches user profile from GitHub public API
 */
export async function fetchGitHubProfile(username: string): Promise<GitHubProfile> {
  const cleanUsername = username.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/$/, '');
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`);
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`GitHub user "${cleanUsername}" not found.`);
    }
    throw new Error(`GitHub API returned status ${res.status}`);
  }
  
  const data = await res.json();
  return {
    username: data.login,
    avatarUrl: data.avatar_url,
    name: data.name || data.login,
    bio: data.bio || 'No biography provided.',
    htmlUrl: data.html_url,
    publicRepos: data.public_repos
  };
}

/**
 * Fetches user repositories from GitHub public API
 */
export async function fetchGitHubRepos(username: string): Promise<GitHubRepo[]> {
  const cleanUsername = username.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/$/, '');
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=30`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch repositories for "${cleanUsername}".`);
  }
  
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  
  return data.map((item: any) => ({
    name: item.name,
    description: item.description || 'No description provided.',
    htmlUrl: item.html_url,
    openIssuesCount: item.open_issues_count || 0
  }));
}

/**
 * Fetches open issues for a specific repository
 */
export async function fetchGitHubIssues(username: string, repoName: string): Promise<GitHubIssue[]> {
  const cleanUsername = username.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/$/, '');
  const res = await fetch(`https://api.github.com/repos/${encodeURIComponent(cleanUsername)}/${encodeURIComponent(repoName)}/issues?state=open&per_page=30`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch issues for repository "${cleanUsername}/${repoName}".`);
  }
  
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  
  // Filter out Pull Requests (GitHub Issues API returns both, PRs have the 'pull_request' key)
  const issuesOnly = data.filter((item: any) => !item.pull_request);
  
  return issuesOnly.map((item: any) => ({
    id: item.id,
    number: item.number,
    title: item.title,
    body: item.body || '',
    htmlUrl: item.html_url,
    labels: Array.isArray(item.labels) ? item.labels.map((l: any) => l.name) : [],
    createdAt: item.created_at
  }));
}
