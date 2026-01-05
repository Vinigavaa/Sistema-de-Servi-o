"use client"

import { useState, useRef } from "react"
import { Upload, FileUp, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ImportResult {
    message: string
    created: number
    skipped: number
    errors: string[]
}

interface ImportCsvProps {
    onSuccess?: () => void
}

export function ImportCsv({ onSuccess }: ImportCsvProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<ImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.name.endsWith('.csv')) {
                setError('Por favor, selecione um arquivo CSV')
                setSelectedFile(null)
                return
            }
            setSelectedFile(file)
            setError(null)
            setResult(null)
        }
    }

    const handleImport = async () => {
        if (!selectedFile) return

        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append('file', selectedFile)

            const response = await fetch('/api/servico/import', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao importar arquivo')
            }

            setResult(data)
            onSuccess?.()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setSelectedFile(null)
        setResult(null)
        setError(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar CSV
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Importar do Azure DevOps</AlertDialogTitle>
                    <AlertDialogDescription>
                        Selecione um arquivo CSV exportado do Azure DevOps para importar os work items como serviços.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {/* Área de upload */}
                    <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                        {selectedFile ? (
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Clique para selecionar um arquivo CSV
                            </p>
                        )}
                    </div>

                    {/* Erro */}
                    {error && (
                        <div className="flex items-center gap-2 text-destructive text-sm">
                            <XCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {/* Resultado */}
                    {result && (
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                {result.message}
                            </div>
                            {result.errors.length > 0 && (
                                <div className="text-destructive">
                                    {result.errors.map((err, i) => (
                                        <p key={i}>{err}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleClose}>
                        {result ? 'Fechar' : 'Cancelar'}
                    </AlertDialogCancel>
                    {!result && (
                        <AlertDialogAction
                            onClick={handleImport}
                            disabled={!selectedFile || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importando...
                                </>
                            ) : (
                                'Importar'
                            )}
                        </AlertDialogAction>
                    )}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
