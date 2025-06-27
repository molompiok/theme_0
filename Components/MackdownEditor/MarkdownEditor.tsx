import { JSX, useEffect, useRef, useState } from "react";

import '../MarkdownViewer/_.css'

export function MarkdownEditor2({ value, setValue, error, onBlur }: { onBlur?: (text?:string) => void, value: string, setValue: (value: string) => void, error?: boolean }) {
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null); // ✅ Référence pour ajuster la hauteur
  const [editor, setEditor] = useState<JSX.Element>()
  const [tryCount, setCount] = useState(0)
  const handleChange = () => {

    const instance = editorRef.current?.getInstance();
    const a = instance?.getMarkdown().substring(0, 1000) || " ";
    const v = a.trim();
    v && setValue(v);

    adjustHeight();
  };

  useEffect(() => {
    (async () => {
      await import('@toast-ui/editor/dist/toastui-editor.css');
      const { Editor } = await import('@toast-ui/react-editor');

      setEditor(
        <Editor
          ref={(ref) => {
            editorRef.current = ref
            if (!ref || typeof window === 'undefined') return
            const i = ref.getInstance()
            i.setMarkdown(value || "");
            adjustHeight();
          }}
          onBlur={()=>onBlur?.(editorRef.current.getInstance().getMarkdown().substring(0, 1000) || " ")}
          onKeyup={(e:any) => {
            console.log('-----------------------------',e);
            handleChange()
          }}

          initialValue={value || " "}
          previewStyle="vertical"
          initialEditType="wysiwyg"
          useCommandShortcut={true}

          height="auto" // 🔥 Hauteur auto (sera gérée par CSS & JS)
          // onChange={}
          toolbarItems={[
            ['bold', 'italic', 'strike'],
            // ['hr', 'quote'],
            // ['ul', 'ol', 'task'],
            // ['table', 'link'],
            // ['code', 'codeblock'],
          ]}
        />
      );
    })();
  }, []);

  useEffect(() => {
    const updateValue = () => {
      if (!editorRef.current) {
        if (tryCount < 100) {
          setCount((prev) => prev + 1);
          setTimeout(() => {
            // console.log({tryCount});

            updateValue();
          }, 700);
        } else {
          return
        }
      }
      if (!editorRef.current) return
      const editor = editorRef.current.getInstance();
      // console.log(editor.getMarkdown() !== value, editor.getMarkdown(), value);

      if (editor && editor.getMarkdown() !== value) {
        editor.setMarkdown(value || "");
        adjustHeight(); // 🔥 Ajuster la hauteur au chargement
      }
      adjustHeight();
    }
    updateValue();
    
  }, [value, editorRef]);

  // 📏 Fonction pour ajuster la hauteur de l'éditeur
  const adjustHeight = () => {
    if (!containerRef.current) return;
    if (containerRef.current.dataset.init){
      const content = containerRef.current.querySelector('.ProseMirror.toastui-editor-contents') as HTMLDivElement
      content.blur();
      setTimeout(() => {
        content.blur();
      }, 300);
      containerRef.current.dataset.init = 'init'
      return
    } 
    
    const scroller = containerRef.current.querySelector('.toastui-editor.ww-mode') as HTMLDivElement
    if (scroller) {
      scroller.style.minHeight = '60px'
    }
  };

  if (!editor) return <p>Chargement de l'éditeur...</p>;

  return (
    <div className={'editor ' + (error ? "error" : '')} ref={containerRef} >
      {editor}
    </div>
  );
}
