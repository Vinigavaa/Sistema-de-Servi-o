import SqlEditor from "@/components/ui/sql-editor";
import { use } from "react";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default function SqlViewerPage({ params }: PageProps) {
    const { id } = use(params);

    return (
        <SqlEditor servicoId={id} />
    );
}