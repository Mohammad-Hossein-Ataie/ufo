import { appHosts, defaultStoreSettings } from "@ufo/config";
import type { Category, Product } from "@ufo/types";

export function canonical(pathname: string, host = appHosts.retail): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${host}${normalized}`;
}

export function productJsonLd(product: Product, priceRial: number, available: boolean) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameFa,
    image: product.images.map((image) => canonical(image)),
    description: product.shortDescriptionFa,
    sku: product.slug,
    brand: {
      "@type": "Brand",
      name: "UFO Puff"
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: priceRial,
      availability: available ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: canonical(`/products/${product.slug}`)
    }
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonical(item.path)
    }))
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: defaultStoreSettings.brandName,
    url: canonical("/"),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: defaultStoreSettings.phone,
      contactType: "customer service",
      areaServed: "IR",
      availableLanguage: ["fa-IR"]
    }
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: defaultStoreSettings.brandName,
    telephone: defaultStoreSettings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: defaultStoreSettings.address,
      addressLocality: "تهران",
      addressCountry: "IR"
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "10:00",
        closes: "20:00"
      }
    ],
    url: canonical("/store/tehran-molavi")
  };
}

export function categoryMetadata(category: Category) {
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: {
      canonical: canonical(`/categories/${category.slug}`)
    },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
      url: canonical(`/categories/${category.slug}`),
      locale: "fa_IR",
      siteName: "UFO Puff"
    }
  };
}
