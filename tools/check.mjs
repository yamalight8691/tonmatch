// 静的サイトの検証: node tools/check.mjs
// ビルド工程を持たないプロジェクトなので、代わりに以下を確認する。
//   1. 文字コード（BOMなしUTF-8・文字化けなし）
//   2. index.html のインラインスクリプトの構文
//   3. assets/data.js が index.html の期待する形になっているか
//   4. 検索ロジックが例外を出さず、想定どおりの件数を返すか
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TMP = mkdtempSync(join(tmpdir(), "tonmatch-"));

let fail = 0;
const ok = (m) => console.log("  OK   " + m);
const ng = (m) => { fail++; console.log("  FAIL " + m); };

// ---- 1. 文字コード ---------------------------------------------------------
for (const f of ["index.html", "assets/data.js", "tools/gen-mock.mjs", "tools/serve.mjs"]) {
  const buf = readFileSync(join(ROOT, f));
  if (buf[0] === 0xef) ng(`${f}: BOM 付き`);
  else if (buf.toString("utf8").includes("�")) ng(`${f}: 不正なUTF-8バイト列あり`);
  else ok(`${f}: UTF-8 (BOMなし)`);
}

// ---- 2. インラインスクリプトの構文 ----------------------------------------
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
if (!inline.length) ng("index.html: インラインスクリプトが見つからない");
inline.forEach((code, i) => {
  const tmp = join(TMP, `inline_${i}.js`);
  writeFileSync(tmp, code, "utf8");
  try {
    execFileSync(process.execPath, ["--check", tmp]);
    ok(`index.html inline script #${i + 1}: 構文OK`);
  } catch (e) {
    ng(`index.html inline script #${i + 1}: ${String(e.stderr || e)}`);
  }
});

// ---- 3. data.js のデータ契約 ----------------------------------------------
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(join(ROOT, "assets/data.js"), "utf8"), sandbox);
const { TON_MEMBERS: M, TON_DOMAINS: D } = sandbox.window;

if (!Array.isArray(M) || !Array.isArray(D)) {
  ng("data.js: TON_MEMBERS / TON_DOMAINS が配列でない");
} else {
  ok(`data.js: members=${M.length}, domains=${D.length}`);

  // index.html が参照している項目（詳細画面・カード・登録処理で使う）
  const need = ["id", "name", "grade", "department", "grade_department", "primary", "secondary",
    "interests", "skills", "availability", "experience", "bio", "tags"];
  const bad = M.filter((m) => need.some((k) => m[k] === undefined || m[k] === ""));
  bad.length ? ng(`data.js: 必須項目欠落 ${bad.length}件 (例 id=${bad[0].id})`)
    : ok(`data.js: 全メンバーに必須${need.length}項目あり`);

  const keys = new Set(D.map((d) => d.key));
  const orphan = M.filter((m) => !keys.has(m.primary) || !keys.has(m.secondary));
  orphan.length ? ng(`data.js: 未定義の分野キー参照 ${orphan.length}件`)
    : ok("data.js: primary/secondary は全てDOMAINSに存在");

  const dneed = ["key", "label", "dept", "kw", "ri", "rs"];
  const dbad = D.filter((d) => dneed.some((k) => d[k] === undefined));
  dbad.length ? ng(`data.js: DOMAINS 項目欠落 ${dbad.length}件`)
    : ok("data.js: DOMAINS に理由文用の ri/rs あり");

  new Set(M.map((m) => m.id)).size === M.length ? ok("data.js: id 重複なし") : ng("data.js: id が重複");

  // 一覧画面のフィルタは3部門を決め打ちしているので、それ以外が混ざると表示から漏れる
  const uiDeps = ["開発部", "広報部", "営業部"];
  const stray = [...new Set(M.map((m) => m.department))].filter((d) => !uiDeps.includes(d));
  stray.length ? ng(`data.js: 一覧フィルタに無い部門 ${stray.join("/")}`)
    : ok("data.js: 部門は一覧フィルタの3種のみ");
}

// ---- 4. 検索ロジック -------------------------------------------------------
// index.html のマッチング部分だけを切り出して実行する（画面まわりのDOM依存を避ける）
const logic = inline[0]
  .replace(/^[\s\S]*?\/\* -+ マッチング/m, "/* マッチング")
  .replace(/\/\* -+ 検索実行[\s\S]*$/m, "");
const s2 = { MEMBERS: M, DOMAINS: D, DMAP: Object.fromEntries(D.map((d) => [d.key, d])) };
vm.runInNewContext(logic + "\nglobalThis.__search = search;", s2);

const cases = [
  ["新歓イベントのショート動画を作れる人を探している", true],
  ["アプリのフロントエンドを一緒に触ってくれる1年生がほしい", true],
  ["協賛の提案資料を作り直したいので、資料が得意な人に手伝ってほしい", true],
  ["ｚｚｚｚｚ", false],
];
for (const [text, expectHit] of cases) {
  let r;
  try { r = s2.__search(text); } catch (e) { ng(`search("${text}") が例外: ${e.message}`); continue; }
  if ((r.length > 0) !== expectHit) { ng(`search("${text}"): 期待=${expectHit ? "ヒット" : "0件"} 実際=${r.length}件`); continue; }
  if (r.length > 5) { ng(`search("${text}"): 5件を超えて返却 (${r.length}件)`); continue; }
  const broken = r.find((x) => !x.reason || /undefined|NaN/.test(x.reason));
  if (broken) { ng(`search("${text}"): 理由文が壊れている → ${broken.reason}`); continue; }
  ok(`search("${text.slice(0, 20)}…") → ${r.length}件 / 理由文OK`);
}

// 全分野のキーワードを総当りして、理由文生成で落ちる組み合わせがないか確認する
let crash = 0;
for (const d of D) for (const kw of d.kw) { try { s2.__search(kw); } catch { crash++; } }
crash ? ng(`理由文生成で例外 ${crash}件`)
  : ok(`全分野キーワード総当り (${D.reduce((a, d) => a + d.kw.length, 0)}語) で例外なし`);

console.log(fail ? `\n=== ${fail} FAILED ===` : "\n=== ALL PASSED ===");
process.exit(fail ? 1 : 0);
