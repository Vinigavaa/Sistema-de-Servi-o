import { withAuth } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import { updateServicoSchema } from "@/lib/validations/servico";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_request: NextRequest, userId: string, { params }: RouteParams) => {
   try {
      const { id } = await params;

      let servico = await prisma.servico.findFirst({
         where: { id, userId },
         select: { sql: true }
      });

      return NextResponse.json(servico);
   } catch (error) {
      console.error('Erro ao buscar SQL:', error);
      return NextResponse.json(
         { error: 'Erro ao buscar SQL.' },
         { status: 500 }
      );
   }
});

export const PUT = withAuth(async (request: NextRequest, userId: string, { params }: RouteParams) => {
   try {
      const { id } = await params;
      const body = await request.json();
      const validation = updateServicoSchema.safeParse(body);

      if (!validation.success) {
         return NextResponse.json(
            { error: 'Dados inválidos.', details: validation.error.issues[0].message },
            { status: 400 }
         );
      };

      const existente = await prisma.servico.findFirst({
         where: { id, userId }
      });

      if (!existente) {
         return NextResponse.json(
            { error: 'Serviço não encontrado.' },
            { status: 404 }
         );
      }

      const servico = await prisma.servico.update({
         where: { id },
         data: { sql: validation.data.sql }
      });

      return NextResponse.json(servico.sql);

   } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      return NextResponse.json(
         { error: 'Erro ao atualizar configuração.' },
         { status: 500 }
      )
   }
});