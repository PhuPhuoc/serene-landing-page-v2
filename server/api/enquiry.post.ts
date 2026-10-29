import {
  CTA_SOURCE_AREAS,
  MODAL_KEYS,
  type CtaSourceArea,
  type ModalKey,
  type ModalSubmission,
} from "../../types";
import { SUPPORTED_LOCALES, type Locale } from "../utils/locale";

export type EnquiryResponse = { ok: true };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\+?\d{8,15}$/;

function reject(reason: string): never {
  console.warn("[enquiry] Rejected:", reason);
  throw createError({ statusCode: 400, statusMessage: "Invalid enquiry" });
}

export default defineEventHandler(async (event): Promise<EnquiryResponse> => {
  const body = await readBody<unknown>(event).catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    reject("body is not an object");
  }

  const input = body as Record<string, unknown>;

  const modalKey = input.modalKey;
  if (
    typeof modalKey !== "string" ||
    !(MODAL_KEYS as readonly string[]).includes(modalKey)
  ) {
    reject("unknown modalKey");
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 200) reject("invalid name");

  if (input.email != null && typeof input.email !== "string") {
    reject("invalid email type");
  }
  const email = (input.email as string | null | undefined)?.trim() ?? "";
  if (email.length > 320) reject("email too long");
  if (email && !EMAIL_RE.test(email)) reject("invalid email");

  if (input.mobile != null && typeof input.mobile !== "string") {
    reject("invalid mobile type");
  }
  // Chuẩn hoá giống client: bỏ khoảng trắng/dấu phân cách, giữ dấu + ở đầu.
  const mobile = ((input.mobile as string | null | undefined) ?? "").replace(
    /[\s().-]/g,
    "",
  );
  if (mobile && !MOBILE_RE.test(mobile)) reject("invalid mobile");
  if (!email && !mobile) reject("email or mobile required");

  if (input.note != null && typeof input.note !== "string") {
    reject("invalid note type");
  }
  const note = (input.note as string | null | undefined)?.trim() ?? "";
  if (note.length > 2000) reject("note too long");

  const source = input.source;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    reject("invalid source");
  }
  const src = source as Record<string, unknown>;

  const area = src.area;
  if (
    typeof area !== "string" ||
    !(CTA_SOURCE_AREAS as readonly string[]).includes(area)
  ) {
    reject("unknown source area");
  }

  const page = src.page;
  if (typeof page !== "string" || !page.startsWith("/") || page.length > 500) {
    reject("invalid source page");
  }

  const locale = src.locale;
  if (
    typeof locale !== "string" ||
    !(SUPPORTED_LOCALES as readonly string[]).includes(locale)
  ) {
    reject("unknown source locale");
  }

  const blockId =
    typeof src.blockId === "number" && Number.isInteger(src.blockId)
      ? src.blockId
      : undefined;

  const payload: ModalSubmission = {
    modalKey: modalKey as ModalKey,
    name,
    email: email || null,
    mobile: mobile || null,
    note: note || null,
    source: {
      area: area as CtaSourceArea,
      label: typeof src.label === "string" ? src.label.trim().slice(0, 200) : "",
      blockId,
      page,
      locale: locale as Locale,
    },
    // Giờ server: không phụ thuộc đồng hồ/múi giờ máy khách.
    submittedAt: new Date().toISOString(),
  };

  // Tạm log tại server; sau này thay bằng lời gọi Mailchimp.
  console.info("[enquiry] New submission:", payload);

  return { ok: true };
});
