"use client";

import { useState, useEffect, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from "@codemirror/lang-sql";
import { githubLight } from '@uiw/codemirror-theme-github';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { redirect } from 'next/navigation';

interface SqlEditorProps {
    servicoId: string;
}

export default function SqlEditor({ servicoId }: SqlEditorProps) {
    const [sqlContent, setSqlContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const hasChanges = sqlContent !== originalContent;

    useEffect(() => {
        async function fetchSql() {
            try {
                setLoading(true);
                const response = await fetch(`/api/sqls/${servicoId}`);
                if (!response.ok) throw new Error("Erro ao carregar SQL");
                const data = await response.json();
                const content = data?.sql ?? '';
                setSqlContent(content);
                setOriginalContent(content);
            } catch (err) {
                setError("Não foi possível carregar o SQL.");
            } finally {
                setLoading(false);
            }
        }

        fetchSql();
    }, [servicoId]);

    const handleChange = useCallback((value: string) => {
        setSqlContent(value);
        setSaveMessage(null);
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            setSaveMessage(null);

            const response = await fetch(`/api/sqls/${servicoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: sqlContent }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar');
            }

            setOriginalContent(sqlContent);
            setSaveMessage({ type: 'success', text: 'SQL salvo com sucesso!' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erro ao salvar SQL';
            setSaveMessage({ type: 'error', text: message });
        } finally {
            setSaving(false);
        }
    };

    const handleBack = async () => {
        redirect('/servicos');
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-[800px] w-full rounded-xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                >
                    {saving ? 'Salvando...' : 'Salvar'}
                </Button>

                <Button
                    onClick={handleBack}
                >
                    Voltar
                </Button>

                {saveMessage && (
                    <span className={saveMessage.type === 'success' ? 'text-green-600' : 'text-destructive'}>
                        {saveMessage.text}
                    </span>
                )}

                {hasChanges && !saveMessage && (
                    <span className="text-muted-foreground text-sm">
                        Alterações não salvas
                    </span>
                )}
            </div>

            <div className="rounded-lg border shadow-xl overflow-hidden">
                <CodeMirror
                    value={sqlContent}
                    height="600px"
                    theme={githubLight}
                    extensions={[sql()]}
                    onChange={handleChange}
                />
            </div>
        </div>
    );
}
