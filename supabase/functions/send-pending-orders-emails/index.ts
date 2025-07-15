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

const baseUrl = "https://crediteval.com"; // Your site URL

const createResumeUrl = (order: any): string => {
  const params = new URLSearchParams();
  console.log("creating url params for order", order);
  // Add customer info
  if (order.customerInfo) {
    if (order.customerInfo.firstName)
      params.append("firstName", order.customerInfo.firstName);
    if (order.customerInfo.lastName)
      params.append("lastName", order.customerInfo.lastName);
    if (order.customerInfo.email)
      params.append("email", order.customerInfo.email);
    if (order.customerInfo.phone)
      params.append("phone", order.customerInfo.phone);
    if (order.customerInfo.company)
      params.append("company", order.customerInfo.company);
  }

  // Add order ID
  if (order.id) {
    params.append("orderId", order.id);
  }

  // Add service selection
  if (order.services) {
    if (order.services.type)
      // Use 'type' instead of 'selectedService'
      params.append("type", order.services.type);
    if (order.services.urgency)
      params.append("urgency", order.services.urgency);
    if (order.services.deliveryType)
      // Use 'deliveryType'
      params.append("deliveryType", order.services.deliveryType);
    if (order.services.pageCount)
      params.append("pageCount", order.services.pageCount.toString());
    if (order.services.evaluationType)
      params.append("evaluationType", order.services.evaluationType);
    if (order.services.languageFrom)
      params.append("languageFrom", order.services.languageFrom);
    if (order.services.languageTo)
      params.append("languageTo", order.services.languageTo);
    // Add visaType if service type is expert
    if (order.services.type === "expert" && order.services.visaType)
      params.append("visaType", order.services.visaType);

    // Add shipping info
    if (order.services.shippingInfo) {
      if (order.services.shippingInfo.country)
        params.append("country", order.services.shippingInfo.country);
      if (order.services.shippingInfo.address)
        params.append("address", order.services.shippingInfo.address);
      if (order.services.shippingInfo.apartment)
        params.append("apartment", order.services.shippingInfo.apartment);
      if (order.services.shippingInfo.city)
        params.append("city", order.services.shippingInfo.city);
      if (order.services.shippingInfo.state)
        params.append("state", order.services.shippingInfo.state);
      if (order.services.shippingInfo.zip)
        params.append("zip", order.services.shippingInfo.zip);
    }
  }

  // Add current step
  if (order.currentStep !== undefined)
    params.append("step", order.currentStep.toString());

  return `${baseUrl}/order-wizard?${params.toString()}`;
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

  const resumeUrl = createResumeUrl(order);

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
      services?.deliveryType && services?.deliveryType !== "email"
        ? `
      <p><strong>Shipping Information:</strong></p>
      <p>${services.shippingInfo.address}, ${services.shippingInfo.city}, ${services.shippingInfo.state}, ${services.shippingInfo.zip}, ${services.shippingInfo.country}</p>
    `
        : ""
    }
    <p>You can resume your order by clicking the link below:</p>
    <p><a href="${resumeUrl}">Resume Order</a></p>
    <p>Thank you!</p>
  `;

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendUrl = "https://api.resend.com/emails";

  const emailData = {
    from: "CreditEval - Credential Evaluation & Translation Services <support@mail.crediteval.com>",
    to: email,
    subject: "Complete Your CreditEval Order - Don't Miss Out!",
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
