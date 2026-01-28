import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const backUrl = process.env.NEXT_PUBLIC_BACK_URL;
export const baseUrl = process.env.NEXT_PUBLIC_URL;
export const wsUrl = process.env.NEXT_PUBLIC_WS_URL

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export function formatNumber(number) {
  return number
    .toString() // Raqamni satrga aylantirish
    .replace(/\B(?=(\d{3})+(?!\d))/g, " "); // Har 3 ta raqamdan keyin bo'sh joy qo'shish
}

export const roundToTwoDecimals = (value) => {
  return Number((Math.round(value * 100) / 100).toFixed(2));
};

export const fixImageUrl = (src) => {
  if (!src) return src;
  const trimmed = src.trim();
  if (!trimmed) return trimmed;

  const normalizedDomain = trimmed.replace(
    /https:\/\/weldmarket\.uz/g,
    "https://weldmart.uz"
  );

  const uploadIndex = normalizedDomain.indexOf("/uploads/");
  if (uploadIndex !== -1) {
    const uploadPath = normalizedDomain.slice(uploadIndex).split(/[?#]/)[0];
    if (backUrl) {
      return `${backUrl.replace(/\/$/, "")}${uploadPath}`;
    }
    return uploadPath;
  }

  if (normalizedDomain.startsWith("uploads/")) {
    const uploadPath = `/${normalizedDomain}`.split(/[?#]/)[0];
    if (backUrl) {
      return `${backUrl.replace(/\/$/, "")}${uploadPath}`;
    }
    return uploadPath;
  }

  if (normalizedDomain.startsWith("http://") || normalizedDomain.startsWith("https://")) {
    return normalizedDomain;
  }

  return normalizedDomain;
};

export const isUploadPath = (value) => /^\/?uploads\/.+/i.test(value || "");
export const isHttpUrl = (value) => /^https?:\/\//i.test(value || "");

export function truncateText(text, maxLength) {
  if (text?.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

export const socialMedias = [
  {
    id: 1,
    name: "Facebook",
    icon: "/social/facebook.svg",
    url: "http://facebook.com",
  },
  {
    id: 2,
    name: "Telegram",
    icon: "/social/telegram.svg",
    url: "http://telegram.com",
  },
  {
    id: 3,
    name: "Instagram",
    icon: "/social/instagram.svg",
    url: "http://instagram.com",
  },
  {
    id: 4,
    name: "Google",
    icon: "/social/google.svg",
    url: "http://google.com",
  },
  {
    id: 5,
    name: "WhatsApp",
    icon: "/social/whatsapp.svg",
    url: "http://whatsapp.com",
  },
];

export const infinityCards = [
  "/assets/jasic.svg",
  "/assets/esab.svg",
  "/assets/geka.svg",
  "/assets/hugong.svg",
  "/assets/lincoln.svg",
  "/assets/pecahta.svg",
];
