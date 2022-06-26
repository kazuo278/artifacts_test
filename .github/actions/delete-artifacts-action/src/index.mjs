import { Octokit } from "octokit";
import * as core from '@actions/core';

// GitHub API Client
const octokit = new Octokit({
  auth: process.env['SECRET_API_TOKEN'],
});
// INPUT: GitHub Organization
const organization = core.getInput('organization-name');
// INPUT: 削除対象外Artifact
const exceptArtifactNameListStr = core.getInput('except-artifact-name-list');
// 削除除外ファイル名の正規表現リスト
const exceptArtifactNameList = exceptArtifactNameListStr.split(',');

// エントリーポイント関数
async function main() {
  for (const repoName of await getRepoList()) {
    deleteArtifacts(repoName, await getTragetArtifacts(repoName));
  }
}

// リポジトリ一覧を取得する関数
const getRepoList = async () => {
  // リポジトリ名一覧の取得
  let repoNameList = [];
  let isLastRepoPage = true;
  let repoPageNum = 1;
  while (isLastRepoPage) {
    let repoList = await octokit.request("GET /users/{username}/repos", {
      username: organization,
      per_page: 100,
      page: repoPageNum,
    });
    // TODO:
    // let repoList = await octokit.request('GET /orgs/{org}/repos', {
    //   org: 'ORG',
    //   per_page: 100,
    //   page: repoPageNum,
    // })
    if (repoList.data.length !== 0) {
      repoList.data.forEach((repo) => {
        repoNameList.push(repo.name);
      });
      repoPageNum++;
    } else {
      isLastRepoPage = false;
    }
  }
  return repoNameList;
};

// リポジトリに紐づく削除対象ArtifactIDリストを返却する関数
const getTragetArtifacts = async (repoName) => {
  // 削除対象のArtifactIdの取得
  let targetArtifactList = [];
  let artifactPageNum = 1;
  let isLastArtifactPage = true;
  while (isLastArtifactPage) {
    let artifactList = await octokit.request(
      "GET /repos/{owner}/{repo}/actions/artifacts",
      {
        owner: organization,
        repo: repoName,
        per_page: 100,
        page: artifactPageNum,
      }
    );
    if (artifactList.data.artifacts.length !== 0) {
      artifactList.data.artifacts
        .filter((artifact) => {
          return isTargetFile(artifact.name);
        })
        .forEach((artifact) => {
          targetArtifactList.push(artifact);
        });
      artifactPageNum++;
    } else {
      isLastArtifactPage = false;
    }
  }
  return targetArtifactList;
};

// 指定されたリポジトリのartifactsを削除する
const deleteArtifacts = async (repoName, targetArtifactList) => {
  //artifactの削除
  for (const artifact of targetArtifactList) {
    await octokit.request(
      "DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}",
      {
        owner: organization,
        repo: repoName,
        artifact_id: artifact.id,
      }
    );
    console.log(
      "DELETED: RepoName = " + repoName + ", artifact = " + artifact.name
    );
  }
};

// artifact名から削除対象か判定する関数
const isTargetFile = (name) => {
  let isTarget = false;
  const found = exceptArtifactNameList.find((exceptName) => {
    return name === exceptName;
  });
  if (found === undefined) {
    isTarget = true;
  }
  return isTarget;
};

main();
