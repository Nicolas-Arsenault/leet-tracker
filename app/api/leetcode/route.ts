import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
const KNOWN_PATTERNS: Record<string, string> = { Array:"Arrays & Hashing","Hash Table":"Arrays & Hashing","Two Pointers":"Two Pointers","Sliding Window":"Sliding Window",Stack:"Stack","Monotonic Stack":"Stack","Binary Search":"Binary Search","Linked List":"Linked List",Tree:"Trees","Binary Tree":"Trees",Graph:"Graphs","Breadth-First Search":"Graphs","Depth-First Search":"Graphs",Heap:"Heap / Priority Queue","Priority Queue":"Heap / Priority Queue",Backtracking:"Backtracking","Dynamic Programming":"Dynamic Programming",Greedy:"Greedy",Sorting:"Intervals",Math:"Math & Geometry",Geometry:"Math & Geometry","Bit Manipulation":"Bit Manipulation" };
const TAG_PRIORITY = ["Dynamic Programming","Backtracking","Sliding Window","Two Pointers","Binary Search","Monotonic Stack","Stack","Heap","Priority Queue","Linked List","Graph","Tree","Binary Tree","Greedy","Bit Manipulation","Geometry","Math","Hash Table","Array","Sorting"];
async function leetcodeQuery(query: string, variables: Record<string, unknown>) { const response = await fetch("https://leetcode.com/graphql", { method:"POST", headers:{"content-type":"application/json","user-agent":"Studyloop/1.0"}, body:JSON.stringify({query,variables}) }); if (!response.ok) throw new Error("LeetCode did not respond. Try again in a moment."); return response.json(); }
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!username || !/^[\w-]{1,32}$/.test(username)) return NextResponse.json({ error:"Enter a valid LeetCode username." }, { status:400 });
  try {
    const recent = await leetcodeQuery(`query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { title titleSlug timestamp } }`, { username, limit:200 });
    const submissions = recent.data?.recentAcSubmissionList;
    if (!submissions) return NextResponse.json({ error:"Profile not found or has no public accepted submissions." }, { status:404 });
    const unique = [...new Map(submissions.map((item: { titleSlug:string }) => [item.titleSlug,item])).values()] as Array<{title:string;titleSlug:string;timestamp:string}>;
    const details = await Promise.all(unique.slice(0,80).map(async (item) => { try { const data = await leetcodeQuery(`query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { difficulty topicTags { name } } }`, { titleSlug:item.titleSlug }); return data.data?.question ?? {}; } catch { return {}; } }));
    const problems = unique.slice(0,80).map((item,index) => { const tags: Array<{name:string}> = details[index]?.topicTags ?? []; const names = new Set(tags.map((tag) => tag.name)); const bestTag = TAG_PRIORITY.find((tag) => names.has(tag)); const pattern = (bestTag && KNOWN_PATTERNS[bestTag]) || "Arrays & Hashing"; const solvedAt = new Date(Number(item.timestamp)*1000).toISOString(); return { id:`lc-${item.titleSlug}`,title:item.title,slug:item.titleSlug,difficulty:details[index]?.difficulty ?? "Medium",pattern,firstAttempt:false,notes:`Imported from LeetCode · ${tags.slice(0,3).map((tag) => tag.name).join(", ") || "tags unavailable"}`,solvedAt,nextReview:new Date(Date.now()+86_400_000).toISOString(),reviewStage:0,source:"leetcode" }; });
    return NextResponse.json({ username, problems, imported:problems.length });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : "LeetCode import failed." }, { status:502 }); }
}
