import { NextResponse } from "next/server";

const backUrl = process.env.NEXT_PUBLIC_BACK_URL;

export async function POST(request) {
  try {
    const { login, password } = await request.json();

    if (!login || !password) {
      return NextResponse.json(
        { success: false, message: "Login va parol talab qilinadi" },
        { status: 400 }
      );
    }

    // Fetch admin credentials from backend (server-side only)
    const adminResponse = await fetch(`${backUrl}/api/admin`);

    if (!adminResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Server xatosi" },
        { status: 500 }
      );
    }

    const adminData = await adminResponse.json();

    // Validate credentials on the server (not client)
    if (login === adminData.login && password === adminData.password) {
      // Return only necessary data for the session (not the password)
      return NextResponse.json({
        success: true,
        admin: {
          login: adminData.login,
          authenticated: true,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Login yoki parol noto'g'ri!" },
      { status: 401 }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, message: "Server xatosi" },
      { status: 500 }
    );
  }
}
