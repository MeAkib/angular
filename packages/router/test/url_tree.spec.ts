/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {TestBed} from '@angular/core/testing';
import {exactMatchOptions, Router, subsetMatchOptions} from '../src/router';
import {containsTree, DefaultUrlSerializer, equalParams} from '../src/url_tree';

describe('UrlTree', () => {
  const serializer = new DefaultUrlSerializer();

  describe('DefaultUrlSerializer', () => {
    let serializer: DefaultUrlSerializer;

    beforeEach(() => {
      serializer = new DefaultUrlSerializer();
    });

    it('should parse query parameters', () => {
      const tree = serializer.parse('/path/to?k=v&k/(a;b)=c');
      expect(tree.queryParams).toEqual({
        'k': 'v',
        'k/(a;b)': 'c',
      });
    });

    it('should allow question marks in query param values', () => {
      const tree = serializer.parse('/path/to?first=http://foo/bar?baz=true&second=123');
      expect(tree.queryParams).toEqual({'first': 'http://foo/bar?baz=true', 'second': '123'});
    });

    it('create, serialize, parse, serialize results in same serialized tree with outlet and no primary children', () => {
      const router = TestBed.inject(Router);
      const th = router.createUrlTree(['/', {outlets: {a: ['a'], b: [{outlets: {a: ['b1']}}]}}]);
      const serialized = router.serializeUrl(th);
      const p = router.parseUrl(serialized);
      expect(router.serializeUrl(p)).toBe(serialized);
    });

    it('should work with named outlet with primary and immediate named siblings', () => {
      const router = TestBed.inject(Router);
      const tree = router.createUrlTree([
        {
          outlets: {
            primary: ['Home'],
            app: ['Welcome'],
            dock: [{outlets: {primary: 'left', 1: ['One', {pinned: true}]}}],
          },
        },
      ]);
      const url = tree.toString();
      expect(url).toBe('/Home(app:Welcome//dock:/(left//1:One;pinned=true))');
      const tree2 = serializer.parse(url);
      expect(serializer.serialize(tree2)).toBe(url);
    });
  });

  describe('containsTree', () => {
    describe('exact = true', () => {
      it('should return true when two tree are the same', () => {
        const url = '/one/(one//left:three)(right:four)';
        const t1 = serializer.parse(url);
        const t2 = serializer.parse(url);
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(true);
        expect(containsTree(t2, t1, exactMatchOptions)).toBe(true);
      });

      it('should return true when queryParams are the same', () => {
        const t1 = serializer.parse('/one/two?test=1&page=5');
        const t2 = serializer.parse('/one/two?test=1&page=5');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(true);
      });

      it('should return true when queryParams are the same but with different order', () => {
        const t1 = serializer.parse('/one/two?test=1&page=5');
        const t2 = serializer.parse('/one/two?page=5&test=1');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(true);
      });

      it('should return true when queryParams contains array params that are the same', () => {
        const t1 = serializer.parse('/one/two?test=a&test=b&pages=5&pages=6');
        const t2 = serializer.parse('/one/two?test=a&test=b&pages=5&pages=6');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(true);
      });

      it('should return false when queryParams contains array params but are not the same', () => {
        const t1 = serializer.parse('/one/two?test=a&test=b&pages=5&pages=6');
        const t2 = serializer.parse('/one/two?test=a&test=b&pages=5&pages=7');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return false when queryParams are not the same', () => {
        const t1 = serializer.parse('/one/two?test=1&page=5');
        const t2 = serializer.parse('/one/two?test=1');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(false);
      });

      it('should return false when queryParams are not the same', () => {
        const t1 = serializer.parse('/one/two?test=4&test=4&test=2');
        const t2 = serializer.parse('/one/two?test=4&test=3&test=2');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return true when queryParams are the same in different order', () => {
        const t1 = serializer.parse('/one/two?test=4&test=3&test=2');
        const t2 = serializer.parse('/one/two?test=2&test=3&test=4');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return true when queryParams are the same in different order', () => {
        const t1 = serializer.parse('/one/two?test=4&test=4&test=1');
        const t2 = serializer.parse('/one/two?test=1&test=4&test=4');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return false when containee is missing queryParams', () => {
        const t1 = serializer.parse('/one/two?page=5');
        const t2 = serializer.parse('/one/two');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(false);
      });

      it('should return false when paths are not the same', () => {
        const t1 = serializer.parse('/one/two(right:three)');
        const t2 = serializer.parse('/one/two2(right:three)');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(false);
      });

      it('should return false when container has an extra child', () => {
        const t1 = serializer.parse('/one/two(right:three)');
        const t2 = serializer.parse('/one/two');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(false);
      });

      it('should return false when containee has an extra child', () => {
        const t1 = serializer.parse('/one/two');
        const t2 = serializer.parse('/one/two(right:three)');
        expect(containsTree(t1, t2, exactMatchOptions)).toBe(false);
      });
    });

    describe('exact = false', () => {
      it('should return true when containee is missing a segment', () => {
        const t1 = serializer.parse('/one/(two//left:three)(right:four)');
        const t2 = serializer.parse('/one/(two//left:three)');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return true when containee is missing some paths', () => {
        const t1 = serializer.parse('/one/two/three');
        const t2 = serializer.parse('/one/two');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return true container has its paths split into multiple segments', () => {
        const t1 = serializer.parse('/one/(two//left:three)');
        const t2 = serializer.parse('/one/two');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return false when containee has extra segments', () => {
        const t1 = serializer.parse('/one/two');
        const t2 = serializer.parse('/one/(two//left:three)');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return false containee has segments that the container does not have', () => {
        const t1 = serializer.parse('/one/(two//left:three)');
        const t2 = serializer.parse('/one/(two//right:four)');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return false when containee has extra paths', () => {
        const t1 = serializer.parse('/one');
        const t2 = serializer.parse('/one/two');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return true when queryParams are the same', () => {
        const t1 = serializer.parse('/one/two?test=1&page=5');
        const t2 = serializer.parse('/one/two?test=1&page=5');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return true when container contains containees queryParams', () => {
        const t1 = serializer.parse('/one/two?test=1&u=5');
        const t2 = serializer.parse('/one/two?u=5');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return true when containee does not have queryParams', () => {
        const t1 = serializer.parse('/one/two?page=5');
        const t2 = serializer.parse('/one/two');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return false when containee has but container does not have queryParams', () => {
        const t1 = serializer.parse('/one/two');
        const t2 = serializer.parse('/one/two?page=1');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return true when container has array params but containee does not have', () => {
        const t1 = serializer.parse('/one/two?test=a&test=b&pages=5&pages=6');
        const t2 = serializer.parse('/one/two?test=a&test=b');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(true);
      });

      it('should return false when containee has array params but container does not have', () => {
        const t1 = serializer.parse('/one/two?test=a&test=b');
        const t2 = serializer.parse('/one/two?test=a&test=b&pages=5&pages=6');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return false when containee has different queryParams', () => {
        const t1 = serializer.parse('/one/two?page=5');
        const t2 = serializer.parse('/one/two?test=1');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });

      it('should return false when containee has more queryParams than container', () => {
        const t1 = serializer.parse('/one/two?page=5');
        const t2 = serializer.parse('/one/two?page=5&test=1');
        expect(containsTree(t1, t2, subsetMatchOptions)).toBe(false);
      });
    });

    describe('ignored query params', () => {
      it('should return true when queryParams differ but are ignored', () => {
        const t1 = serializer.parse('/?test=1&page=2');
        const t2 = serializer.parse('/?test=3&page=4&x=y');
        expect(containsTree(t1, t2, {...exactMatchOptions, queryParams: 'ignored'})).toBe(true);
      });
    });

    describe('fragment', () => {
      it('should return false when fragments differ but options require exact match', () => {
        const t1 = serializer.parse('/#fragment1');
        const t2 = serializer.parse('/#fragment2');
        expect(containsTree(t1, t2, {...exactMatchOptions, fragment: 'exact'})).toBe(false);
      });

      it('should return true when fragments differ but options ignore the fragment', () => {
        const t1 = serializer.parse('/#fragment1');
        const t2 = serializer.parse('/#fragment2');
        expect(containsTree(t1, t2, {...exactMatchOptions, fragment: 'ignored'})).toBe(true);
      });
    });

    describe('matrix params', () => {
      describe('ignored', () => {
        it('returns true when matrix params differ but are ignored', () => {
          const t1 = serializer.parse('/a;id=15;foo=foo');
          const t2 = serializer.parse('/a;abc=123');
          expect(containsTree(t1, t2, {...exactMatchOptions, matrixParams: 'ignored'})).toBe(true);
        });
      });

      describe('exact match', () => {
        const matrixParams = 'exact';

        it('returns true when matrix params match', () => {
          const t1 = serializer.parse('/a;id=15;foo=foo');
          const t2 = serializer.parse('/a;id=15;foo=foo');
          expect(containsTree(t1, t2, {...exactMatchOptions, matrixParams})).toBe(true);
        });

        it('returns false when matrix params differ', () => {
          const t1 = serializer.parse('/a;id=15;foo=foo');
          const t2 = serializer.parse('/a;abc=123');
          expect(containsTree(t1, t2, {...exactMatchOptions, matrixParams})).toBe(false);
        });

        it('returns true when matrix params match on the subset of the matched url tree', () => {
          const t1 = serializer.parse('/a;id=15;foo=bar/c');
          const t2 = serializer.parse('/a;id=15;foo=bar');
          expect(containsTree(t1, t2, {...subsetMatchOptions, matrixParams})).toBe(true);
        });

        it(
          'should return true when matrix params match on subset of urlTree match ' +
            'with container paths split into multiple segments',
          () => {
            const t1 = serializer.parse('/one;a=1/(two;b=2//left:three)');
            const t2 = serializer.parse('/one;a=1/two;b=2');
            expect(containsTree(t1, t2, {...subsetMatchOptions, matrixParams})).toBe(true);
          },
        );
      });

      describe('subset match', () => {
        const matrixParams = 'subset';

        it('returns true when matrix params match', () => {
          const t1 = serializer.parse('/a;id=15;foo=foo');
          const t2 = serializer.parse('/a;id=15;foo=foo');
          expect(containsTree(t1, t2, {...exactMatchOptions, matrixParams})).toBe(true);
        });

        it('returns true when container has extra matrix params', () => {
          const t1 = serializer.parse('/a;id=15;foo=foo');
          const t2 = serializer.parse('/a;id=15');
          expect(containsTree(t1, t2, {...exactMatchOptions, matrixParams})).toBe(true);
        });

        it('returns false when matrix params differ', () => {
          const t1 = serializer.parse('/a;id=15;foo=foo');
          const t2 = serializer.parse('/a;abc=123');
          expect(containsTree(t1, t2, {...exactMatchOptions, matrixParams})).toBe(false);
        });

        it('returns true when matrix params match on the subset of the matched url tree', () => {
          const t1 = serializer.parse('/a;id=15;foo=bar/c');
          const t2 = serializer.parse('/a;id=15;foo=bar');
          expect(containsTree(t1, t2, {...subsetMatchOptions, matrixParams})).toBe(true);
        });

        it(
          'should return true when matrix params match on subset of urlTree match ' +
            'with container paths split into multiple segments',
          () => {
            const t1 = serializer.parse('/one;a=1/(two;b=2//left:three)');
            const t2 = serializer.parse('/one;a=1/two');
            expect(containsTree(t1, t2, {...subsetMatchOptions, matrixParams})).toBe(true);
          },
        );
      });
    });

    describe('equalParams with deep equality configuration', () => {
      it('should return true for arrays with same content when deep equality is enabled', () => {
        const a = {tags: ['angular', 'typescript']};
        const b = {tags: ['angular', 'typescript']};
        expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(true);
      });

      it('should handle nested objects with deep equality', () => {
        const a = {filter: {tags: ['a', 'b'], page: 1}};
        const b = {filter: {tags: ['a', 'b'], page: 1}};
        expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(true);
      });

      it('should return false for different nested objects', () => {
        const a = {filter: {tags: ['a', 'b'], page: 1}};
        const b = {filter: {tags: ['a', 'b'], page: 2}};
        expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(false);
      });
    });

    it('should handle null values', () => {
      expect(equalParams({a: null}, {a: null}, {paramsEqualityDepth: 'deep'})).toBe(true);
      expect(equalParams({a: null}, {a: undefined}, {paramsEqualityDepth: 'deep'})).toBe(false);
    });

    it('should handle undefined values', () => {
      expect(equalParams({a: undefined}, {a: undefined}, {paramsEqualityDepth: 'deep'})).toBe(true);
    });

    it('should handle empty arrays', () => {
      expect(equalParams({tags: []}, {tags: []}, {paramsEqualityDepth: 'deep'})).toBe(true);
    });

    it('should handle empty objects', () => {
      expect(equalParams({}, {}, {paramsEqualityDepth: 'deep'})).toBe(true);
      expect(equalParams({data: {}}, {data: {}}, {paramsEqualityDepth: 'deep'})).toBe(true);
    });

    it('should handle arrays with different lengths', () => {
      expect(equalParams({tags: ['a', 'b']}, {tags: ['a']}, {paramsEqualityDepth: 'deep'})).toBe(
        false,
      );
    });

    it('should handle mixed types', () => {
      expect(equalParams({val: 1}, {val: '1'}, {paramsEqualityDepth: 'deep'})).toBe(false);
      expect(equalParams({val: true}, {val: 1}, {paramsEqualityDepth: 'deep'})).toBe(false);
    });

    it('should handle nested arrays', () => {
      const a = {
        data: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      };
      const b = {
        data: [
          ['a', 'b'],
          ['c', 'd'],
        ],
      };
      expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(true);

      const c = {
        data: [
          ['a', 'b'],
          ['c', 'e'],
        ],
      };
      expect(equalParams(a, c, {paramsEqualityDepth: 'deep'})).toBe(false);
    });

    it('should handle arrays with objects', () => {
      const a = {items: [{id: 1}, {id: 2}]};
      const b = {items: [{id: 1}, {id: 2}]};
      expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(true);

      const c = {items: [{id: 1}, {id: 3}]};
      expect(equalParams(a, c, {paramsEqualityDepth: 'deep'})).toBe(false);
    });

    it('should handle deeply nested structures', () => {
      const a = {level1: {level2: {level3: {value: 'deep'}}}};
      const b = {level1: {level2: {level3: {value: 'deep'}}}};
      expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(true);
    });

    it('should handle objects with extra keys', () => {
      const a = {id: '1', name: 'test'};
      const b = {id: '1'};
      expect(equalParams(a, b, {paramsEqualityDepth: 'deep'})).toBe(false);
      expect(equalParams(b, a, {paramsEqualityDepth: 'deep'})).toBe(false);
    });

    it('should handle special number values', () => {
      expect(equalParams({val: NaN}, {val: NaN}, {paramsEqualityDepth: 'deep'})).toBe(false); // NaN !== NaN
      expect(equalParams({val: Infinity}, {val: Infinity}, {paramsEqualityDepth: 'deep'})).toBe(
        true,
      );
      expect(equalParams({val: 0}, {val: -0}, {paramsEqualityDepth: 'deep'})).toBe(true); // 0 === -0
    });

    it('should handle boolean values', () => {
      expect(equalParams({active: true}, {active: true}, {paramsEqualityDepth: 'deep'})).toBe(true);
      expect(equalParams({active: true}, {active: false}, {paramsEqualityDepth: 'deep'})).toBe(
        false,
      );
    });

    it('should handle string values', () => {
      expect(equalParams({name: ''}, {name: ''}, {paramsEqualityDepth: 'deep'})).toBe(true);
      expect(equalParams({name: 'test'}, {name: 'test'}, {paramsEqualityDepth: 'deep'})).toBe(true);
    });

    it('should handle number values', () => {
      expect(equalParams({count: 0}, {count: 0}, {paramsEqualityDepth: 'deep'})).toBe(true);
      expect(equalParams({count: 42}, {count: 42}, {paramsEqualityDepth: 'deep'})).toBe(true);
    });
  });
});
