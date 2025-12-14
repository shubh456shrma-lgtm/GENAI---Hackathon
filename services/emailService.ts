import emailjs from '@emailjs/browser';

// ==============================================================================
// CONFIGURATION
// To send REAL emails, you can either:
// 1. Set these variables in your .env file (prefixed with VITE_ if using Vite)
// 2. OR paste your keys directly into the 'HARDCODED_' variables below.
// ==============================================================================

const HARDCODED_SERVICE_ID = ""; // e.g., "service_xyz"
const HARDCODED_TEMPLATE_ID = ""; // e.g., "template_abc"
const HARDCODED_PUBLIC_KEY = ""; // e.g., "user_123"

const getEnvVar = (key: string): string | undefined => {
  // 1. Try safe process.env access (Node/Bundlers)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) { /* ignore */ }

  // 2. Try Vite style import.meta.env
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) { /* ignore */ }

  return undefined;
};

// Priority: Hardcoded -> Environment Variable -> Undefined
const SERVICE_ID = HARDCODED_SERVICE_ID || getEnvVar('EMAILJS_SERVICE_ID');
const TEMPLATE_ID = HARDCODED_TEMPLATE_ID || getEnvVar('EMAILJS_TEMPLATE_ID');
const PUBLIC_KEY = HARDCODED_PUBLIC_KEY || getEnvVar('EMAILJS_PUBLIC_KEY');

export const getWelcomeEmailTemplate = (studentName: string) => {
  const subject = `🎉 Welcome to ReviseRight, ${studentName}!`;
  const body = `
Hi ${studentName},

On behalf of the whole team, a huge welcome to ReviseRight! We're thrilled to have you join our community and start your learning journey with us.

🚀 Your Quick-Start Checklist:
1. Complete Your Profile in settings.
2. Upload your first lecture to see the AI magic happen!

We are here to support you every step of the way.

Happy learning!

The ReviseRight Team
https://reviseright.com
  `;
  return { subject, body };
};

/**
 * Sends an email via EmailJS if configured, otherwise returns content for simulation.
 */
export const sendWelcomeEmail = async (email: string, name: string): Promise<{ success: boolean, subject: string, body: string, simulated: boolean }> => {
  const { subject, body } = getWelcomeEmailTemplate(name);
  
  // 1. Check if EmailJS is configured for real sending
  if (SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY) {
    try {
      console.log(`📧 Attempting to send email to ${email}...`);
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          to_name: name,
          subject: subject,
          message: body
        },
        PUBLIC_KEY
      );
      console.log(`✅ Real email sent to ${email} via EmailJS`);
      return { success: true, subject, body, simulated: false };
    } catch (error) {
      console.error("❌ EmailJS Failed:", error);
      // If it fails (e.g. quota reached), we fall back to simulation to show the user what *would* have happened.
    }
  } else {
    console.warn("⚠️ EmailJS credentials missing. Check services/emailService.ts. Falling back to simulation.");
  }

  // 2. Simulation (Fallback)
  console.log(`%c[Email Simulation] Sending to ${email}...`, "color: #4f46e5; font-weight: bold;");
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
  
  return { success: true, subject, body, simulated: true };
};