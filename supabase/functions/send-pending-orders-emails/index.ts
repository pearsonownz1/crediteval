import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

console.log("Sending Pending Orders Emails function starting...");

// Utility function to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Utility function to retry with exponential backoff
const retryWithBackoff = async (
  fn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if it's a rate limit error
      const isRateLimit =
        error.message?.includes("Too many requests") ||
        error.message?.includes("rate limit");

      if (isRateLimit) {
        const delayMs = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(
          `Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${
            maxRetries + 1
          })`
        );
        await delay(delayMs);
      } else {
        throw error; // Re-throw non-rate-limit errors immediately
      }
    }
  }
};

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

  // Use retry logic for sending email
  const response = await retryWithBackoff(async () => {
    const res = await fetch(resendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });

    if (!res.ok) {
      const errorResponse = await res.json();
      throw new Error(`Failed to send email: ${errorResponse.message}`);
    }

    return res;
  });

  console.log("Email sent successfully to:", email);
  return response;
};

// Batch processing function to handle rate limits
const processBatchWithRateLimit = async (
  orders: any[],
  batchSize: number = 2,
  delayBetweenBatches: number = 1000
) => {
  const emailResults = [];

  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        orders.length / batchSize
      )}`
    );

    // Process batch in parallel
    const batchPromises = batch.map(async (order) => {
      try {
        await sendPendingOrdersEmails(order);
        return { orderId: order.id, status: "sent" };
      } catch (error) {
        console.error(`Failed to send email for order ${order.id}:`, error);
        return {
          orderId: order.id,
          status: "failed",
          error: error.message,
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    emailResults.push(...batchResults);

    // Add delay between batches to respect rate limits
    if (i + batchSize < orders.length) {
      console.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
      await delay(delayBetweenBatches);
    }
  }

  return emailResults;
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

  if (orders.length === 0) {
    return new Response(
      JSON.stringify({
        message: "No pending orders found",
        totalOrders: 0,
      }),
      {
        status: 200,
      }
    );
  }

  console.log(`Found ${orders.length} pending orders to process`);

  // Process emails with rate limiting
  const emailResults = await processBatchWithRateLimit(
    orders,
    2, // Batch size: 2 emails per batch (respects 2 requests/second limit)
    1000 // 1 second delay between batches
  );

  const successCount = emailResults.filter((r) => r.status === "sent").length;
  const failureCount = emailResults.filter((r) => r.status === "failed").length;

  return new Response(
    JSON.stringify({
      message: "Email processing completed!",
      results: emailResults,
      totalOrders: orders.length,
      successCount,
      failureCount,
      summary: `${successCount} sent, ${failureCount} failed`,
    }),
    {
      status: 200,
    }
  );
});
