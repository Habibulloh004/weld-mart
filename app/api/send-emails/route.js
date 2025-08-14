import nodemailer from "nodemailer";

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req) {
  const { emails, subject, message } = await req.json();

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
    subject: subject,
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; border-radius: 10px; background: #f4f4f4; max-width: 600px; margin: auto;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="background: white; padding: 5px; border-radius: 12px; font-size: 32px; font-weight: bold; margin: 0;">
          <span style="color: #B9515C;">Weld</span><span style="color:black; padding: 5px 10px; border-radius: 5px;">Mart</span>
        </h1>
      </div>
      <div style="background: white; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #333; text-align: start;">${subject}</h2>
        ${message}
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

  try {
    await transporter.sendMail(mailOptions);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
