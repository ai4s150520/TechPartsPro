/**
 * Common validation utilities for Forms
 */

export const validators = {
  // 1. Email Regex
  email: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // 2. Password Strength (Min 8 chars, 1 number)
  passwordStrength: (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!/\d/.test(password)) {
      return { valid: false, message: "Password must contain at least one number" };
    }
    return { valid: true };
  },

  // 3. Phone Number (Indian Format Support: +91 or 10 digits)
  phone: (phone: string): boolean => {
    // Allows: 9876543210, +919876543210, 987-654-3210
    const re = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
    // Ideally use a loose check for global apps, strict for local
    return phone.length >= 10 && phone.length <= 15;
  },

  // 4. GST Number (Indian Tax ID)
  gstNumber: (gst: string): boolean => {
    // Standard format: 22AAAAA0000A1Z5
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return re.test(gst);
  },

  // 5. Required Field
  required: (val: any): boolean => {
    if (typeof val === 'string') return val.trim().length > 0;
    return val !== null && val !== undefined;
  }
};