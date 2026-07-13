# 時空社会御朱印帳 実装仕様書 — Codex向け

理科版「リカ・クエスト」の社会科版。東京書籍「新編 新しい社会」5・6年の全36ノードを、
時空クロニクル×あつ森×桃鉄型の探検ゲームにする。このリポジトリには設計フェーズの
成果物が入っている。ここから先の実装をCodexに依頼する。

## 0. 絶対に守ること（最優先）

1. **静的サイト・ビルド不要**。npm/webpack等は使わない。`index.html`を開けば動く。
2. **本番コードは外部フォント／画像／音声を使わない**。文字はシステムフォント、
   イラストは全てインラインSVG。効果音を入れるならWeb Audio APIのみ。
   （※このリポジトリの`_reference/ui-mockup.html`はデザイン検討用にGoogle Fontsを
   読み込んでいるが、これは参考資料であり本番には使わない）
3. **教科書の本文・図版・写真・イラストは転載しない**。設問・解説・キャラのセリフは
   全てオリジナルで作成する。
4. **出題範囲の限定**：`basic`／`advanced`は該当ノードの`subunitName`の範囲内に限定。
   中学範囲の用語・発展トリビアは`extra`のみに出す。
5. **偉人（実在の歴史上の人物）のセリフ・実績紹介はナレーション調のみ**。
   「〜と伝えられている」「〜という業績を残した」のように書き、本人が言って
   いない名言をあたかも発言のように断定しない。
6. **s6_rek11（長く続いた戦争と人々のくらし）だけ演出を変える**。認定キャラとの
   問答は使わず、証言・資料を読み解く「聞き取りチャレンジ」にする。誇張表現や
   過度に生々しい描写は避け、事実ベースで淡々と扱う。
7. **5年・政治ライン・世界路線の「認定キャラ」は全て架空**。実在の人物（現職
   政治家を含む）は絶対に登場させない。

---

## 1. 完成済みファイル（そのまま使う・中身を変更しない）

```
data/lines-data.js          8ライン定義（完成）
data/nodes-data.js          36ノード全件のメタデータ（完成）
data/kakera-data.js         毎問報酬の共通アイテムプール、8ライン分（完成）
data/meibutsu-data.js       名産品データ：デモ4ノード分のみ実装済み
data/ijin-data.js           偉人データ：デモ1件（織田信長）のみ実装済み
data/chara-data.js          架空キャラデータ：デモ4件のみ実装済み
data/item-data.js           実用アイテムデータ：サンプル4件実装済み
data/questions/s5_koku01.js 見本：通常ノード（分岐なし）
data/questions/s5_koku03.js 見本：分岐ノード（輪中／高原）
data/questions/s6_rek06.js  見本：歴史ノード（偉人あり・信長秀吉家康）
data/questions/s6_rek11.js  見本：聞き取りチャレンジノード（戦争単元）
```

`data/nodes-data.js`が全体の設計図。各ノードの`meibutsuIds`／`ijinId`／`charaId`が、
対応するデータファイルにまだ存在しないIDを参照している場合、それがCodexの
追加作業対象（＝残り32ノード分）。

---

## 2. ゲームデザインのルール

- **世界観**：御朱印帳（神社仏閣を巡って集めるスタンプ帳文化）をモチーフにした
  「時空を旅する社会科クエスト」。背景は時空の宇宙、画面は和紙の手帳。
- **「倒す」ではなく「認められる」**：発展レベルの challenge は「認定チャレンジ」。
  クリア＝偉人／案内キャラから朱色のはんこ（スタンプ）をもらう演出。
- **難易度3段階**：`basic`(探検) → `advanced`(認定チャレンジ、またはs6_rek11のみ
  聞き取りチャレンジ) → `extra`(もっと知りたい！チャレンジ、中学生範囲)。
- **報酬は2層構造**：
  1. **毎問報酬**：正解・不正解にかかわらず「たびのかけら」+1。正解時はさらに
     EXP加算＋30%の確率でそのノードが属するラインの`KAKERA_COMMON_POOL`から
     ありふれた収蔵品を1つ追加（＝「1問につき1つは何か入手できる」を満たす）
  2. **節目報酬**：`basic`クリアで名産品を1つ確定入手／`advanced`クリアで偉人
     または認定キャラのカードを確定入手／`extra`全問正解でレアアイテム
     （`item-data.js`）が当たることがある
- **8ライン・3つのmapStyle**：
  - `route`（路線図）：5年の5ライン。駅を順につなぐ横のライン
  - `sugoroku`（すごろく）：歴史ライン。政治ラインの終点(s6_sei03クリア)が
    起点になり、s6_rek01〜12を年代順に縦に巡る
  - `world`（世界地図）：世界路線。s6_rek12クリアで開放

---

## 3. データスキーマ

### `data/questions/{nodeId}.js`（分岐なしノード）
```js
window.QUESTION_BANK["s5_koku01"] = {
  basic:    [ /* 目標20問 */ ],
  advanced: [ /* 目標10問 */ ],
  extra:    [ /* 目標15問 */ ]
};
```
分岐ノードは `window.QUESTION_BANK[nodeId][branchId] = {basic, advanced, extra}` の
入れ子構造（`s5_koku03.js`を参照）。

設問オブジェクトの形：
```js
{ type:"mc4", q:"...", choices:["A","B","C","D"], answer:0, explain:"..." }
{ type:"ox",  q:"...", answer:true, explain:"..." }
```

### `data/nodes-data.js`（実装済み・参照専用）
```js
{
  lineId, order, stationName, unitName, subunitName, curriculumRef,
  branch: null | { options: [{branchId,label,meibutsuIds,charaId}, ...] },
  meibutsuIds: [...], charaId: "..."|null, ijinId: "..."|null,
  challengeStyle: "nintei" | "kikitori"
}
```

### `data/meibutsu-data.js`
```js
m_xxx: { name, nodeId, rarity:"normal"|"rare", branchId(分岐ノードのみ), trivia, svgKey }
```

### `data/ijin-data.js`（歴史ラインのみ）
```js
i_xxx: { name, nodeId, era, achievement, svgKey }
```

### `data/chara-data.js`（5年・政治・国際ライン）
```js
c_xxx: { name, role, flavor }
```

### `data/item-data.js`
```js
eq_xxx: { name, effect, rarity:"rare", nodeId, desc }
// effect候補: hintFree, expBoostBig, comboKeep, doubleCrit
```

### セーブデータ：localStorageキー `shakai_quest_save_v1`
```js
{
  player: { name, level, exp, title },
  owned: {
    meibutsu: ["m_xxx", ...], ijin: [...], chara: [...], items: [...],
    kakeraCount: 0,
    commonItems: { "kk_koku_01": 3, ... }   // ID→取得数
  },
  progress: {
    "s5_koku01": { unlocked:true, basicClear:false, advancedClear:false, extraClear:false, branchChosen:null },
    ...36ノード分
  },
  settings: { ruby:true, sound:true }
}
```

---

## 4. Codexへの依頼タスク（優先順）

### タスクA：JSエンジン実装
- `js/save-manager.js`
  - `load()` / `save(data)` / `getDefault()`
  - `addKakera(n)` / `addExp(n)`（レベルは `floor(totalExp/100)+1` 目安）
  - `addCommonItem(kakeraId)`（`owned.commonItems`のカウントを+1）
  - `grantCollectible(type, id)`（type: meibutsu/ijin/chara/items。重複防止）
  - `getNodeProgress(nodeId)` / `setNodeProgress(nodeId, patch)`
  - `chooseBranch(nodeId, branchId)`
  - `isNodeUnlocked(nodeId)`：解放ルールは次項参照
- `js/quiz-engine.js`
  - `start(nodeId, tier, branchId)`：QUESTION_BANKから出題配列を取得して出題開始
  - 各設問回答時：正解/不正解によらず`addKakera(1)`＋トースト表示。正解時は
    `addExp(10)`＋30%抽選で`addCommonItem`
  - tier完了時：`basic`→名産品1つ確定付与／`advanced`→偉人or認定キャラ付与
    （`challengeStyle:"kikitori"`のノードは偉人なしなので史料アイテム扱いでOK）
    ／`extra`全問正解→`item-data.js`からまれにレア付与
  - `challengeStyle`に応じてadvancedタイルのコピー・UIを「認定チャレンジ
    (偉人/キャラの顔つき)」と「聞き取りチャレンジ(資料アイコンのみ、抑えた配色)」
    で出し分ける
- `js/map-renderer.js`：`LINES_DATA`＋`NODES_DATA`＋セーブ進捗から
  route/sugoroku/worldの3スタイルを描画。`QUESTION_BANK[nodeId]`が
  存在しないノードは進捗に関わらず「近日公開」表示に固定
- `js/collection-renderer.js`：meibutsu/ijin/chara/itemsの4カテゴリを
  グリッド表示。未収集はシルエット表示。かけら数・commonItems内訳も表示
- `js/main.js`：初期化、タブ切り替え、画面遷移の統括

**ノード解放ルール**：
- 5年の5ラインは全て最初から選択可。各ライン内は前の駅の`basicClear`で次が解放
- 6年政治ラインは最初から選択可（順に解放）
- s6_sei03の`basicClear`でs6_rek01が解放。以降は歴史すごろくを順に解放
- s6_rek12の`basicClear`でs6_kok01が解放。以降は世界路線を順に解放

### タスクB：`style.css` / `index.html`
`_reference/ui-mockup.html`の配色トークン・御朱印帳＋はんこモチーフ・SVG
アイコンスプライトを土台に、本番用に以下を変更しつつ実装：
- Google Fonts依存を除去（システムフォントに置き換え）
- クイズ回答画面（設問・選択肢ボタン・○×ボタン・正誤フィードバック・
  「＋1 たびのかけら」トースト）を新規に追加
- 分岐ノード用の「どちらを探検する？」選択画面を追加

### タスクC：残り32ノード分のコンテンツ
`nodes-data.js`を見て、未実装の`meibutsuIds`/`ijinId`/`charaId`を
`meibutsu-data.js`/`ijin-data.js`/`chara-data.js`に追加し、対応する
`data/questions/{nodeId}.js`（分岐ノードは`s5_koku03.js`の入れ子形式）を、
4つの見本ファイルと同じ粒度・トーンで作成する（目標 basic20/advanced10/extra15、
実装済み4ノードは見本のため問題数を減らしてあるので合わせなくてよい）。

学習指導要領で例示されている歴史上の人物（卑弥呼・聖徳太子・藤原道長・
源頼朝・足利義満義政・織田信長・豊臣秀吉・徳川家康・杉田玄白・本居宣長・
西郷隆盛・大久保利通・陸奥宗光・東郷平八郎など）を軸に選定すること。

---

## 5. 受け入れ基準

- [ ] `python3 -m http.server`等でindex.htmlを開き、コンソールエラーなく起動する
- [ ] マップ画面で8ライン・36駅すべてが表示され、実装済み4ノードは遊べる状態、
      それ以外は「近日公開」として表示される
- [ ] s5_koku01を最後まで遊ぶと：各問正解でかけらが増え、ときどき共通アイテムを
      入手し、basic/advanced/extraそれぞれのクリアで名産品・偉人or案内キャラ・
      レアアイテム（抽選）が資料館に反映される
- [ ] s5_koku03で「輪中／高原」の分岐選択ができ、選んだルートの問題が出題され、
      再訪時も選んだルートが保持される
- [ ] s6_rek06で認定チャレンジ（信長のカード）が正常に機能する
- [ ] s6_rek11だけ聞き取りチャレンジのUI（偉人カードなし、抑えた配色）になる
- [ ] 資料館タブで収集済み／未収集が正しく出し分けられる
- [ ] リロードしてもlocalStorageからセーブが復元される
