import { describe, it, expect } from 'vitest';
import { wouldCreateOrgCycle, slugifyAbout } from '../services/aboutCmsService';
import type { AboutOrgNode } from '../types/about';
import { emptyLocalized } from '../types/about';

function node(
  id: string,
  parentId: string | null,
  displayOrder = 0,
): AboutOrgNode {
  return {
    id,
    parentId,
    title: emptyLocalized(id),
    type: 'other',
    active: true,
    isPlaceholder: true,
    status: 'draft',
    displayOrder,
    version: 1,
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  };
}

describe('About CMS hierarchy & slugs', () => {
  it('rejects a node becoming its own parent', () => {
    const nodes = [node('a', null), node('b', 'a')];
    expect(wouldCreateOrgCycle(nodes, 'a', 'a')).toBe(true);
  });

  it('rejects moving a node under its descendant (cycle)', () => {
    const nodes = [node('root', null), node('child', 'root'), node('grand', 'child')];
    expect(wouldCreateOrgCycle(nodes, 'root', 'grand')).toBe(true);
  });

  it('allows moving under a sibling branch', () => {
    const nodes = [
      node('root', null),
      node('a', 'root'),
      node('b', 'root'),
      node('a1', 'a'),
    ];
    expect(wouldCreateOrgCycle(nodes, 'a1', 'b')).toBe(false);
  });

  it('allows attaching to root (null parent)', () => {
    const nodes = [node('a', null), node('b', 'a')];
    expect(wouldCreateOrgCycle(nodes, 'b', null)).toBe(false);
  });

  it('slugifyAbout produces stable URL slugs', () => {
    expect(slugifyAbout('Crop Development Directorate')).toBe(
      'crop-development-directorate',
    );
    expect(slugifyAbout('  Hello!!! World  ')).toBe('hello-world');
  });
});
