/**
 * Order Email Utilities
 * Handles sending order confirmation and notification emails via Resend
 */

import { Resend } from "resend";
import type Stripe from "stripe";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderLineItem {
  name: string;
  description: string | null;
  quantity: number;
  amount: number;
  size?: string;
}

interface OrderEmailData {
  sessionId: string;
  customerEmail: string;
  customerName: string | null;
  lineItems: OrderLineItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: Stripe.Address | null;
}

/**
 * Formats currency amount (Stripe uses cents)
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Formats shipping address with HTML line breaks
 */
function formatAddress(address: Stripe.Address | null): string {
  if (!address) return "N/A";

  const lines = [];

  if (address.line1) lines.push(address.line1);
  if (address.line2) lines.push(address.line2);

  const cityStateZip = [
    address.city,
    address.state,
    address.postal_code,
  ].filter(Boolean).join(", ");

  if (cityStateZip) lines.push(cityStateZip);
  if (address.country) lines.push(address.country.toUpperCase());

  return lines.join("<br/>");
}

/**
 * Generates HTML template for customer order confirmation email
 */
function generateCustomerEmailHtml(data: OrderEmailData): string {
  const lineItemsHtml = data.lineItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 15px 10px;">
        <strong>${item.name}</strong>
        ${item.size ? `<br/><span style="color: #666; font-size: 14px;">${item.size}</span>` : ""}
        ${item.description ? `<br/><span style="color: #888; font-size: 13px;">${item.description}</span>` : ""}
      </td>
      <td style="padding: 15px 10px; text-align: center;">${item.quantity}</td>
      <td style="padding: 15px 10px; text-align: right;">${formatCurrency(item.amount, data.currency)}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B4513 0%, #654321 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🥩 Excalibur Jerky</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for your order!</p>
        </div>

        <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
          ${data.customerName ? `<p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.customerName},</p>` : ""}

          <p style="font-size: 16px; margin-bottom: 20px;">
            Your order has been confirmed and is being processed. We'll send you another email when your order ships.
          </p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold; font-family: monospace;">${data.sessionId}</p>
          </div>

          <h2 style="color: #8B4513; border-bottom: 2px solid #8B4513; padding-bottom: 10px; margin-top: 30px;">
            Order Details
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f8f9fa; border-bottom: 2px solid #8B4513;">
                <th style="padding: 12px 10px; text-align: left; font-weight: 600;">Item</th>
                <th style="padding: 12px 10px; text-align: center; font-weight: 600;">Qty</th>
                <th style="padding: 12px 10px; text-align: right; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eee;">
            <table style="width: 100%; font-size: 15px;">
              <tr>
                <td style="padding: 8px 0; text-align: right; color: #666;">Subtotal:</td>
                <td style="padding: 8px 0 8px 20px; text-align: right; width: 120px;">${formatCurrency(data.subtotal, data.currency)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; text-align: right; color: #666;">Shipping:</td>
                <td style="padding: 8px 0 8px 20px; text-align: right;">${formatCurrency(data.shipping, data.currency)}</td>
              </tr>
              <tr style="font-size: 18px; font-weight: bold; border-top: 2px solid #8B4513;">
                <td style="padding: 12px 0; text-align: right;">Total:</td>
                <td style="padding: 12px 0 12px 20px; text-align: right; color: #8B4513;">${formatCurrency(data.total, data.currency)}</td>
              </tr>
            </table>
          </div>

          ${data.shippingAddress ? `
          <div style="margin-top: 30px;">
            <h3 style="color: #8B4513; margin-bottom: 10px;">Shipping Address</h3>
            <p style="margin: 0; color: #666; line-height: 1.8;">
              ${formatAddress(data.shippingAddress)}
            </p>
          </div>
          ` : ""}

          <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              Questions about your order? Contact us at
              <a href="mailto:${process.env.CONTACT_EMAIL || "support@excaliburjerky.com"}"
                 style="color: #8B4513; text-decoration: none;">
                ${process.env.CONTACT_EMAIL || "support@excaliburjerky.com"}
              </a>
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Excalibur Jerky. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generates HTML template for admin order notification email
 */
function generateAdminEmailHtml(data: OrderEmailData): string {
  const lineItemsHtml = data.lineItems
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 8px;">
        <strong>${item.name}</strong>
        ${item.size ? `<br/><span style="color: #666; font-size: 13px;">${item.size}</span>` : ""}
      </td>
      <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">${formatCurrency(item.amount, data.currency)}</td>
    </tr>
  `,
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Order Notification</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🔔 New Order Received</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${new Date().toLocaleString()}</p>
        </div>

        <div style="background: #fff; padding: 25px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #3498db; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: 600;">Order ID: <code>${data.sessionId}</code></p>
          </div>

          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-top: 20px;">
            Customer Information
          </h2>
          <table style="width: 100%; margin: 15px 0;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 140px;">Email:</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${data.customerEmail}" style="color: #3498db; text-decoration: none;">
                  ${data.customerEmail}
                </a>
              </td>
            </tr>
            ${data.customerName ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">Name:</td>
              <td style="padding: 8px 0;">${data.customerName}</td>
            </tr>
            ` : ""}
            ${data.shippingAddress ? `
            <tr>
              <td style="padding: 8px 0; color: #666; vertical-align: top;">Shipping Address:</td>
              <td style="padding: 8px 0; line-height: 1.6;">${formatAddress(data.shippingAddress)}</td>
            </tr>
            ` : ""}
          </table>

          <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px; margin-top: 25px;">
            Order Items
          </h2>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f8f9fa; border-bottom: 2px solid #3498db;">
                <th style="padding: 10px 8px; text-align: left; font-weight: 600;">Product</th>
                <th style="padding: 10px 8px; text-align: center; font-weight: 600;">Qty</th>
                <th style="padding: 10px 8px; text-align: right; font-weight: 600;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lineItemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #eee;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 6px 0; text-align: right; color: #666;">Subtotal:</td>
                <td style="padding: 6px 0 6px 20px; text-align: right; width: 120px;">${formatCurrency(data.subtotal, data.currency)}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; text-align: right; color: #666;">Shipping:</td>
                <td style="padding: 6px 0 6px 20px; text-align: right;">${formatCurrency(data.shipping, data.currency)}</td>
              </tr>
              <tr style="font-size: 16px; font-weight: bold; border-top: 2px solid #3498db;">
                <td style="padding: 10px 0; text-align: right;">Total:</td>
                <td style="padding: 10px 0 10px 20px; text-align: right; color: #27ae60;">${formatCurrency(data.total, data.currency)}</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 25px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-weight: 500;">
              ⚡ Action Required: Process this order and prepare for shipment.
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>This is an automated notification from your e-commerce system.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Sends order confirmation email to customer
 */
export async function sendCustomerOrderConfirmation(
  data: OrderEmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL;

    if (!fromEmail) {
      console.error("RESEND_FROM_EMAIL is not configured");
      return { success: false, error: "Email sender not configured" };
    }

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.sessionId.substring(0, 8).toUpperCase()}`,
      html: generateCustomerEmailHtml(data),
    });

    if (error) {
      console.error("Failed to send customer order confirmation:", error);
      return { success: false, error: error.message };
    }

    console.log(
      `✅ [EMAIL] Sent order confirmation to customer: ${data.customerEmail} (ID: ${emailData?.id})`,
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending customer order confirmation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sends order notification email to admin
 */
export async function sendAdminOrderNotification(
  data: OrderEmailData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const adminEmail =
      process.env.CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL;

    if (!fromEmail || !adminEmail) {
      console.error("Email configuration missing");
      return { success: false, error: "Email configuration missing" };
    }

    const { data: emailData, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      replyTo: data.customerEmail,
      subject: `🛒 New Order: ${formatCurrency(data.total, data.currency)} - ${data.sessionId.substring(0, 8).toUpperCase()}`,
      html: generateAdminEmailHtml(data),
    });

    if (error) {
      console.error("Failed to send admin order notification:", error);
      return { success: false, error: error.message };
    }

    console.log(
      `✅ [EMAIL] Sent order notification to admin: ${adminEmail} (ID: ${emailData?.id})`,
    );
    return { success: true };
  } catch (error) {
    console.error("Error sending admin order notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
