import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  TFile,
} from 'obsidian';

export type Command = {
  label: string;
  value: string;
};

export default class MakeMenu extends EditorSuggest<Command> {
  inCmd = false;
  cmdStartCh = 0;
  file: TFile;
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app);
    this.plugin = plugin;
  }
  resetInfos() {
    this.cmdStartCh = 0;
    this.inCmd = false;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
    _file: TFile
  ): EditorSuggestTriggerInfo {
    const line = editor.getLine(editor.getCursor().line);
    const ch = editor.getCursor().ch;
    const front = line.slice(0, ch);
    const back = line.slice(ch);
    const word = front.split(' ').pop() + back.split(' ')[0];

    if (word.match(/^\./)) {
      console.log(word);
      return {
        start: cursor,
        end: cursor,
        query: word.slice(1),
      };
    } else {
      return null;
    }
  }

  getSuggestions(
    context: EditorSuggestContext
  ): Command[] | Promise<Command[]> {
    return this.plugin.settings.snippets
      .filter((x: any) => x.name.includes(context.query))
      .slice(0, 5);
  }

  renderSuggestion(value: Command, el: HTMLElement): void {
    const div = el.createDiv('mk-slash-item');
    const icon = div.createDiv('mk-slash-icon');
    // icon.innerHTML = makeIconSet[value.icon];
    const title = div.createDiv('mk-slash-title');
    const content = div.createDiv('mk-slash-value');
    content.setText(value.value);
    //@ts-ignore
    title.setText(value.name);
  }

  selectSuggestion(cmd: Command, _evt: MouseEvent | KeyboardEvent): void {
    const pos = this.context.editor.wordAt(this.context.editor.getCursor());
    const cursorPos = this.context.editor.getCursor();
    // this.close();
    const wordStart = pos
      ? { ...pos.from, ch: pos.from.ch - 1 }
      : { ...cursorPos, ch: cursorPos.ch - 1 };
    this.context.editor.replaceRange(cmd.value, wordStart, cursorPos);
    if (this.plugin.settings.placeCursorToBeginning) {
      this.context.editor.setCursor(wordStart);
    }
  }
}
