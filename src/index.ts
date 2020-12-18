import babel from "@babel/core";
import { Compiler, Compilation, sources } from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";

const { RawSource } = sources;

export interface Options {
  filename: {
    module: string;
    nomodule: string;
  };
  shippedProposals?: boolean;
  defer?: boolean;
}

const MODERN_BABEL_ENV_PRESET = [
  "@babel/preset-env",
  {
    targets: { esmodules: true },
    useBuiltIns: "entry",
    corejs: "3",
    modules: false,
    shippedProposals: true,
  },
];

const LEGACY_BABEL_ENV_PRESET = [
  "@babel/preset-env",
  {
    targets: { esmodules: false },
    useBuiltIns: "entry",
    corejs: { version: "3", proposals: true },
    modules: false,
    shippedProposals: true,
  },
];

const POLYFILL_FILE_CONTENTS = `
require("regenerator-runtime/runtime");
require("core-js");

if (typeof window.fetch !== "function") require("whatwg-fetch");
`;

const webpackTapOptions = {
  name: "DifferentialPolyfillPlugin",
  stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
};

const defaultOptions: Required<Options> = {
  filename: {
    module: "module-polyfill.js",
    nomodule: "nomodule-polyfill.js",
  },
  shippedProposals: true,
  defer: true,
};

export class DifferentialPolyfillPlugin {
  options: Required<Options>;

  constructor(options: Options = defaultOptions) {
    this.options = {
      ...defaultOptions,
      ...options,
      filename: {
        ...defaultOptions.filename,
        ...options?.filename,
      },
    };
  }

  apply(compiler: Compiler) {
    const {
      filename: { nomodule: nomoduleName, module: moduleName },
      defer = true,
    } = this.options;

    compiler.hooks.compilation.tap("DifferentialPolyfillPlugin", compilation => {
      const { alterAssetTags } = HtmlWebpackPlugin.getHooks(compilation);

      alterAssetTags.tap(webpackTapOptions, tags => {
        tags.assetTags.scripts = [
          {
            attributes: { nomodule: true, src: nomoduleName, defer },
            tagName: "script",
            voidTag: false,
          },
          {
            attributes: { type: "module", src: moduleName, defer },
            tagName: "script",
            voidTag: false,
          },
          ...tags.assetTags.scripts,
        ];
        return tags;
      });

      compilation.hooks.processAssets.tapPromise(webpackTapOptions, async sources => {
        try {
          if (!Object.prototype.hasOwnProperty.call(sources, moduleName)) {
            const modulePolyfill = await babel.transformAsync(POLYFILL_FILE_CONTENTS, {
              filename: this.options.filename.module,
              presets: [MODERN_BABEL_ENV_PRESET],
            });
            if (modulePolyfill?.code != null) {
              compilation.emitAsset(moduleName, new RawSource(modulePolyfill?.code));
            } else {
              compilation.logger.error("No module polyfill was emitted");
            }
          }
        } catch (e) {
          compilation.logger.error(e);
        }

        if (!Object.prototype.hasOwnProperty.call(sources, nomoduleName)) {
          try {
            const nomodulePolyfill = await babel.transformAsync(POLYFILL_FILE_CONTENTS, {
              filename: this.options.filename.nomodule,
              presets: [LEGACY_BABEL_ENV_PRESET],
            });
            if (nomodulePolyfill?.code != null) {
              compilation.emitAsset(nomoduleName, new RawSource(nomodulePolyfill?.code));
            } else {
              compilation.logger.error("No nomodule polyfill was emitted");
            }
          } catch (e) {
            compilation.logger.error(e);
          }
        }
      });
    });
  }
}
