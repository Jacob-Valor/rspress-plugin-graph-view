export default {
  branches: [
    { name: "main", channel: false },
    { name: "dev", channel: "dev" },
    { name: "next", channel: "next", prerelease: true },
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
    "@semantic-release/npm",
  ],
};
