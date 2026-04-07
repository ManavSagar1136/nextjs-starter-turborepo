import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  codeBlockPlugin,
  codeMirrorPlugin,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  headingsPlugin,
  imagePlugin,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  quotePlugin,
  Separator,
  ShowSandpackInfo,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";

export interface CreatePluginsOptions {
  /** Current markdown content — used for diff view baseline */
  content: string;
  /**
   * Optional async handler for image uploads.
   * Receives a File and must return the uploaded image URL.
   * If omitted, the editor shows a URL-only image insertion dialog.
   */
  onImageUpload?: (file: File) => Promise<string>;
}

export function createPlugins({ content, onImageUpload }: CreatePluginsOptions) {
  return [
    toolbarPlugin({
      toolbarContents: () => (
        <DiffSourceToggleWrapper>
          <ConditionalContents
            options={[
              {
                when: (editor: any) => editor?.editorType === "codeblock",
                contents: () => <ChangeCodeMirrorLanguage />,
              },
              {
                when: (editor: any) => editor?.editorType === "sandpack",
                contents: () => <ShowSandpackInfo />,
              },
              {
                fallback: () => (
                  <div className="flex w-full flex-wrap items-center gap-0.5">
                    <UndoRedo />
                    <Separator />
                    <BoldItalicUnderlineToggles />
                    <BlockTypeSelect />
                    <Separator />
                    <ListsToggle />
                    <Separator />
                    <CodeToggle />
                    <Separator />
                    <CreateLink />
                    <InsertImage />
                    <Separator />
                    <InsertTable />
                    <InsertThematicBreak />
                    <Separator />
                    <InsertCodeBlock />
                  </div>
                ),
              },
            ]}
          />
        </DiffSourceToggleWrapper>
      ),
    }),
    listsPlugin(),
    quotePlugin(),
    headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
    linkPlugin(),
    linkDialogPlugin({ linkAutocompleteSuggestions: [] }),
    imagePlugin({
      ...(onImageUpload ? { imageUploadHandler: onImageUpload } : {}),
      imageAutocompleteSuggestions: [],
    }),
    tablePlugin(),
    thematicBreakPlugin(),
    codeBlockPlugin({ defaultCodeBlockLanguage: "js" }),
    codeMirrorPlugin({
      codeBlockLanguages: {
        js: "JavaScript",
        javascript: "JavaScript",
        css: "CSS",
        txt: "Text",
        text: "Text",
        tsx: "TypeScript (JSX)",
        typescript: "TypeScript",
        jsx: "JavaScript (JSX)",
        json: "JSON",
        html: "HTML",
        mdx: "MDX",
        bash: "Bash",
        sh: "Shell",
        shell: "Shell",
        python: "Python",
        py: "Python",
        java: "Java",
        cpp: "C++",
        c: "C",
        go: "Go",
        rust: "Rust",
        php: "PHP",
        ruby: "Ruby",
        sql: "SQL",
        yaml: "YAML",
        yml: "YAML",
        xml: "XML",
        env: "Environment Variables",
        dockerfile: "Dockerfile",
        markdown: "Markdown",
        md: "Markdown",
        diff: "Diff",
        graphql: "GraphQL",
        gql: "GraphQL",
        vue: "Vue",
        svelte: "Svelte",
        swift: "Swift",
        kotlin: "Kotlin",
        scala: "Scala",
        dart: "Dart",
        elixir: "Elixir",
        powershell: "PowerShell",
        scss: "SCSS",
        sass: "SASS",
        less: "LESS",
        toml: "TOML",
        ini: "INI",
      },
    }),
    diffSourcePlugin({ viewMode: "rich-text", diffMarkdown: content }),
    markdownShortcutPlugin(),
  ];
}
