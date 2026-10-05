import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const KNOWN_PATTERNS: Record<string, string> = {
  Array: "Arrays & Hashing", "Hash Table": "Arrays & Hashing", "Two Pointers": "Two Pointers",
  "Sliding Window": "Sliding Window", Stack: "Stack", "Monotonic Stack": "Stack",
  "Binary Search": "Binary Search", "Linked List": "Linked List", Tree: "Trees", "Binary Tree": "Trees", Trie: "Trees",
  Graph: "Graphs", "Graph Theory": "Graphs", "Breadth-First Search": "Graphs", "Depth-First Search": "Graphs", "Union-Find": "Graphs", "Topological Sort": "Graphs", "Shortest Path": "Graphs",
  Heap: "Heap / Priority Queue", "Priority Queue": "Heap / Priority Queue", Backtracking: "Backtracking",
  "Dynamic Programming": "Dynamic Programming", Greedy: "Greedy", Sorting: "Intervals", "Sweep Line": "Intervals",
  Math: "Math & Geometry", Geometry: "Math & Geometry", "Bit Manipulation": "Bit Manipulation", Bitmask: "Bit Manipulation",
};
const TAG_PRIORITY = ["Dynamic Programming", "Backtracking", "Sliding Window", "Two Pointers", "Binary Search", "Monotonic Stack", "Stack", "Heap", "Priority Queue", "Linked List", "Graph Theory", "Graph", "Union-Find", "Topological Sort", "Shortest Path", "Tree", "Binary Tree", "Trie", "Greedy", "Bit Manipulation", "Bitmask", "Sweep Line", "Geometry", "Math", "Hash Table", "Array", "Sorting"];

type Tag = { name?: string; tagName?: string; problemsSolved?: number };
type SolvedQuestion = { title: string; titleSlug: string; difficulty?: string; lastSubmittedAt?: string; timestamp?: string; topicTags?: Tag[] };
type ProgressPayload = { data?: { userProgressQuestionList?: { totalNum: number; questions: SolvedQuestion[] } } };

async function leetcodeQuery<T>(query: string, variables: Record<string, unknown>, authenticated = false): Promise<T> {
  const session = process.env.LEETCODE_SESSION;
  const csrf = process.env.LEETCODE_CSRF_TOKEN;
  const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "Mozilla/5.0 SolveLoop/1.0", referer: authenticated ? "https://leetcode.com/progress/" : "https://leetcode.com/" };
  if (authenticated && session && csrf) { headers.cookie = `LEETCODE_SESSION=${session}; csrftoken=${csrf}`; headers["x-csrftoken"] = csrf; }
  const response = await fetch("https://leetcode.com/graphql/", { method: "POST", headers, body: JSON.stringify({ query, variables }) });
  if (!response.ok) throw new Error("LeetCode did not respond. Try again in a moment.");
  return response.json() as Promise<T>;
}

function patternFor(tags: Tag[]) {
  const names = new Set(tags.map((tag) => tag.name ?? tag.tagName).filter(Boolean));
  const bestTag = TAG_PRIORITY.find((tag) => names.has(tag));
  return (bestTag && KNOWN_PATTERNS[bestTag]) || "Arrays & Hashing";
}

function normalizeQuestion(item: SolvedQuestion, index: number) {
  const solvedAt = item.lastSubmittedAt || (item.timestamp ? new Date(Number(item.timestamp) * 1000).toISOString() : new Date().toISOString());
  const tags = item.topicTags ?? [];
  return {
    id: `lc-${item.titleSlug}-${index}`,
    title: item.title,
    slug: item.titleSlug,
    difficulty: item.difficulty ?? "Medium",
    pattern: patternFor(tags),
    firstAttempt: null,
    notes: `LeetCode import · ${tags.slice(0, 4).map((tag) => tag.name).filter(Boolean).join(", ") || "tags unavailable"}`,
    solvedAt,
    nextReview: new Date(Date.now() + 10 * 365 * 86_400_000).toISOString(),
    reviewStage: 0,
    source: "leetcode",
  };
}

async function fetchFullHistory(username: string) {
  if (!process.env.LEETCODE_SESSION || !process.env.LEETCODE_CSRF_TOKEN) return null;
  const identity = await leetcodeQuery<{ data?: { userStatus?: { isSignedIn?: boolean; username?: string } } }>(`query sessionIdentity { userStatus { isSignedIn username } }`, {}, true);
  const signedIn = identity.data?.userStatus;
  if (!signedIn?.isSignedIn || signedIn.username?.toLowerCase() !== username.toLowerCase()) return null;
  const query = `query userProgressQuestionList($filters: UserProgressQuestionListInput) { userProgressQuestionList(filters: $filters) { totalNum questions { title titleSlug difficulty lastSubmittedAt topicTags { name } } } }`;
  const first = await leetcodeQuery<ProgressPayload>(query, { filters: { questionStatus: "SOLVED", skip: 0, limit: 100 } }, true);
  const result = first.data?.userProgressQuestionList;
  if (!result?.questions) return null;
  const questions: SolvedQuestion[] = [...result.questions];
  for (let skip = 100; skip < result.totalNum; skip += 100) {
    const page = await leetcodeQuery<ProgressPayload>(query, { filters: { questionStatus: "SOLVED", skip, limit: 100 } }, true);
    questions.push(...(page.data?.userProgressQuestionList?.questions ?? []));
  }
  return questions;
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username || !/^[\w-]{1,32}$/.test(username)) return NextResponse.json({ error: "Enter a valid LeetCode username." }, { status: 400 });
  try {
    const profileQuery = `query solveLoopProfile($username: String!) { matchedUser(username: $username) { username submitStatsGlobal { acSubmissionNum { difficulty count } } tagProblemCounts { advanced { tagName problemsSolved } intermediate { tagName problemsSolved } fundamental { tagName problemsSolved } } } }`;
    const profileData = await leetcodeQuery<{ data?: { matchedUser?: { submitStatsGlobal?: { acSubmissionNum?: Array<{ difficulty: string; count: number }> }; tagProblemCounts?: { advanced?: Tag[]; intermediate?: Tag[]; fundamental?: Tag[] } } } }>(profileQuery, { username });
    const matched = profileData.data?.matchedUser;
    if (!matched) return NextResponse.json({ error: "Profile not found or private." }, { status: 404 });
    const counts = matched.submitStatsGlobal?.acSubmissionNum ?? [];
    const tags: Tag[] = [...(matched.tagProblemCounts?.advanced ?? []), ...(matched.tagProblemCounts?.intermediate ?? []), ...(matched.tagProblemCounts?.fundamental ?? [])];
    const fullHistory = await fetchFullHistory(username);
    let questions: SolvedQuestion[];
    const complete = Boolean(fullHistory);
    if (fullHistory) {
      questions = fullHistory;
    } else {
      const recent = await leetcodeQuery<{ data?: { recentAcSubmissionList?: SolvedQuestion[] } }>(`query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { title titleSlug timestamp } }`, { username, limit: 200 });
      const unique = [...new Map((recent.data?.recentAcSubmissionList ?? []).map((item: SolvedQuestion) => [item.titleSlug, item])).values()] as SolvedQuestion[];
      const details = await Promise.all(unique.map(async (item) => { try { const data = await leetcodeQuery<{ data?: { question?: Pick<SolvedQuestion, "difficulty" | "topicTags"> } }>(`query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { difficulty topicTags { name } } }`, { titleSlug: item.titleSlug }); return data.data?.question ?? {}; } catch { return {}; } }));
      questions = unique.map((item, index) => ({ ...item, ...details[index] }));
    }
    const problems = questions.map(normalizeQuestion);
    const totalSolved = counts.find((item: { difficulty: string }) => item.difficulty === "All")?.count ?? problems.length;
    return NextResponse.json({ username, problems, complete, profile: { totalSolved, difficulties: counts.filter((item: { difficulty: string }) => item.difficulty !== "All"), tags, namedProblems: problems.length } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "LeetCode import failed." }, { status: 502 });
  }
}
