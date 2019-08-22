workflow "New workflow" {
  on = "push"
  resolves = ["Setup Node.js for use with actions"]
}

action "GitHub Action for npm" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
}

action "Filters for GitHub Actions" {
  uses = "actions/bin/filter@25b7b846d5027eac3315b50a8055ea675e2abd89"
  needs = ["GitHub Action for npm"]
}

action "Setup Node.js for use with actions" {
  uses = "actions/setup-node@d43864199af832cee12602d0a94df40406209cbe"
  needs = ["Filters for GitHub Actions"]
}
