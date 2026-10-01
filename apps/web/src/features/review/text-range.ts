export type TextOffsets = { start: number; end: number };

export function offsetsFromRange(root: Node, range: Range): TextOffsets {
  const prefix = document.createRange();
  prefix.selectNodeContents(root);
  prefix.setEnd(range.startContainer, range.startOffset);
  const start = prefix.toString().length;
  return { start, end: start + range.toString().length };
}

export function rangeFromOffsets(root: Node, { start, end }: TextOffsets): Range | null {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let position = 0;
  let started = false;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = node.textContent?.length ?? 0;
    if (!started && start <= position + length) {
      range.setStart(node, start - position);
      started = true;
    }
    if (started && end <= position + length) {
      range.setEnd(node, end - position);
      return range;
    }
    position += length;
  }
  return null;
}
