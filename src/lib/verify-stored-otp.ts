import { verifyOtpChallenge } from "@ufo/auth";
import { toEnglishDigits } from "@ufo/validation";
import { getOtpChallenge, removeOtpChallenge, updateOtpChallenge } from "@/lib/otp-store";
import { otpSecret } from "@/lib/otp-sms";

const state = globalThis as typeof globalThis & { __ufoOtpVerifications?: Set<string> };

export async function verifyStoredOtp(challengeId: string, code: string) {
  const locks = (state.__ufoOtpVerifications ??= new Set<string>());
  if (locks.has(challengeId)) throw new Error("تأیید کد در حال انجام است.");
  locks.add(challengeId);
  try {
    const challenge = getOtpChallenge(challengeId);
    if (!challenge) throw new Error("کد ورود پیدا نشد یا منقضی شده است.");
    const verified = await verifyOtpChallenge({
      challenge,
      code: toEnglishDigits(code).trim(),
      secret: otpSecret(),
    });
    // A resend can replace this challenge while the asynchronous hash is being checked.
    if (!getOtpChallenge(challengeId)) throw new Error("کد ورود منقضی شده است.");
    if (verified.attempts !== challenge.attempts) {
      updateOtpChallenge(verified);
      throw new Error("کد ورود صحیح نیست.");
    }
    removeOtpChallenge(challengeId);
    return challenge;
  } finally {
    locks.delete(challengeId);
  }
}
