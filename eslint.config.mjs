import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";

const paddingBeforeFunctionVariableRule = {
  meta: {
    type: "layout",
    fixable: "whitespace",
    schema: [],
    messages: {
      expectedBlankLine: "Expected blank line before function.",
    },
  },

  create(context) {
    const sourceCode = context.sourceCode;

    return {
      VariableDeclaration(node) {
        const isFunctionVariable = node.declarations.some((declaration) => {
          return (
            declaration.init?.type === "ArrowFunctionExpression" ||
            declaration.init?.type === "FunctionExpression"
          );
        });

        if (!isFunctionVariable) {
          return;
        }

        const parent = node.parent;

        if (parent.type !== "Program" && parent.type !== "BlockStatement") {
          return;
        }

        const statements = parent.body;
        const currentIndex = statements.indexOf(node);

        // เป็น statement แรก ไม่ต้องเว้นบรรทัดก่อน
        if (currentIndex <= 0) {
          return;
        }

        const previousStatement = statements[currentIndex - 1];
        const commentsBefore = sourceCode.getCommentsBefore(node);

        const firstAttachedComment = commentsBefore.find(
          (comment) => node.loc.start.line - comment.loc.end.line <= 1,
        );

        const target = firstAttachedComment ?? node;
        const hasBlankLine =
          target.loc.start.line - previousStatement.loc.end.line >= 2;

        if (hasBlankLine) {
          return;
        }

        context.report({
          node,
          messageId: "expectedBlankLine",

          fix(fixer) {
            return fixer.insertTextBefore(target, "\n");
          },
        });
      },
    };
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    name: "project/general-rules",

    files: ["**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"],

    linterOptions: {
      reportUnusedDisableDirectives: "error", // เตือนเมื่อเขียน eslint-disable แต่ไม่ได้จำเป็นต้องใช้แล้ว
    },
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,

      local: {
        rules: {
          "padding-before-function-variable": paddingBeforeFunctionVariableRule,
        },
      },
    },

    rules: {
      "local/padding-before-function-variable": "error",
      eqeqeq: ["error", "always"], // บังคับใช้ === และ !== แทน == และ !=
      "unused-imports/no-unused-imports": "error", // ลบ import ที่ไม่ได้ใช้

      "simple-import-sort/imports": [
        "error",
        {
          groups: [["^"]],
        },
      ],
      "simple-import-sort/exports": "error",

      "padding-line-between-statements": [
        // เว้นหลัง import
        "error",
        {
          blankLine: "always",
          prev: "import",
          next: "*",
        },
        {
          blankLine: "any",
          prev: "import",
          next: "import",
        },
      ],

      // curly: ["error", "all"],// บังคับใส่ {} แม้ if จะมีเพียงบรรทัดเดียว
      "prefer-const": "error", // ใช้ const เมื่อ variable ไม่ได้ถูก assign ใหม่
      "no-var": "error", // ไม่อนุญาต var
      "no-debugger": "error", // ห้าม debugger หลุดเข้า production

      // อนุญาต console.warn และ console.error // แต่ console.log จะแสดง warning
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],

      "object-shorthand": ["error", "always"], // บังคับใช้ object shorthand
    },
  },

  // กฎที่ใช้เฉพาะ TypeScript
  {
    name: "project/typescript-rules",

    files: ["**/*.{ts,tsx,mts,cts}"],

    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],

      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
