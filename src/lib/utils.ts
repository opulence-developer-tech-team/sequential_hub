import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { clothingCategories } from "@/lib/resources"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number | null | undefined, currency: string = "NGN"): string {
  // Handle null/undefined values - return placeholder to indicate invalid data
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A";
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function calculateDiscount(originalPrice: number, currentPrice: number): number {
  return ((originalPrice - currentPrice) / originalPrice) * 100
}

export function isPlaceholderImage(src: string | undefined | null): boolean {
  if (!src) return false
  return src.includes('via.placeholder.com') || src.includes('placeholder')
}

export function getCategoryLabel(categoryValue: string): string {
  const category = clothingCategories.find(cat => cat.value === categoryValue)
  return category?.label || categoryValue
}

/**
 * Check if a color string is a valid hex color code
 */
export function isValidHexColor(color: string | null | undefined): boolean {
  if (!color) return false
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}