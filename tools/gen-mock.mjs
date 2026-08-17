// mock_profiles.csv（96名）と data.js を生成する。
// 要件定義書 5.データ仕様 の列構成に準拠：
// id / name / grade_department / interests / skills / availability / experience / bio
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---- 分野（マッチングの軸になる）----------------------------------------
// kw: 入力文と突き合わせるキーワード
// ri / rs: 理由文に引用する短い句
const DOMAINS = [
  {
    key: "frontend", dept: "開発部", label: "フロントエンド開発",
    kw: ["フロントエンド", "react", "next", "ui実装", "画面", "web", "ウェブ", "サイト", "ホームページ", "typescript", "javascript", "html", "css", "コーディング", "実装"],
    interest: "ReactやNext.jsでの画面実装に興味があり、触り心地のいいUIを自分の手で作れるようになりたいと思っている",
    skill: "React / TypeScript でのフロントエンド実装ができ、Figmaのデザインを画面に落とし込む作業が得意",
    exp: "とんペディア公式サイトのリニューアルでトップページと検索画面の実装を担当した",
    ri: "フロントエンドの画面実装に強い関心がある",
    rs: "React / TypeScript での実装経験がある",
    tags: ["React", "TypeScript", "UI実装"],
  },
  {
    key: "backend", dept: "開発部", label: "バックエンド・API開発",
    kw: ["バックエンド", "api", "サーバー", "サーバ", "db", "データベース", "python", "go", "認証", "設計", "実装"],
    interest: "サーバーサイドの設計に興味があり、APIやデータベースの構造を自分で決められるところまでやってみたい",
    skill: "Python / FastAPI でのAPI実装とPostgreSQLのテーブル設計ができ、認証まわりの実装も一通り触れる",
    exp: "学内向けの出欠管理APIを個人で作り、サークル2団体に導入してもらった",
    ri: "バックエンド・API設計に関心がある",
    rs: "Python / FastAPI と DB設計の実装経験がある",
    tags: ["Python", "API", "DB設計"],
  },
  {
    key: "mobile", dept: "開発部", label: "モバイルアプリ開発",
    kw: ["アプリ", "モバイル", "ios", "android", "スマホ", "スマートフォン", "flutter", "swift"],
    interest: "スマホアプリの開発に興味があり、とんペディアの活動をアプリから見られる状態にしたいと考えている",
    skill: "Flutterでのクロスプラットフォーム開発ができ、実機での動作確認とストア申請の手順も把握している",
    exp: "個人開発の学習記録アプリをGoogle Playに公開し、200ダウンロードまで伸ばした",
    ri: "スマホアプリ開発に関心がある",
    rs: "Flutterでのアプリ開発と公開の経験がある",
    tags: ["Flutter", "iOS/Android", "個人開発"],
  },
  {
    key: "data", dept: "開発部", label: "データ分析・機械学習",
    kw: ["データ", "分析", "統計", "機械学習", "ai", "可視化", "グラフ", "アンケート", "集計", "ログ", "レコメンド"],
    interest: "データ分析と機械学習に興味があり、団体に溜まっているアンケートやログを意思決定に使える形にしたい",
    skill: "pandasでの集計とmatplotlibでの可視化ができ、簡単なレコメンドモデルの実装まで手を動かせる",
    exp: "新歓アンケート400件を分析し、参加率が伸びる導線を特定して広報部に共有した",
    ri: "データ分析・可視化に強い関心がある",
    rs: "pandasでの集計と可視化ができる",
    tags: ["データ分析", "Python", "可視化"],
  },
  {
    key: "infra", dept: "開発部", label: "インフラ・自動化",
    kw: ["自動化", "インフラ", "デプロイ", "ci", "docker", "gas", "bot", "スクリプト", "効率化", "運用", "サーバー"],
    interest: "定型作業の自動化に興味があり、手作業で回している運用をスクリプトに置き換えることに楽しさを感じている",
    skill: "GAS / Python でのバッチ処理とDiscord botの実装ができ、GitHub Actionsでのデプロイ自動化も設定できる",
    exp: "出席確認をDiscord botに置き換え、毎週30分かかっていた集計作業をゼロにした",
    ri: "作業の自動化・効率化に関心がある",
    rs: "GAS / bot / CI での自動化を実装した経験がある",
    tags: ["自動化", "Discord bot", "GAS"],
  },
  {
    key: "hardware", dept: "開発部", label: "電子工作・ハードウェア",
    kw: ["電子工作", "ハード", "ハードウェア", "arduino", "raspberry", "ラズパイ", "回路", "3d", "modeling", "モデリング", "工作", "センサー"],
    interest: "電子工作とハードウェアに興味があり、展示で人が足を止めるような物理的に動くものを作りたいと思っている",
    skill: "ArduinoとRaspberry Piでのセンサー制御ができ、3Dプリンタでの筐体設計も自分で回せる",
    exp: "学祭展示でセンサー連動の来場者カウンターを製作し、2日間で700人分の計測を回した",
    ri: "電子工作・ハードウェア制作に関心がある",
    rs: "Arduino / Raspberry Pi での制作経験がある",
    tags: ["Arduino", "電子工作", "3Dプリンタ"],
  },
  {
    key: "game", dept: "開発部", label: "ゲーム制作",
    kw: ["ゲーム", "unity", "インタラクティブ", "体験", "展示", "企画", "演出"],
    interest: "ゲーム制作に興味があり、来場者がその場で遊べるインタラクティブな体験を作ることに関心が強い",
    skill: "Unityでの2Dゲーム制作ができ、企画から操作感の調整までを一人で通せる",
    exp: "学祭向けのミニゲームを2週間で制作し、当日150人にプレイしてもらった",
    ri: "ゲーム・体験型コンテンツの制作に関心がある",
    rs: "Unityでのゲーム制作を完遂した経験がある",
    tags: ["Unity", "ゲーム制作", "企画"],
  },
  {
    key: "design", dept: "広報部", label: "デザイン・Figma",
    kw: ["デザイン", "figma", "ui", "ux", "バナー", "ロゴ", "見た目", "配色", "スライド", "資料", "画像"],
    interest: "UIデザインとブランディングに興味があり、Figmaで団体全体の見た目を揃えることに取り組んでみたい",
    skill: "Figmaでの画面設計とバナー制作ができ、Illustratorでロゴやアイコンも作れる",
    exp: "新歓ポスターとLPのデザインを一人で担当し、応募数を前年比1.6倍にした",
    ri: "デザイン・Figmaでの制作に強い関心がある",
    rs: "Figma / Illustrator での制作物を仕上げた経験がある",
    tags: ["Figma", "デザイン", "Illustrator"],
  },
  {
    key: "movie", dept: "広報部", label: "動画編集・映像",
    kw: ["動画", "映像", "編集", "premiere", "aftereffects", "youtube", "リール", "撮影", "ショート", "pv"],
    interest: "動画編集に興味があり、イベントの熱量がそのまま伝わるショート動画を作れるようになりたいと思っている",
    skill: "Premiere Proでのカット編集とテロップ入れができ、After Effectsで簡単なモーションも付けられる",
    exp: "新歓PVを制作しX（旧Twitter）で1.2万再生、説明会の申込導線として機能した",
    ri: "動画編集・映像制作に強い関心がある",
    rs: "Premiere Pro / After Effects での編集経験がある",
    tags: ["動画編集", "Premiere Pro", "撮影"],
  },
  {
    key: "sns", dept: "広報部", label: "SNS運用・広報",
    kw: ["sns", "広報", "twitter", "x", "instagram", "インスタ", "発信", "宣伝", "集客", "拡散", "投稿", "認知"],
    interest: "SNS運用に興味があり、投稿の反応を見ながら伸びる型を見つけていく作業に面白さを感じている",
    skill: "X / Instagram の運用設計ができ、投稿カレンダーの作成とインサイトを見た改善が回せる",
    exp: "公式Instagramを半年運用し、フォロワーを320人から980人まで伸ばした",
    ri: "SNS運用・広報に強い関心がある",
    rs: "X / Instagram の運用と数値改善の実績がある",
    tags: ["SNS運用", "Instagram", "広報"],
  },
  {
    key: "writing", dept: "広報部", label: "ライティング・記事",
    kw: ["記事", "ライティング", "文章", "note", "インタビュー", "取材", "原稿", "レポート", "議事録", "まとめ"],
    interest: "文章を書くことに興味があり、人の話を聞いて読み物として残すインタビュー記事に取り組んでみたい",
    skill: "取材から記事執筆までを一人で回せ、note向けの構成づくりと校正が得意",
    exp: "OB訪問記事を8本執筆し、団体noteの月間PVを3倍にした",
    ri: "ライティング・取材に強い関心がある",
    rs: "取材から執筆までを完遂した経験がある",
    tags: ["ライティング", "取材", "note"],
  },
  {
    key: "photo", dept: "広報部", label: "写真・撮影",
    kw: ["写真", "撮影", "カメラ", "レタッチ", "記録", "プロフィール画像", "素材"],
    interest: "写真撮影に興味があり、イベントの記録写真をそのまま広報素材として使える品質で残したいと思っている",
    skill: "一眼レフでのイベント撮影とLightroomでのレタッチができ、当日中の納品も対応できる",
    exp: "納涼会と学祭の記録撮影を担当し、400枚を選定・レタッチして共有アルバムにまとめた",
    ri: "写真撮影・レタッチに関心がある",
    rs: "一眼レフでの撮影とレタッチの経験がある",
    tags: ["写真", "撮影", "Lightroom"],
  },
  {
    key: "event", dept: "広報部", label: "イベント企画・運営",
    kw: ["イベント", "企画", "運営", "新歓", "交流", "懇親", "学祭", "ワークショップ", "勉強会", "司会", "進行"],
    interest: "イベント企画に興味があり、初対面同士でも自然に話が始まる場の設計を考えることに関心がある",
    skill: "イベントの企画立案と当日進行ができ、タイムテーブル作成と会場手配まで一人で押さえられる",
    exp: "新歓イベントを3回運営し、延べ180人の集客と当日運営を回した",
    ri: "イベント企画・運営に強い関心がある",
    rs: "イベントの企画から当日運営までを回した経験がある",
    tags: ["イベント企画", "運営", "司会"],
  },
  {
    key: "sales", dept: "営業部", label: "企業営業・商談",
    kw: ["営業", "商談", "企業", "アポ", "テレアポ", "顧客", "案件", "提携", "交渉", "法人"],
    interest: "企業営業に興味があり、社会人と直接話しながら案件を前に進める経験を数多く積みたいと思っている",
    skill: "アポ獲得から商談・クロージングまで一通り経験があり、メール文面の作成と日程調整が速い",
    exp: "地元企業12社にアプローチし、3社との連携イベント開催まで漕ぎ着けた",
    ri: "企業営業・商談に強い関心がある",
    rs: "アポ獲得から商談までの実務経験がある",
    tags: ["営業", "商談", "企業連携"],
  },
  {
    key: "deck", dept: "営業部", label: "提案資料・スライド作成",
    kw: ["資料", "スライド", "提案", "パワポ", "powerpoint", "プレゼン", "発表", "説明", "企画書", "デッキ"],
    interest: "提案資料の作成に興味があり、相手が3分で判断できる構成に落とし込む作業に手応えを感じている",
    skill: "PowerPoint / Googleスライドでの提案資料作成ができ、数字を使った説得の組み立てが得意",
    exp: "協賛提案資料を作り直し、返信率を2割から5割まで引き上げた",
    ri: "提案資料・スライド作成に強い関心がある",
    rs: "提案資料を作り込んで成果を出した経験がある",
    tags: ["資料作成", "プレゼン", "提案"],
  },
  {
    key: "obog", dept: "営業部", label: "OB・OG開拓／リレーション",
    kw: ["ob", "og", "卒業生", "社会人", "人脈", "紹介", "つながり", "ネットワーク", "相談", "メンター"],
    interest: "OB・OGとの接点づくりに興味があり、卒業生の知見を現役メンバーが引ける状態にしたいと考えている",
    skill: "OB・OGへの連絡と関係維持ができ、面談の設定から議事メモの共有までを型にして回せる",
    exp: "卒業生15名の連絡先リストを整備し、月1回のOB相談会を立ち上げた",
    ri: "OB・OG開拓や人のつながり作りに関心がある",
    rs: "卒業生との関係構築を仕組み化した経験がある",
    tags: ["OB・OG", "人脈", "調整"],
  },
  {
    key: "sponsor", dept: "営業部", label: "協賛・スポンサー獲得",
    kw: ["協賛", "スポンサー", "資金", "予算", "収益", "マネタイズ", "会計", "支援"],
    interest: "協賛獲得に興味があり、団体の活動資金を自分たちで作れる状態にすることに関心が強い",
    skill: "協賛メニューの設計と見積もり作成ができ、獲得後の実施報告までフォローできる",
    exp: "学祭企画で協賛4社・合計28万円を獲得し、実施レポートの提出まで担当した",
    ri: "協賛・スポンサー獲得に強い関心がある",
    rs: "協賛獲得と実施報告までを担当した経験がある",
    tags: ["協賛", "資金調達", "見積"],
  },
  {
    key: "english", dept: "営業部", label: "英語対応・海外連携",
    kw: ["英語", "海外", "留学", "国際", "翻訳", "english", "グローバル", "外国"],
    interest: "英語を使う仕事に興味があり、海外の学生団体や留学生との連携を自分が窓口になって進めたいと思っている",
    skill: "TOEIC900点相当の英語でのメール・会議対応ができ、資料の英訳とその場での通訳もこなせる",
    exp: "留学生向け説明会の英語資料を作成し、当日の進行も英語で担当した",
    ri: "英語・海外連携に強い関心がある",
    rs: "英語での資料作成・対応の経験がある",
    tags: ["英語", "国際交流", "翻訳"],
  },
];

// 部門ごとの人数（要件：開発部35 / 広報部33 / 営業部28）
const DEPT_PLAN = [
  { dept: "開発部", count: 35 },
  { dept: "広報部", count: 33 },
  { dept: "営業部", count: 28 },
];

const GRADES = ["1年", "2年", "3年", "4年", "M1"];

const AVAILABILITY = [
  "平日夜と土日は動ける。週10時間程度なら安定して確保できる。急ぎの相談はDiscordのDMが一番早い。",
  "月火木の夕方以降が空いている。週5〜8時間が目安で、テスト期間の2週間は稼働を落としたい。",
  "土日中心で動ける。平日は講義と実験で埋まっているため、まとまった作業は週末にやることが多い。",
  "平日昼の空きコマと水曜午後に時間が取れる。短いタスクなら当日中に返せることが多い。",
  "週15時間程度まで対応できる。長期のタスクより、期限が切られた単発の依頼のほうが動きやすい。",
  "現在はバイトが週3のため稼働は控えめ。週5時間程度から始められる内容だと引き受けやすい。",
  "夏休み中は平日も含めてフルで動ける。学期中は週8時間ほどが現実的な上限。",
  "オンラインでの作業が中心。ミーティングは20時以降だと参加しやすく、日中は返信が遅くなりがち。",
];

const BIO = [
  "手を動かしながら考えるタイプ。分からないことは早めに人に聞き、抱え込まないようにしている。",
  "頼まれごとは断らない性格。まず引き受けてから調べるので、初挑戦のタスクでも声をかけてほしい。",
  "細かい作業を丁寧に詰めるのが好き。締め切りは守るほうで、進捗はこまめに共有する。",
  "人前で話すのが得意。初対面の相手とも臆せず話せるので、外部との窓口役はよく任される。",
  "計画を立ててから進めたい派。仕様がはっきりしているタスクだと力を発揮しやすい。",
  "アイデア出しの場が好き。企画の立ち上げ段階から関わりたいと思っている。",
  "裏方の作業を苦にしない。目立つ役割より、仕組みを整えるほうにやりがいを感じる。",
  "とにかく量をこなして覚えるタイプ。フィードバックは遠慮なくもらえたほうが助かる。",
  "他学部・他部門の人と話すのが好き。部門をまたいだ企画には積極的に混ざりたい。",
  "静かに集中する時間を大事にしている。まとまった作業を任せてもらえると成果が出しやすい。",
];

const SEI = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡辺", "山本", "中村", "小林", "加藤", "吉田", "山田", "佐々木", "山口", "松本", "井上", "木村", "林", "斎藤", "清水", "山崎", "阿部", "森", "池田", "橋本", "石川", "前田", "藤田", "後藤", "岡田", "長谷川", "村上"];
const MEI = ["蓮", "陽菜", "湊", "結衣", "悠真", "咲良", "大翔", "美咲", "颯太", "葵", "陽斗", "凛", "樹", "莉子", "翔", "紬", "健太", "彩香", "拓海", "菜月", "涼介", "千尋", "直樹", "愛梨", "駿", "沙織", "亮", "遥", "翼", "真央", "諒", "花音"];

function name(i) {
  return `${SEI[i % 32]} ${MEI[(i % 32 + Math.floor(i / 32) * 11) % 32]}`;
}

// ---- 96名を組み立てる -----------------------------------------------------
const members = [];
let id = 0;

for (const { dept, count } of DEPT_PLAN) {
  const own = DOMAINS.filter((d) => d.dept === dept);
  const others = DOMAINS.filter((d) => d.dept !== dept);
  for (let n = 0; n < count; n++) {
    const primary = own[n % own.length];
    // 副分野：半数は同部門内、半数は部門をまたぐ（部門横断のマッチを起こすため）
    const secondary = n % 2 === 0
      ? others[(n * 5 + id) % others.length]
      : own[(n + 1 + Math.floor(n / own.length)) % own.length];
    const sub = secondary.key === primary.key
      ? others[(n * 3 + 1) % others.length]
      : secondary;

    const grade = GRADES[(id * 3 + n) % GRADES.length];

    members.push({
      id: id + 1,
      name: name(id),
      grade,
      department: dept,
      grade_department: `${grade}・${dept}`,
      primary: primary.key,
      secondary: sub.key,
      interests: `${primary.interest}。また、${sub.interest}。`,
      skills: `${primary.skill}。${sub.skill}。`,
      availability: AVAILABILITY[(id * 7 + n) % AVAILABILITY.length],
      experience: `${primary.exp}。${sub.exp}。`,
      bio: BIO[(id * 5 + n) % BIO.length],
      tags: [...new Set([...primary.tags, ...sub.tags])].slice(0, 4),
    });
    id++;
  }
}

if (members.length !== 96) throw new Error(`人数が96名ではありません: ${members.length}`);
if (new Set(members.map((m) => m.name)).size !== 96) throw new Error("氏名が重複しています");

// ---- CSV（BOM付きUTF-8・CRLF）--------------------------------------------
const COLS = ["id", "name", "grade_department", "interests", "skills", "availability", "experience", "bio"];
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = [COLS.join(","), ...members.map((m) => COLS.map((c) => esc(m[c])).join(","))].join("\r\n");
writeFileSync(join(ROOT, "mock_profiles.csv"), "﻿" + csv + "\r\n", "utf8");

// ---- data.js（file:// でも読めるようscriptタグで読み込む）------------------
const domainsForApp = DOMAINS.map(({ key, label, dept, kw, ri, rs }) => ({ key, label, dept, kw, ri, rs }));
const dataJs = `// 自動生成ファイル。編集する場合は tools/gen-mock.mjs を直してから再生成すること。
window.TON_DOMAINS = ${JSON.stringify(domainsForApp, null, 0)};
window.TON_MEMBERS = ${JSON.stringify(members, null, 0)};
`;
mkdirSync(join(ROOT, "assets"), { recursive: true });
writeFileSync(join(ROOT, "assets", "data.js"), dataJs, "utf8");

// ---- Next.js 側（lib/domains.ts / lib/mockProfiles.ts）---------------------
const APP = process.argv[2];
if (APP) {
  const head = "// このファイルは tools/gen-mock.mjs が生成しています。直接編集しないでください。\n";
  writeFileSync(join(APP, "lib", "domains.ts"),
    head +
    `export type Domain = {\n` +
    `  /** 分野の識別子 */\n  key: string;\n` +
    `  /** 画面に出す分野名 */\n  label: string;\n` +
    `  /** 主に所属する部門 */\n  dept: string;\n` +
    `  /** 入力文と突き合わせるキーワード */\n  kw: string[];\n` +
    `  /** 理由文に使う「興味」側の句 */\n  ri: string;\n` +
    `  /** 理由文に使う「できること」側の句 */\n  rs: string;\n};\n\n` +
    `export const DOMAINS: Domain[] = ${JSON.stringify(domainsForApp, null, 2)};\n\n` +
    `export const DOMAIN_MAP: Record<string, Domain> = Object.fromEntries(\n  DOMAINS.map((d) => [d.key, d]),\n);\n`,
    "utf8");

  const membersForApp = members.map((m) => ({
    id: m.id, name: m.name, grade: m.grade, department: m.department,
    gradeDepartment: m.grade_department, primary: m.primary, secondary: m.secondary,
    interests: m.interests, skills: m.skills, availability: m.availability,
    experience: m.experience, bio: m.bio, tags: m.tags,
  }));
  writeFileSync(join(APP, "lib", "mockProfiles.ts"),
    head +
    `export type Member = {\n` +
    `  id: number;\n  name: string;\n  /** 1年〜M1 */\n  grade: string;\n  /** 開発部・広報部・営業部 */\n  department: string;\n` +
    `  /** 画面表示用の結合値（例：2年・営業部） */\n  gradeDepartment: string;\n` +
    `  /** 主分野のキー（lib/domains.ts） */\n  primary: string;\n  /** 副分野のキー */\n  secondary: string;\n` +
    `  interests: string;\n  skills: string;\n  availability: string;\n  experience: string;\n  bio: string;\n  tags: string[];\n};\n\n` +
    `/** モックデータ96名。実在の人物ではありません。 */\n` +
    `export const MEMBERS: Member[] = ${JSON.stringify(membersForApp, null, 2)};\n`,
    "utf8");
  console.log(`  ${APP}/lib/domains.ts, ${APP}/lib/mockProfiles.ts`);
}

const avg = (k) => Math.round(members.reduce((s, m) => s + m[k].length, 0) / members.length);
console.log(`生成完了: ${members.length}名`);
console.log(`  mock_profiles.csv / assets/data.js`);
console.log(`  平均文字数 interests=${avg("interests")} skills=${avg("skills")} availability=${avg("availability")} experience=${avg("experience")} bio=${avg("bio")}`);
console.log(`  部門: ${DEPT_PLAN.map((d) => `${d.dept}${d.count}`).join(" / ")}`);
