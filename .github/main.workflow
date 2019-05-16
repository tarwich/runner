workflow "Update releases" {
  resolves = [
    "github release",
    "Lint",
  ]
  on = "push"
}

action "npm install" {
  uses = "docker://node:8"
  args = "install"
  runs = "npm"
  secrets = ["GITHUB_TOKEN"]
}

action "github release" {
  uses = "docker://node:8"
  needs = ["Lint"]
  runs = "node"
  args = "src/actions/github-release"
  secrets = ["GITHUB_TOKEN"]
}

action "Lint" {
  uses = "docker://node:8"
  needs = ["npm install"]
  runs = "node"
  args = "bin/runner lint"
}
