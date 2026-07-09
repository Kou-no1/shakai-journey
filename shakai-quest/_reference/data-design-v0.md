# シャカイ・クエスト（仮）データ設計書 v0.1

ノードマップ（shakai-quest-node-map.md）を実装に落とし込むための、ファイル構成とデータスキーマです。リカ・クエストの技術方針（ビルド不要の静的サイト・外部画像/フォント/音声は使わずインラインSVG＋WebAudioのみ・localStorage保存）をそのまま継承します。

---

## 全体のファイル構成

```
shakai-quest/
├── index.html
├── style.css
├── data/
│   ├── lines-data.js        # 8ライン（国土/食料生産/.../政治/歴史/国際）の定義
│   ├── nodes-data.js        # 36ノードの定義（駅名・対応小単元・分岐・challengeStyle）
│   ├── meibutsu-data.js     # 名産品・アイテムの収蔵品図鑑データ
│   ├── ijin-data.js         # 偉人カードデータ（歴史ラインのみ）
│   ├── chara-data.js        # 認定キャラ（架空）データ（5年・政治・国際ライン）
│   ├── item-data.js         # 実用アイテム（装備相当・効果付き）
│   └── questions/
│       ├── s5_koku01.js
│       ├── s5_koku02.js
│       ├── ...（36ファイル、ノードIDに対応）
│       └── s6_kok02.js
├── js/
│   ├── main.js
│   ├── map-renderer.js      # 路線図/歴史すごろく/世界地図の描画切り替え
│   ├── quiz-engine.js       # 出題・採点・進行フロー
│   ├── collection-renderer.js # 資料館（収蔵品図鑑）画面
│   ├── save-manager.js      # localStorage読み書き
│   └── svg-icons.js         # 収蔵品・キャラのインラインSVG描画関数
└── README.md
```

---

## 1. ライン定義：`lines-data.js`

```js
window.LINES_DATA = [
  { lineId: "s5_koku",   name: "国土ライン",       grade: 5, order: 1, mapStyle: "route" },
  { lineId: "s5_shoku",  name: "食料生産ライン",   grade: 5, order: 2, mapStyle: "route" },
  { lineId: "s5_kogyo",  name: "工業生産ライン",   grade: 5, order: 3, mapStyle: "route" },
  { lineId: "s5_joho",   name: "情報ライン",       grade: 5, order: 4, mapStyle: "route" },
  { lineId: "s5_kankyo", name: "環境ライン",       grade: 5, order: 5, mapStyle: "route" },
  { lineId: "s6_sei",    name: "政治ライン",       grade: 6, order: 1, mapStyle: "start" },
  { lineId: "s6_rek",    name: "歴史すごろく",     grade: 6, order: 2, mapStyle: "sugoroku" },
  { lineId: "s6_kok",    name: "世界路線",         grade: 6, order: 3, mapStyle: "world" }
];
```

`mapStyle`は`map-renderer.js`が読んで描画方式を切り替えるためのフラグです（route＝路線図、sugoroku＝一本道の双六、world＝世界地図、start＝起点駅のみ）。

## 2. ノード定義：`nodes-data.js`

ノード1件の基本形（分岐なし）：

```js
window.NODES_DATA = {
  "s5_koku01": {
    lineId: "s5_koku",
    order: 1,
    stationName: "にっぽんスタート駅",
    unitName: "わたしたちの国土",
    subunitName: "世界の中の国土",
    curriculumRef: "TODO", // 学習指導要領コードを後で正確に埋める
    branch: null,
    meibutsuIds: ["m_chikyugi", "m_nihonchizu"],
    charaId: "c_chizu_annainin",
    ijinId: null,
    challengeStyle: "nintei" // nintei=通常の認定チャレンジ / kikitori=聞き取りチャレンジ
  },
  ...
};
```

分岐ノードの形（例：s5_koku03、低地／高地選択）：

```js
"s5_koku03": {
  lineId: "s5_koku",
  order: 3,
  stationName: "輪中の里／高原の里",
  unitName: "わたしたちの国土",
  subunitName: "低い土地のくらし／高い土地のくらし",
  curriculumRef: "TODO",
  branch: {
    options: [
      { branchId: "wajyu",  label: "輪中の里",  meibutsuIds: ["m_chisui"],      charaId: "c_chisui_meijin" },
      { branchId: "kougen", label: "高原の里",  meibutsuIds: ["m_kougen_yasai"], charaId: "c_kougen_meijin" }
    ]
  },
  challengeStyle: "nintei"
}
```

戦争ユニットの特殊フラグ（s6_rek11）：

```js
"s6_rek11": {
  lineId: "s6_rek",
  order: 11,
  stationName: "戦争と人々のくらしの里",
  unitName: "日本の歴史",
  subunitName: "長く続いた戦争と人々のくらし",
  curriculumRef: "TODO",
  branch: null,
  meibutsuIds: ["m_haikyu_kippu", "m_bokuzukin"],
  charaId: null,
  ijinId: null,
  challengeStyle: "kikitori" // ← ここだけ聞き取りチャレンジ。quiz-engine.jsとcollection-renderer.jsはこのフラグを見て演出を切り替える
}
```

`challengeStyle`はデータ構造自体は変えず演出だけ切り替えるためのフラグなので、`quiz-engine.js`側で「kikitoriのときは"認定"ではなく"聞き取り完了"のメッセージと史料アイテム付与にする」という分岐を1箇所書けば済みます。

## 3. 問題データ：`data/questions/{nodeId}.js`

リカ・クエストと同じ`mc4`/`ox`スキーマをそのまま踏襲。キー名だけ「倒す」語彙を外して`basic`/`advanced`/`extra`にします。

```js
window.QUESTION_BANK["s5_koku01"] = {
  basic: [    // 探検フェーズ：20問想定
    { type: "mc4", q: "...", choices: ["...", "...", "...", "..."], answer: 0, explain: "..." },
    ...
  ],
  advanced: [ // 認定チャレンジ：10問想定
    { type: "ox", q: "...", answer: true, explain: "..." },
    ...
  ],
  extra: [    // もっと知りたい！チャレンジ：15問想定（中学生範囲）
    ...
  ]
};
```

出題範囲のルールはリカ・クエストと同じく、`basic`/`advanced`は該当小単元・指導要領コードの範囲内に限定し、中学範囲の用語や発展トリビアは`extra`のみに出す形を継続します。

## 4. 収蔵品データ

**名産品・アイテム図鑑：`meibutsu-data.js`**（あつ森の博物館寄贈イメージ、見るだけの収蔵枠）

```js
window.MEIBUTSU_DATA = {
  "m_chikyugi": {
    name: "地球儀バッジ",
    nodeId: "s5_koku01",
    rarity: "normal", // normal or rare(extra全問正解時)
    trivia: "...", // 教科書範囲を少し超えた豆知識。興味を引き出す一言
    svgKey: "chikyugi"
  },
  ...
};
```

**偉人カード：`ijin-data.js`**（歴史ラインのみ・実在の人物）

```js
window.IJIN_DATA = {
  "i_himiko": {
    name: "卑弥呼",
    nodeId: "s6_rek01",
    era: "弥生時代",
    achievement: "邪馬台国をまとめ、中国に使いを送ったと伝えられている。", // ナレーション調。断定的な創作セリフにしない
    svgKey: "himiko"
  },
  ...
};
```

**認定キャラ：`chara-data.js`**（5年・政治・国際ライン用、全て架空）

```js
window.CHARA_DATA = {
  "c_chizu_annainin": { name: "地図の案内人", role: "国土ラインの案内役", flavor: "..." },
  ...
};
```

**実用アイテム：`item-data.js`**（装備相当、効果付き）

```js
window.ITEM_DATA = {
  "eq_hint_free": { name: "先生の虫めがね", effect: "hintFree", rarity: "rare", nodeId: "s5_koku02" },
  ...
  // effectキーはリカ・クエストのdoubleCrit/reviveOnce/comboKeep/hintFree/expBoostBigをそのまま流用可能
};
```

## 5. セーブデータ：`shakai_quest_save_v1`

```js
{
  player: { name: "...", level: 1, exp: 0, title: "" }, // titleは称号システム用（認定チャレンジ突破で二つ名獲得）
  owned: {
    meibutsu: ["m_chikyugi", ...],
    ijin: ["i_himiko", ...],
    chara: ["c_chizu_annainin", ...],
    items: ["eq_hint_free", ...]
  },
  progress: {
    "s5_koku01": { unlocked: true, basicClear: true, advancedClear: false, extraClear: false, branchChosen: null },
    "s5_koku03": { unlocked: true, basicClear: true, advancedClear: true, extraClear: false, branchChosen: "wajyu" },
    "s6_rek11":  { unlocked: false, basicClear: false, advancedClear: false, extraClear: false, branchChosen: null }
  },
  settings: { ruby: true, sound: true }
}
```

`progress`のキーは`nodes-data.js`の36ノードIDと1:1対応。分岐ノードは`branchChosen`にプレイヤーが選んだ`branchId`を記録し、以後そのルートの収蔵品・キャラだけ表示します。

---

## ID命名規則まとめ

| 接頭辞 | 用途 | 例 |
|---|---|---|
| `s5_`, `s6_` | ノードID（学年＋分野略号＋連番） | `s5_koku01`, `s6_rek11` |
| `m_` | 名産品・アイテム図鑑ID | `m_chikyugi` |
| `i_` | 偉人カードID | `i_himiko` |
| `c_` | 認定キャラ（架空）ID | `c_chizu_annainin` |
| `eq_` | 実用アイテム（装備）ID | `eq_hint_free` |

## リカ・クエストからの継承／変更点

| 項目 | リカ・クエスト | シャカイ・クエスト |
|---|---|---|
| 静的サイト・ビルド不要・localStorage | 継承 | 継承 |
| 外部画像/フォント/音声不使用（インラインSVG＋WebAudio） | 継承 | 継承 |
| 出題範囲を指導要領コードで限定 | 継承 | 継承 |
| 難易度キー名 | `basic`/`boss`/`bonus` | `basic`/`advanced`/`extra` |
| 収蔵カテゴリ | モンスター図鑑＋装備（2種） | 名産品・アイテム＋偉人＋認定キャラ（実質3〜4種） |
| ボス演出 | 倒す | 認定してもらう（`challengeStyle`で一部"聞き取り"に変更可） |
| セーブキー | `rika_quest_save_v1` | `shakai_quest_save_v1` |
