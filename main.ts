import { App, Editor, Plugin, PluginSettingTab, Setting } from 'obsidian';

import DotMenu from './DotMenu';

export default class TextSnippets extends Plugin {
  settings: TextSnippetsSettings;

  onInit() {}

  async onload() {
    console.log('Loading EMR plugin');
    await this.loadSettings();

    this.addSettingTab(new TextSnippetsSettingsTab(this.app, this));

    this.registerEditorSuggest(new DotMenu(this.app, this));
    console.log('here');
    this.addCommand({
      id: 'next-field',
      name: 'Next Field',
      callback: () => this.nextField(),
      hotkeys: [
        {
          modifiers: [],
          key: 'f3',
        },
      ],
    });
  }

  async onunload() {
    console.log('Unloading EMR plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
  moveToMatch(fromCursor: boolean) {
    let activeLeaf: any = this.app.workspace.activeLeaf;
    let cm: Editor = activeLeaf.view.sourceMode.cmEditor;
    let val = cm.getValue();
    let offset = 0;
    if (fromCursor) {
      offset = cm.posToOffset(cm.getCursor());
      val = val.slice(offset);
    }
    var match = val.match(/@@@|{.*?}/);
    if (match) {
      cm.setSelection(
        cm.offsetToPos(match.index + offset),
        cm.offsetToPos(match.index + offset + match[0].length)
      );
      return true;
    }
    return false;
  }

  nextField(): boolean {
    if (this.moveToMatch(true)) {
      return true;
    } else {
      return this.moveToMatch(false);
    }
  }
}

interface TextSnippetsSettings {
  snippets_file: string;
  snippets: { name: string; value: string }[];
  placeCursorToBeginning: boolean;
}

const default_snippet = `
:::signature
Thank you,
@@@

:::greeting
Dear @@@,`;

const parse_snippets = (raw: string) =>
  raw
    .replace(/^[\s\n]*|[\s\n]*$/, '')
    .split(':::')
    .slice(1)
    .map((item) => {
      const [name, ...value] = item.split('\n');
      return { name, value: value.join('\n').trim() };
    });

const DEFAULT_SETTINGS: TextSnippetsSettings = {
  snippets_file: default_snippet,
  snippets: parse_snippets(default_snippet),
  placeCursorToBeginning: true,
};

class TextSnippetsSettingsTab extends PluginSettingTab {
  plugin: TextSnippets;

  constructor(app: App, plugin: TextSnippets) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'EMR - Settings' });

    new Setting(containerEl)
      .setName('Dot Phrases')
      .setDesc(
        "Type here your snippets in the following format: ':::title\\nResulting text'. Dot phrases can be triggered with '.'."
      )
      .setClass('text-snippets-class')
      .addTextArea((text) =>
        text
          .setPlaceholder(':::title\nText replacement')
          .setValue(this.plugin.settings.snippets_file)
          .onChange(async (value) => {
            this.plugin.settings.snippets_file = value;
            this.plugin.settings.snippets = parse_snippets(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Cursor to beginning')
      .setDesc(
        'Place cursor to the beginning of the dotphrase after inserting.'
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.placeCursorToBeginning)
          .onChange(async (value) => {
            this.plugin.settings.placeCursorToBeginning =
              !this.plugin.settings.placeCursorToBeginning;
            await this.plugin.saveSettings();
          })
      );

    // new Setting(containerEl)
    //   .setName('Stop Symbol')
    //   .setDesc('Symbol to jump to when command is called.')
    //   .setClass('text-snippets-tabstops')
    //   .addTextArea((text) =>
    //     text
    //       .setPlaceholder('')
    //       .setValue(this.plugin.settings.stopSymbol)
    //       .onChange(async (value) => {
    //         if (value == '') {
    //           value = DEFAULT_SETTINGS.stopSymbol;
    //         }
    //         this.plugin.settings.stopSymbol = value;
    //         await this.plugin.saveSettings();
    //       })
    //   );
  }
}
