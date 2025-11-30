import sqlite3 from "sqlite3";
const { Database } = sqlite3;
import { OpenAI } from "openai";
import Docker from "dockerode";
import simpleGit from "simple-git";

const db = new Database("swarm.db");
const openai = new OpenAI();
const docker = new Docker();
const git = simpleGit();

db.run(`CREATE TABLE IF NOT EXISTS tool_stats (
  tool TEXT,
  pattern TEXT,
  success REAL,
  attempts INTEGER
)`);

// Main evolution loop — runs forever
setInterval(async () => {
  const row: any = await new Promise(resolve => {
    db.get(`
      SELECT tool, pattern, success, attempts
      FROM tool_stats
      WHERE attempts > 12 AND success < 0.32
      ORDER BY success ASC
      LIMIT 1
    `, (err, row) => resolve(row));
  });

  if (!row) return;

  console.log(`\n[RSI] Natural selection targeting: ${row.tool}`);
  console.log(`        pattern: ${row.pattern}`);
  console.log(`        current fitness: ${(row.success*100).toFixed(1)}%`);

  const prompt = `You are an autonomous code surgeon.
Tool "${row.tool}" is failing on input pattern "${row.pattern}" with only ${(row.success*100).toFixed(1)}% success.

Generate ONE minimal patch (≤15 lines) that permanently raises success on this pattern class to ≥60%.

Use only existing files and logic. No new dependencies.

Output ONLY a valid unified diff. Nothing else.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }]
  });

  const patch = completion.choices[0].message.content;

  // Apply & validate in one atomic move
  try {
    await git.raw(['apply', '--whitespace=nowarn'], { input: patch });
    // Replace this line with whatever your actual test command is
    const result = await git.raw(['exec', 'npm test']);
    
    if (result.includes('passing') || result.includes('All tests passed')) {
      await git.add('.');
      await git.commit(`[RSI] Auto-evolved ${row.tool} — fitness ${(row.success*100).toFixed(1)}% → ≥60%`);
      console.log('EVOLUTION SUCCESS — mutation merged');
    } else {
      throw new Error("Tests failed");
    }
  } catch (e) {
    await git.raw(['apply', '--reverse'], { input: patch }).catch(() => {});
    console.log('Mutation rejected — reverted');
  }
}, 75_000);

console.log("[RSI-100] Evolution engine started — watching for weak code...");
