import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("role", "employee")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      name,
      email,
      temporaryPassword,
      department,
      position,
      phone,
      status,
    } = body;

    if (!name || !email || !temporaryPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama, email, dan temporary password wajib diisi.",
        },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          name,
          role: "employee",
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          success: false,
          message: authError?.message || "Gagal membuat akun auth.",
        },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const { data: userData, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        name,
        email,
        role: "employee",
        department,
        position,
        phone,
        status: status || "active",
        must_change_password: true,
      })
      .select()
      .single();

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          success: false,
          message: insertError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Employee berhasil dibuat.",
        data: userData,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}