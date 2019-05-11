workflow "Update releases" {
  on = "push"
  resolves = ["github release"]
}

action "npm install" {
  uses = "docker://node:11"
  args = "install"
  runs = "npm"
  secrets = ["GITHUB_TOKEN"]
}

action "github release" {
  uses = "docker://node:11"
  needs = ["npm install"]
  runs = "node"
  args = "src/actions/github-release"
  secrets = ["GITHUB_TOKEN"]
}
