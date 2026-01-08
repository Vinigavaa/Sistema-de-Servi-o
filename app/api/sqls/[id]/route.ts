import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { updateConfigSchema } from "@/lib/validations/config";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_request: NextRequest, userId: string, {params}: RouteParams) => {
   try{
        const {id} = await params;

        let servico = await prisma.servico.findFirst({
            where: { id, userId },
            select: { sql: true }
        });
        
        return NextResponse.json(servico);
   } catch (error) {
         console.error('Erro ao buscar configuração:', error);
         return NextResponse.json(
            { error: 'Erro ao buscar configuração.' },
            { status: 500 }
         );
   }
});