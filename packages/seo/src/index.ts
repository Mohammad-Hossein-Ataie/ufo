import { appHosts, defaultStoreSettings } from "@ufo/config";
import type { Category, Product, ProductVariant } from "@ufo/types";

const defaultProductionOrigin = `https://${appHosts.retail}`;

export function siteOrigin(appBaseUrl = process.env.APP_BASE_URL): string {
  const candidate = appBaseUrl || defaultProductionOrigin;
  try {
    const url = new URL(candidate);
    url.pathname = "";
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return defaultProductionOrigin;
  }
}

export function canonical(pathname = "/", origin = siteOrigin()): string {
  const url = new URL(pathname.startsWith("/") ? pathname : `/${pathname}`, origin);
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, url.pathname === "/" ? "/" : "");
}

export function absoluteUrl(pathOrUrl: string, origin = siteOrigin()): string {
  try {
    return new URL(pathOrUrl, origin).toString();
  } catch {
    return canonical("/", origin);
  }
}

export function jsonLdScriptProps(data: unknown) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(data).replace(/</g, "\\u003c") },
  };
}

export function productJsonLd(
  product: Product,
  variant: ProductVariant,
  available: boolean,
  brandName = "UFO Puff",
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": canonical(`/products/${product.slug}`),
    name: product.nameFa,
    ...(product.nameEn ? { alternateName: product.nameEn } : {}),
    image: product.images.map((image) => absoluteUrl(image)),
    description: product.shortDescriptionFa,
    sku: variant.sku,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: variant.retailPriceRial,
      availability: available ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
      url: canonical(`/products/${product.slug}`),
    },
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
      item: canonical(item.path),
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": canonical("/#website"),
    name: defaultStoreSettings.brandName,
    url: canonical("/"),
    inLanguage: "fa-IR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonical("/products")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": canonical("/#organization"),
    name: defaultStoreSettings.brandName,
    url: canonical("/"),
    logo: absoluteUrl("/logos/logo.png"),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: defaultStoreSettings.phone,
      contactType: "customer service",
      areaServed: "IR",
      availableLanguage: ["fa-IR"],
    },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": canonical("/store/tehran-molavi#localbusiness"),
    name: defaultStoreSettings.brandName,
    telephone: defaultStoreSettings.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: defaultStoreSettings.address,
      addressLocality: "تهران",
      addressCountry: "IR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "10:00",
        closes: "20:00",
      },
    ],
    url: canonical("/store/tehran-molavi"),
  };
}

export function itemListJsonLd(items: Array<{ name: string; url: string }>, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: canonical(item.url),
    })),
  };
}

export function collectionPageJsonLd(category: Category, productCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": canonical(`/products/category/${category.slug}`),
    name: category.nameFa,
    description: category.descriptionFa,
    url: canonical(`/products/category/${category.slug}`),
    inLanguage: "fa-IR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: productCount,
    },
  };
}

export function faqPageJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function categoryMetadata(category: Category, path = `/products/category/${category.slug}`) {
  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: {
      canonical: canonical(path),
    },
    openGraph: {
      title: category.seoTitle,
      description: category.seoDescription,
      url: canonical(path),
      locale: "fa_IR",
      siteName: "UFO Puff",
    },
  };
}
