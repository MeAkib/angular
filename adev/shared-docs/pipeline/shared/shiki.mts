/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import ts from 'typescript';
import {HighlighterGeneric, ShikiTransformer} from 'shiki';
import {ApiEntries, getSymbolUrl} from './linking.mjs';

const scanner = ts.createScanner(ts.ScriptTarget.Latest, true);
const LIGHT_THEME = 'github-light';
const DARK_THEME = 'github-dark';

export async function initHighlighter(): Promise<HighlighterGeneric<any, any>> {
  const {createHighlighter} = await import('shiki');
  return await createHighlighter({
    themes: [LIGHT_THEME, DARK_THEME],
    langs: [
      'javascript',
      'typescript',
      'angular-html',
      'angular-ts',
      'shell',
      'html',
      'http',
      'json',
      'jsonc',
      'nginx',
      'markdown',
      'apache',
    ],
  });
}

export function codeToHtml(
  highlighter: HighlighterGeneric<any, any>,
  code: string,
  config: {
    apiEntries?: ApiEntries;
    language?: string;
    highlight?: Set<number>;
    removeWhitespace?: boolean;
  },
): string {
  const html = highlighter.codeToHtml(code, {
    lang: config.language ?? 'text',
    themes: {
      light: LIGHT_THEME,
      dark: DARK_THEME,
    },
    cssVariablePrefix: '--shiki-',
    defaultColor: false,
    transformers: [
      ...(config.removeWhitespace ? [removeWhitespaceTransformer()] : []),
      highlightTransformer(config.highlight),
      linkApiEntriesTransformer(config.apiEntries),
    ],
  });
  return html;
}

/** A custom transformer which will mark all of the provided line numbers in a set as highlighted. */
function highlightTransformer(highlight?: Set<number>): ShikiTransformer {
  return {
    line(node, lineNumber) {
      if (highlight?.has(lineNumber)) {
        this.addClassToHast(node, 'highlighted');
      }
    },
  };
}

/** A custom transformer which removes all of the whitespace between lines of code in the generated output. */
function removeWhitespaceTransformer(): ShikiTransformer {
  return {
    code(code) {
      code.children = code.children.filter(
        (line) => line.type !== 'text' || line.value.trim().length !== 0,
      );
    },
  };
}

/** Matches HTML/template comments, which the TypeScript scanner does not recognize. */
const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/g;

/** A custom transformer which adds a link to local API entries whenever a matching identifier is discovered in the code block. */
function linkApiEntriesTransformer(apiEntries?: ApiEntries): ShikiTransformer {
  if (apiEntries === undefined) {
    return {};
  }
  return {
    preprocess(code, options) {
      options.decorations ??= [];

      // Collect HTML/template comment ranges the TS scanner cannot see.
      const commentRanges: Array<[number, number]> = [];
      let match: RegExpExecArray | null;
      HTML_COMMENT_REGEX.lastIndex = 0;
      while ((match = HTML_COMMENT_REGEX.exec(code)) !== null) {
        commentRanges.push([match.index, match.index + match[0].length]);
      }
      const isInsideHtmlComment = (start: number): boolean =>
        commentRanges.some(([from, to]) => start >= from && start < to);

      scanner.setText(code);
      let token = scanner.scan();

      while (token !== ts.SyntaxKind.EndOfFileToken) {
        if (token === ts.SyntaxKind.Identifier) {
          const tokenStart = scanner.getTokenStart();
          const symbolUrl = getSymbolUrl(scanner.getTokenText(), apiEntries);
          if (symbolUrl !== undefined && !isInsideHtmlComment(tokenStart)) {
            options.decorations.push({
              transform: (el: any) => {
                el.tagName = 'a';
                el.properties['href'] = symbolUrl;
                return el;
              },
              start: tokenStart,
              end: scanner.getTokenEnd(),
            });
          }
        }
        token = scanner.scan();
      }

      return code;
    },
  };
}
