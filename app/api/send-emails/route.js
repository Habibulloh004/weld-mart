import nodemailer from "nodemailer";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { headers } from "next/headers";

const ALLOWED_ORIGINS = [
  "https://weldmart.uz",
  "https://www.weldmart.uz",
  "http://localhost:3000"
];

function getCorsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Server-side DOMPurify setup
const window = new JSDOM("").window;
const purify = DOMPurify(window);

export async function OPTIONS() {
  const headersList = await headers();
  const origin = headersList.get("origin") || "";
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(req) {
  const headersList = await headers();
  const origin = headersList.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await req.json();
    const { emails, subject, message } = body;

    // Input validation - emails
    if (!Array.isArray(emails) || emails.length === 0 || emails.length > 100) {
      return new Response(JSON.stringify({ success: false, error: "Invalid emails array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emails.every(email => typeof email === "string" && emailRegex.test(email))) {
      return new Response(JSON.stringify({ success: false, error: "Invalid email format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation - subject
    if (!subject || typeof subject !== "string" || subject.length > 200) {
      return new Response(JSON.stringify({ success: false, error: "Invalid subject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs for XSS prevention
    const sanitizedSubject = purify.sanitize(subject, { ALLOWED_TAGS: [] });
    const sanitizedMessage = purify.sanitize(message || "");

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: emails.join(","),
      subject: sanitizedSubject,
      html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 10px; background: #f4f4f4; max-width: 600px; margin: auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="background: white; padding: 5px; border-radius: 12px; font-size: 32px; font-weight: bold; margin: 0;">
            <span style="color: #B9515C;">Weld</span><span style="color:black; padding: 5px 10px; border-radius: 5px;">Mart</span>
          </h1>
        </div>
        <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #333; text-align: start;">${sanitizedSubject}</h2>
          ${sanitizedMessage}
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://weldmart.uz" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: white; background: #B9515C; text-decoration: none; border-radius: 5px;">
            Сайтни кўриш
          </a>
        </div>
        <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
          &copy; 2025 WeldMart. Барча ҳуқуқлар ҳимояланган.
        </footer>
      </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
