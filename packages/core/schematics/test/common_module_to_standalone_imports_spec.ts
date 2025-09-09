/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {normalize, virtualFs} from '@angular-devkit/core';
import {SchematicTestRunner, UnitTestTree} from '@angular-devkit/schematics/testing/index.js';
import {TempScopedNodeJsSyncHost} from '@angular-devkit/core/node/testing';
import {HostTree} from '@angular-devkit/schematics';
import {resolve} from 'path';

describe('NgClass migration', () => {
  let runner: SchematicTestRunner;
  let host: TempScopedNodeJsSyncHost;
  let tree: UnitTestTree;

  function writeFile(filePath: string, contents: string) {
    host.sync.write(normalize(filePath), virtualFs.stringToFileBuffer(contents));
  }

  function runMigration(options?: {path?: string; migrateSpaceSeparatedKey?: boolean}) {
    return runner.runSchematic('common-module-to-standalone-imports', options, tree);
  }

  const collectionJsonPath = resolve('../collection.json');

  beforeEach(() => {
    runner = new SchematicTestRunner('test', collectionJsonPath);
    host = new TempScopedNodeJsSyncHost();
    tree = new UnitTestTree(new HostTree(host));
    writeFile('/tsconfig.json', '{}');
    writeFile(
      '/angular.json',
      JSON.stringify({
        version: 1,
        projects: {t: {root: '', architect: {build: {options: {tsConfig: './tsconfig.json'}}}}},
      }),
    );
  });

  it('should remove CommonModule import when no longer needed', async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
        imports: [CommonModule],
        template: \`
          <div [class.admin]="isAdmin">
            <p>it works</p>
          </div>
        \` })
        export class Cmp {}
      `,
    );

    await runMigration();

    const content = tree.readContent('/app.component.ts');

    expect(content).toContain('[class.admin]="isAdmin"');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
    expect(content).toContain('imports: []');
  });

  it("should replace CommonModule import with NgIf when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
        imports: [CommonModule],
        template: \`
          <div *ngIf="condition">Content to render when condition is true.</div>
        \` })
        export class Cmp {}
      `,
    );
    await runMigration();

    const content = tree.readContent('/app.component.ts');

    expect(content).toContain("import {NgIf} from '@angular/common';");
    expect(content).toContain('imports: [NgIf]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with NgFor when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
        imports: [CommonModule],
        template: \`
          <li *ngFor="let user of users; index as i; first as isFirst">
            {{i}}/{{users.length}}. {{user}} <span *ngIf="isFirst">default</span>
          </li>
        \` })
        export class Cmp {}
      `,
    );
    await runMigration();

    const content = tree.readContent('/app.component.ts');

    expect(content).toContain("import {NgFor} from '@angular/common';");
    expect(content).toContain('imports: [NgFor]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with NgClass when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
          imports: [CommonModule],
          template: \`
            <div [ngClass]="{'admin': isAdmin}">
              <p>{{item}}</p>
            </div>
          \`
        })
        export class Cmp {}
      `,
    );
    await runMigration();
    const content = tree.readContent('/app.component.ts');
    expect(content).toContain("import {NgClass} from '@angular/common';");
    expect(content).toContain('imports: [NgClass]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with NgSwitch when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
          imports: [CommonModule],
          template: \`
            <div [ngSwitch]="switchValue">
              <p *ngSwitchCase="1">Option 1</p>
              <p *ngSwitchCase="2">Option 2</p>
              <p *ngSwitchDefault>Option 3</p>
            </div>
          \`
        })
        export class Cmp {}
      `,
    );
    await runMigration();
    const content = tree.readContent('/app.component.ts');
    expect(content).toContain("import {NgSwitch} from '@angular/common';");
    expect(content).toContain('imports: [NgSwitch]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with NgStyle when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
          imports: [CommonModule],
          template: \`
            <div [ngStyle]="{'color': 'red'}">
              <p>{{item}}</p>
            </div>
          \`
        })
        export class Cmp {}
      `,
    );
    await runMigration();
    const content = tree.readContent('/app.component.ts');
    expect(content).toContain("import {NgStyle} from '@angular/common';");
    expect(content).toContain('imports: [NgStyle]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with NgClass when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
          imports: [CommonModule],
          template: \`
            <div [ngClass]="{'admin': isAdmin}">
              <p>{{item}}</p>
            </div>
          \`
        })
        export class Cmp {}
      `,
    );
    await runMigration();
    const content = tree.readContent('/app.component.ts');
    expect(content).toContain("import {NgClass} from '@angular/common';");
    expect(content).toContain('imports: [NgClass]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with AsyncPipe when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
          imports: [CommonModule],
          template: \`
            <div>{{ value | async }}</div>
          \`
        })
        export class Cmp {}
      })
      `,
    );
    await runMigration();
    const content = tree.readContent('/app.component.ts');
    expect(content).toContain("import {AsyncPipe} from '@angular/common';");
    expect(content).toContain('imports: [AsyncPipe]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });

  it("should replace CommonModule import with JsonPipe when it's used", async () => {
    writeFile(
      '/app.component.ts',
      `
        import {Component} from '@angular/core';
        import {CommonModule} from '@angular/common';
        @Component({
          imports: [CommonModule],
          template: \`
            <div>{{ value | json }}</div>
          \`
        })
        export class Cmp {}
      `,
    );
    await runMigration();
    const content = tree.readContent('/app.component.ts');
    expect(content).toContain("import {JsonPipe} from '@angular/common';");
    expect(content).toContain('imports: [JsonPipe]');
    expect(content).not.toContain("import {CommonModule} from '@angular/common';");
  });
});
