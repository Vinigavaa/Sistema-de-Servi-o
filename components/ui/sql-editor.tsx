"use client";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from "@codemirror/lang-sql";
import { useState, useEffect } from 'react';
import { Skeleton } from './skeleton';

interface SqlEditorProps {
    servicoId: string;
}

export default function SqlEditor({ servicoId }: SqlEditorProps) {
    const [sqlContent, setSqlContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSql() {
            try {
                setLoading(true);
                const response = await fetch(`/api/sqls/${servicoId}`);
                if (!response.ok) throw new Error("Erro ao carregar SQL");
                const data = await response.json();
                setSqlContent(data?.sql ?? '');
            } catch (err) {
                setError("Não foi possível carregar o SQL.");
            } finally {
                setLoading(false);
            }
        }

        fetchSql();
    }, [servicoId]); 

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        )
    };

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive">{error}</p>
            </div>
        )
    };
    return (
        <CodeMirror
            value={sqlContent}
            height="800px"
            extensions={[sql()]}
        />
    )
}