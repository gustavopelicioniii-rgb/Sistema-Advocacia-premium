import type { UserConfig } from "@commitlint/types";

const config: UserConfig = {
    extends: ["@commitlint/config-conventional"],
    rules: {
        // Permite mensagens até 120 chars (padrão é 100)
        "header-max-length": [2, "always", 120],
        // Tipos permitidos além do convencional
        "type-enum": [
            2,
            "always",
            ["feat", "fix", "docs", "style", "refactor", "perf", "test", "chore", "revert", "ci", "build"],
        ],
    },
};

export default config;
