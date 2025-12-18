import { Product } from "@/types";
import { ProductSize } from "@/types/enum";

/**
 * Derive UI-friendly fields from Product.productVariant.
 * Provides images, colors, sizes, price, discountPrice, and stock flags.
 */
export function getProductDisplayData(product: Product) {
  const variants = Array.isArray(product.productVariant)
    ? product.productVariant
    : [];

  // Flatten all imageUrls arrays from all variants
  const images = variants
    .flatMap((v) => {
      // Support imageUrls array (new format)
      if (Array.isArray(v.imageUrls) && v.imageUrls.length > 0) {
        return v.imageUrls.filter((url: any) => typeof url === 'string' && url.trim().length > 0);
      }
      // Fallback to old imageUrl field for backward compatibility
      const vAny = v as any
      if (vAny.imageUrl && typeof vAny.imageUrl === 'string' && vAny.imageUrl.trim().length > 0) {
        return [vAny.imageUrl];
      }
      return [];
    })
    .filter(Boolean);
  const colors = Array.from(
    new Set(variants.map((v) => v.color).filter(Boolean))
  );
  const sizes = Array.from(
    new Set(
      variants
        .map((v) => v.size)
        .filter((s): s is ProductSize => typeof s === "string" && !!s)
    )
  );
  const prices = variants
    .map((v) => v.price)
    .filter((p): p is number => typeof p === "number" && !isNaN(p) && p >= 0);
  const discountPrices = variants
    .map((v) => v.discountPrice)
    .filter((p): p is number => typeof p === "number" && !isNaN(p) && p >= 0);

  // Use null instead of 0 to indicate missing/invalid data
  const price = prices.length ? Math.min(...prices) : null;
  const discountPriceRaw =
    discountPrices.length === 0 ? null : Math.min(...discountPrices);
  const discountPrice =
    discountPriceRaw !== null &&
    price !== null &&
    discountPriceRaw > price
      ? discountPriceRaw
      : null;

  const inStock = variants.some((v) => v.inStock);

  return {
    images,
    colors,
    sizes,
    price,
    discountPrice,
    inStock,
  };
}




