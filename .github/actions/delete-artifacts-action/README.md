# Delete Artifatcts Action

## 概要

Organization内に尊くされた特定のArtifact名以外のArtifactsを削除するAction

### 注意

GitHub APIの仕様上、同一のPATでは、APIの呼び出しの上限は、5000回に制限されている。

本、Actionでは、以下のAPIを呼び出すため、リポジトリやArtifact数が増えた場合、対応できない。

- リポジトリ一覧取得
  - 1Organizationごとに最大100件取得可能
- Artifact一覧取得
  - 1リポジトリごとに最大100件取得可能
- Artifact削除
  - 1件ずつ削除

## 利用方法

### Inputs

|変数名|必須|説明|
|:---|:---|:---|
|organization-name|○|Artifactsを削除するOrganization|
|except-artifact-name-list|○|削除除外するArtifact名(≠ファイル名)|

### Secrets

|変数名|説明|
|:---|:---|
|API_SECRET|対象Organizationの全てのリポジトリのRead+Write権限を持つPAT|

### Workflowからの呼び出し例

```yaml
  delete-file:
    runs-on: [linux, self-hosted]
    steps:
      - name: checkout
        uses: actions/checkout@v3
        
      - name: delete artifacts
        uses: ./.github/actions/delete-artifacts-action/
        with:
          organization-name: orgname
          except-artifact-name-list: aaaa,bbb
        env:
          SECRET_API_TOKEN: ${{ secrets.API_TOKEN }}
```

## 編集方法

### 開発環境

- node
  - v16.15.1
- npm
  - 8.11

### ビルド方法

GitHub　Action上では、node_moduleが存在しないため、実行可能な単一ファイルにビルドしておく必要がある。  
尚、buildは、`@vercel/ncc`
を利用している。

```sh
$ npm install
$ npm run build
#　distディレクトリ配下に実行ファイル`index.mjs`が生成される
```
