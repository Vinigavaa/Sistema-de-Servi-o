"use client";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from "@codemirror/lang-sql";
export default async function SqlEditor() {
    return (
        <CodeMirror
            value="SELECT * FROM users;"
            height="800px"
            extensions={[sql()]}
        />
    )
}