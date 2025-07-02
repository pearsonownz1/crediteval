import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

console.log("Sending Pending Orders Emails function starting...");

const sendPendingOrdersEmails = async (order: any) => {
  const {
    id,
    created_at,
    first_name,
    last_name,
    email,
    document_paths,
    total_amount,
    services,
    status,
    phone,
  } = order;

  const emailBody = `
    <h1>Pending Order Details</h1>
    <p>Dear ${first_name} ${last_name},</p>
    <p>Your order with ID <strong>${id}</strong> is currently pending.</p>
    <p><strong>Order Created At:</strong> ${new Date(
      created_at
    ).toLocaleString()}</p>
    <p><strong>Status:</strong> ${status}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Documents:</strong></p>
    <ul>
      ${
        document_paths
          ? document_paths.map((path: string) => `<li>${path}</li>`).join("")
          : "<li>No documents uploaded</li>"
      }
    </ul>
    <p><strong>Total Amount:</strong> ${
      total_amount ? `$${total_amount}` : "Not specified"
    }</p>
    <p><strong>Services:</strong></p>
    <ul>
      <li>Type: ${services?.type || "Not specified"}</li>
      <li>Urgency: ${services?.urgency || "Not specified"}</li>
      <li>Page Count: ${services?.pageCount || "Not specified"}</li>
      <li>Delivery Type: ${services?.deliveryType || "Not specified"}</li>
      <li>Special Instructions: ${services?.specialInstructions || "None"}</li>
    </ul>
    ${
      services?.shippingInfo
        ? `
      <p><strong>Shipping Information:</strong></p>
      <p>${services.shippingInfo.address}, ${services.shippingInfo.city}, ${services.shippingInfo.state}, ${services.shippingInfo.zip}, ${services.shippingInfo.country}</p>
    `
        : ""
    }
    <p>You can resume your order by clicking the link below:</p>
    <p><a href="https://yourwebsite.com/resume-order/${id}">Resume Order</a></p>
    <p>Thank you!</p>
  `;

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendUrl = "https://api.resend.com/emails";

  const emailData = {
    from: "noreply@mail.crediteval.com",
    to: email,
    subject: "Your Pending Order Details",
    html: emailBody,
  };

  console.log("Sending email to:", email);

  const response = await fetch(resendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailData),
  });

  console.log("Email sent to:", email);

  if (!response.ok) {
    const errorResponse = await response.json();
    console.error("Error sending email:", errorResponse);
    throw new Error(`Failed to send email: ${errorResponse.message}`);
  }

  return response;
};

Deno.serve(async (req) => {
  console.log(
    "inside deno serve - Sending Pending Orders Emails function starting..."
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  console.log("supabaseClient created");

  const { data: orders, error } = await supabaseClient
    .from(Deno.env.get("VITE_SUPABASE_ORDERS_TABLE")!)
    .select("*")
    .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Orders created in the last hour
    .eq("status", "pending");

  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
      }
    );
  }

  const emailResults = [];

  for (const order of orders) {
    try {
      console.log("Processing order:", order.id);
      await sendPendingOrdersEmails(order);
      emailResults.push({ orderId: order.id, status: "sent" });
    } catch (error) {
      console.error(`Failed to send email for order ${order.id}:`, error);
      emailResults.push({
        orderId: order.id,
        status: "failed",
        error: error.message,
      });
    }
  }

  return new Response(
    JSON.stringify({
      message: "Email processing completed!",
      results: emailResults,
      totalOrders: orders.length,
    }),
    {
      status: 200,
    }
  );
});
