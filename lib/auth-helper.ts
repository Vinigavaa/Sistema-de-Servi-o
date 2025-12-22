import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

type Handler = (
  request: NextRequest,
  userId: string,
  ...args: any[]
) => Promise<Response>;

export function withAuth(handler: Handler) {
  return async (request: NextRequest, ...args: any[]) => {
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    return handler(request, session.user.id, ...args);
  };
}
