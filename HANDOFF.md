# HANDOFF — Degitail Expo

2026-11-01 / Claude Code

## 現状
- 生成AIで作ったアプリを公募で展示するオンライン展示会の試作サイトができた（index.html 1枚）
- 中身はサンプル3作品（仮）。応募・投票ボタンのリンク先は未設定（"#"）

## やったこと
- index.html：作品カード一覧 → クリックで詳細（紹介動画＋「体験する」ボタン）。動画は hover／画面内で自動再生
- rules.md：応募規約・投票ルールの下書き

## 次にやること
- Googleフォーム（応募用・投票用）を作り、index.html の APPLY_URL / VOTE_URL に入れる
- 会期・締切を決める
- GitHub Pages で公開

## 未解決

## 決定事項と理由
- 投票は Googleフォーム：自前実装だと不正対策とサーバーが要るため
- 作品データは index.html 内の APPS 配列に直書き：数十件までなら十分。増えたら JSON 化

---
2026-11-01（2回目） / Claude Code
- デザイン変更：スカイブルー＋黒、角ほぼなし、絵文字なし、メイリオ（style.css に分離）
- 作品データと描画を apps.js に分離（index.html と ranking.html で共用）
- TOP は毎回ランダム順。ranking.html は votes 上位10件のみ。賞の欄は廃止
- 「Degitail」は意図的な綴り（確認済み）
- 次：出展・投票の動機付け案のうち、採用するものをサイトに反映

---
2026-11-01（3回目） / Claude Code
- requirements.md：要件定義（集客重視・承認制・YouTube必須＋任意ループ動画・GitHub Actionsで反映）
- references.md ＋ references/：類似サイト5件のスクショと比較
- 次：requirements.md に沿って第1段階（シート読み込み＋承認欄）を実装

---
2026-11-01（4回目） / Claude Code
## 現状
- フォーム→シート→承認→GitHub Actions→作品ページ の仕組みができた。ダミーCSVでローカル通し試験済み
- 未公開。フォーム・GitHubの設定は SETUP.md の手順待ち

## やったこと
- build.py：シート（またはCSV）を読み、承認済みだけ data.js・w/作品ID.html・media/ を生成。票数は投票シートの「作品ID」を数える
- viewers.js：「○人が見ています」（19時中心の正規分布、σ=4、5〜10人）
- apps.js：カードを作品ページへのリンクに変更（詳細ダイアログは廃止）。作品データは data.js に分離
- .github/workflows/build.yml：毎時＋手動実行
- SETUP.md：フォーム・サービスアカウント・GitHub の設定手順
- 変更前のファイルは _backup_20261101/ に保存

## 次にやること
- SETUP.md に沿ってフォームとGitHubを用意し、apps.js の APPLY_URL を応募フォームのURLにする
- 公開前に、ローカル試験で作った w/ media/ data.js と sample/ を消す（または上げない）

## 未解決
- 掲載を取り消しても w/作品ID.html は残る（手で消す）
- （解決）投票は1人1作品で確定（2026-11-02）

## 決定事項と理由
- 作品IDは タイムスタンプ＋作品名 のハッシュ：作品名が重複しても衝突しない
- 投票フォームには作品IDを事前入力：作品名だと表記ゆれで集計がずれるため
- 変換済み media は作り直さない：毎時の実行を軽くするため

---
2026-11-02 / Claude Code
- 「○人が見ています」：日本時間3:00〜5:59は0人（viewers.js）
- 応募フォームに「投票バトル」（チェックボックス・任意）を追加。チェックした作品だけ投票ボタンが付き、TOP10の対象になる
- 背景：白い数字が縦に流れる演出（bg.js、canvas）。「動きを減らす」設定の閲覧者には出さない
- 投票は当面「1人1作品」で確定（フォームの回答1回制限のまま）
- 変更前のファイルは _backup_20261102/

---
2026-11-02（2回目） / Claude Code
- 試験用の展示作品を、ポートフォリオ（スモビジ\portfolio）の6作品に差し替え（sample/entries.csv）。旧ダミーの出力は _backup_20261102/old_build/ へ移動
- 票数をサムネ・作品ページの右上に表示。読み込み時に0から数え上げる（count.js）
- contest.html：募集・投票 11/2〜11/30、結果発表 12/1、審査は Claude Code：ChatGPT：投票 ＝ 3：3：7、TOP3
- 投票ポイント：1票の重み＝0.5^(掲載からの日数/7)。締切（11/30 23:59）後の票は数えない（build.py の DEADLINE / HALF_LIFE）。TOP10もポイント順、同点は素の票数
- 掲載日はフォームのタイムスタンプで代用（承認までの遅れは考慮していない）
- 未解決：漫画翻訳の動画にONE PIECEの原画（公開前に差し替え判断）。AI採点は手作業（集計スクリプトなし）。プレビュー用ブラウザに接続できず、見た目は未確認

---
2026-11-02（3回目） / Claude Code
- GitHub（degitail/onlineexpo, main）へ初回 push。試験用の展示データ（w/ media/ data.js sample/）も含めて公開（ユーザー判断）
- .gitignore で _backup_*/ と references/（他サイトのスクショ）を除外
- 次：Settings→Pages で公開元を main / (root) に。Secrets 未設定のため、毎時の Actions は失敗する（SETUP.md の設定後に解消）

---
2026-11-03 / Claude Code
- apps.js の APPLY_URL に応募フォームを設定
- 投票を Googleフォームから「サイト内のボタン → Apps Script → スプレッドシート」に変更（ユーザー判断）。gas/vote.gs・vote.js を追加、build.py と Actions から VOTE_FORM/VOTE_ENTRY を削除
- 1人1票は localStorage のみ（別端末・シークレットで再投票できる）。締切後はボタンを無効化
- 次：投票シート作成と Apps Script の公開（SETUP.md 手順2）→ VOTE_API を設定して push

---
2026-11-03（2回目） / Claude Code
- シート読み込みを Sheets API に変更（CSV書き出しは転送先で400）。GCPで Sheets API の有効化が必要。Actions は「Re-run」ではなく「Run workflow」で最新を試すこと（結果待ち）
- flyer/qr.png・qr.svg：サイトのQRコード（segno をインストールして作成）
- ルール：審査比率を 3：3：4（投票40%、投票ポイントに従う）に変更。重みづけの説明はページから削除（build.py の計算は継続、非公開ルール）

---
2026-11-03（3回目） / Claude Code
- 本番の自動反映が成功（試しの応募1件が掲載）。つまずき：①CSV書き出しは400→Sheets APIへ ②変数末尾の改行→strip ③Drive API未有効で画像DLが403→有効化
- build.py は結果と [skip] 理由を Actions の注釈（::notice:: / ::error::）に出す。注釈は公開APIで読める（ログ本体はログイン必須）
- ENTRY_SHEET は「ID:gid」形式で登録済み
- ポートフォリオ6作品は一覧から外れた（media/ w/ は残存）。戻し方は未決定（フォームから応募 or 運営枠の仕組み）

---
2026-11-03（4回目） / Claude Code
- contest.html に賞品を追加：1位5,000円・2位3,000円・3位2,000円（Amazonギフトカード）。連絡はSNSアカウントへ、Amazon商標の注記つき

---
2026-11-04 / Claude Code
- AI講評の仕組み：reviews.csv（作品ID, Claude Code, ChatGPT）を build.py が読み、作品ページに「AI講評」欄を出す。未記入は「講評準備中」。中身は未作成（ユーザー判断で仕組みだけ先行）
- 講評の作り方の案：Claude Code が作品を読んで書く／ChatGPT は Codex CLI（read-only）に依頼

---
2026-11-07 / Claude Code

## 現状
- トップ（index.html）を開くと、作品サムネの丸が漂う最初の画面（intro.js）が出る。タップで一覧へ。同じ訪問中は再表示しない（sessionStorage）

## やったこと
- intro.js 追加、「作品を見る」ボタン削除、残り日数と作品数の表示
- bg.js：スマホのアドレスバーによる高さ変化で数字を描き直さないよう修正

## 次にやること
- 実機スマホでの確認。テスト作品を消すかの判断（丸としても表示される）

## 決定事項と理由
- 最初の画面は別ページにせず index.html に重ねた。各ページのリンク変更が不要なため
- bg.js・intro.js から「動きを減らす」設定の判定を削除。iPhone 13 で止まっていた症状が、削除後の再読み込みで解消（ユーザー確認済み）。設定オフでも止まった理由は未解明で、原因は判定とみられるが断定はできない

---
2026-11-08 / Claude Code
- 見出し・メニュー等をピクセル風フォント DotGothic16（Google Fonts、style.css 先頭で読み込み）に。本文はメイリオ
- index.html：メニュー下に電光掲示板の帯（作品数と締切までの日数、左から右へ40秒で一周）。旧 #status の表示を置き換え
- apps.js：掲載（フォームのタイムスタンプ）から3日以内の作品に金色の NEW 札
- 次：OGP（作品ごとのSNS表示）を入れるか判断待ち
- build.py：SNS欄が「@名前」だけなら Threads（threads.com/@名前）へリンク。以前は X 扱いだった
- build.py：作品説明の中の URL をリンクに（linkify）
- build.py：投票シートの読込行数と集計票数を Actions の注釈（::notice::）に出す。投票の確認はこの注釈と投票シートの行数を突き合わせる
- 投票確認（11/8）：受付の Apps Script は応答OK、毎時の Actions も成功、公開中の票数は全作品0。投票シートは見られなかったので「0票が正しいか」は未確認
- reviews.csv：テスト以外の4作品に AI講評を記入。Claude Code は作品サイトを読んで執筆、ChatGPT は Codex CLI（read-only）に依頼（依頼文と出力は work\_codex_review\）

---
2026-11-09 / Claude Code
- reviews.csv：追加3作品（マイ就活ノート、サッと家計簿、飲みゲー横丁）の AI講評を記入。Claude Code は掲載画像・紹介動画・App Store の説明・飲みゲー横丁のブラウザ版トップを確認して執筆、ChatGPT は Codex CLI に依頼
- 未解決：マイ就活ノートの体験リンクが米国版 App Store の URL で 404（日本版は開ける）。応募者の URL なのでシート側の修正待ち
- 未解決：飲みゲー横丁は説明が5本、ブラウザ版トップは「4つの飲みゲー」

---
2026-11-11 / Claude Code
- テスト作品：応募シートの「掲載」を外した（K2 を FALSE）。w/3106dfad.html と media/3106dfad/ は残る（リンクはなくなる）
- 投票を1人3作品まで（同じ作品には1票）に変更。vote.js の localStorage は "votes"（配列）。旧 "voted" も1票として数える。contest.html・ranking.html の文言も変更
- 投票後に「投票をXで伝える」「投票をThreadsで伝える」ボタンを出す
- 電光掲示板に直近5票（日時と作品名）を流す。build.py が data.js に RECENT を出す
- 未確認：投票が実際に集計されるか（実投票での確認がまだ）

## 2026-11-12（Claude Code）
- やったこと：UI改善6件。一覧の絞り込み（すべて／ブラウザで開ける／投票できる）、カードに「ブラウザで開ける」ラベル、カード説明を2行で切る、作品ページのボタンを画面下に固定、画像タップで全画面拡大（gallery.js、横スワイプで次へ）、作品ページ末尾に「ほかの作品も見る」3件（応募順で隣の作品）
- 決定事項：「ブラウザで開ける」はリンクがありApp Store/Google Play以外なら付く。LPだけの作品にも付く。ゲーム/ツールのジャンル絞り込みはフォームに質問がないため未実装
- 未解決：検証用フォルダ work\_uitest_215911 が残っている（削除は人間が行う）
- 追記：入口の丸を展示中の全作品に（上限20を撤廃）。21作品目から丸を小さくする。画像なしは動画、動画もなければ作品名を表示
- 追記：入口の丸の縁を、8pxの四角がチラつくドット風に（intro.js の edges、canvas 1枚）。四角の大きさは PX、ずれる頻度は .02、色は背景と同じ #9fd8f5（前は #d6effb）
