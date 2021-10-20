import type {
  Loader,
  OnLoadArgs,
  OnResolveArgs,
  PluginBuild,
} from "https://deno.land/x/esbuild@v0.13.8/mod.d.ts";

import { cache } from "https://deno.land/x/cache@0.2.13/mod.ts";

const fetchCache = async (path: string) => {
  const file = await cache(path);
  const text = await Deno.readTextFile(file.path);
  return text;
};

const name = "deno-cache";

const setup = ({ onResolve, onLoad }: PluginBuild) => {
  onResolve({ filter: /^https?:\/\// }, resolveFile);
  onResolve({ filter: /.*/, namespace: "deno-cache" }, resolveUrl);
  onLoad({ filter: /.*/, namespace: "deno-cache" }, loadSource);
};

const resolveFile = ({ path }: OnResolveArgs) => ({
  path: path,
  namespace: "deno-cache",
});

const resolveUrl = ({ path, importer }: OnResolveArgs) => ({
  path: new URL(path, importer).href,
  namespace: "deno-cache",
});

const loadSource = async ({ path }: OnLoadArgs) => {
  const pathUrl = new URL(path);
  let contents = await fetchCache(path);

  const pattern = /\/\/# sourceMappingURL=(\S+)/;
  const match = contents.match(pattern);
  if (match) {
    const url = new URL(match[1], pathUrl);
    const dataurl = await loadMap(url);
    const comment = `//# sourceMappingURL=${dataurl}`;
    contents = contents.replace(pattern, comment);
  }

  const { pathname } = pathUrl;
  const loader = (pathname.match(/\.(js|jsx|ts|tsx|css|json)($|\?)/)?.[1]) as (Loader | undefined);

  return { contents, loader };
};

const loadMap = async (url: URL) => {
  const c = await cache(url.toString());
  const f = await Deno.readFile(c.path);
  const reader = new FileReader();
  return reader.readAsDataURL(new Blob([f]));
};

export default { name, setup };
