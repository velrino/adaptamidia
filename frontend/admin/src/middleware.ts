import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|sw.js|site.webmanifest).*)",
  ],
};

const publicRoutes = ["/display", "/login"];

const isPublicAsset = (pathname: string) => {
  return /\.(png|jpg|jpeg|gif|svg|css|js|ico|woff|woff2|webp)$/.test(pathname);
};

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  ) || isPublicAsset(pathname);

  // console.log("Middleware:", { pathname, isPublicRoute });

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  // console.log("Token:", token);

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
