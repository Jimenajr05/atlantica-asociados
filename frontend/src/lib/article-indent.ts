import { Extension, type Command } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articleIndent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const changeIndent = (direction: number): Command => ({ tr, dispatch, editor, commands }) => {
  if (editor.isActive('listItem')) {
    return direction > 0 ? commands.sinkListItem('listItem') : commands.liftListItem('listItem');
  }

  let changed = false;
  tr.doc.nodesBetween(tr.selection.from, tr.selection.to, (node, position) => {
    if (!['paragraph', 'heading'].includes(node.type.name)) return;
    const indent = Math.max(0, Math.min(6, Number(node.attrs.indent || 0) + direction));
    if (indent !== Number(node.attrs.indent || 0)) {
      changed = true;
      if (dispatch) tr.setNodeMarkup(position, undefined, { ...node.attrs, indent });
    }
  });
  return changed;
};

export const ArticleIndent = Extension.create({
  name: 'articleIndent',
  addGlobalAttributes() {
    return [{
      types: ['paragraph', 'heading'],
      attributes: {
        indent: {
          default: 0,
          parseHTML: (element) => Math.max(0, Math.min(6, Math.round((parseFloat(element.style.marginLeft) || 0) / 24))),
          renderHTML: (attributes) => attributes.indent ? { style: `margin-left: ${attributes.indent * 24}px` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      indent: () => changeIndent(1),
      outdent: () => changeIndent(-1),
    };
  },
});
