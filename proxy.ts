import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/cases/H3") return NextResponse.redirect(new URL("/cases/h3", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/cases/:slug"] };
