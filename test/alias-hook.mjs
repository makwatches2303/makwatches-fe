import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Resolve the `@/` path alias, and extensionless TypeScript imports, for
 * `node --test`.
 *
 * The app compiles through Next, which reads both from tsconfig. Node does
 * neither: it would fail to resolve `@/lib/catalog-feed` on the alias, and
 * again on the missing `.ts`. This hook is the entire build tooling the tests
 * need -- no bundler, no transpiler, no test framework. Node 24 strips the
 * type annotations itself.
 *
 * Used as `node --import ./test/alias-hook.mjs --test ...`.
 */

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = resolvePath(root, "src");

/** Extensions to try, in the order TypeScript itself would. */
const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", "/index.ts", "/index.tsx"];

function withExtension(path) {
  if (existsSync(path)) return path;
  for (const extension of EXTENSIONS) {
    if (existsSync(path + extension)) return path + extension;
  }
  return path;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = withExtension(resolvePath(srcDir, specifier.slice(2)));
      return nextResolve(pathToFileURL(target).href, context);
    }

    // Relative imports between source modules are extensionless too.
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const target = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
      const resolved = withExtension(target);
      if (resolved !== target) {
        return nextResolve(pathToFileURL(resolved).href, context);
      }
    }

    return nextResolve(specifier, context);
  },
});
