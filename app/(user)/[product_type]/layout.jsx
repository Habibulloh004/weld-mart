import { notFound } from "next/navigation";

export default async function ProductTypeLayout({ children, params }) {
  const { product_type } = await params;

  // Faqat category va brand ishlaydi, aks holda 404
  if (!["category", "brand", "podCategory"].includes(product_type)) {
    notFound();
  }

  return <div>{children}</div>;
}
