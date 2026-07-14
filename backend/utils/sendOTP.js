import { sendOtpToPhone } from './otpService.js';

/**
 * Sends OTP to patient for doctor access request approval
 * @param {string} phone - Patient's phone number
 * @param {string} otp - The OTP code to send
 * @param {string} doctorName - Name of the requesting doctor
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendOTP = async (phone, otp, doctorName = 'a doctor') => {
  try {
    const message = `HealSync: ${doctorName} has requested access to your medical records. Your OTP is ${otp}. Valid for 10 minutes.`;
    
    // Use existing OTP service infrastructure
    const result = await sendOtpToPhone(phone, 'doctor-access-request', 6, 600);
    
    if (result.ok) {
      console.log(`✅ OTP sent to ${phone} via ${result.via}`);
      return {
        success: true,
        message: `OTP sent via ${result.via}`,
        method: result.via
      };
    } else {
      console.error(`❌ Failed to send OTP to ${phone}`);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export default sendOTP;
