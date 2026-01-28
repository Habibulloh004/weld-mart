import Container from "@/components/shared/container";
import { BreadcrumbBarProduct } from "../_components/BreadcrumbBar"; // Using the universal BreadcrumbBar
import ProductInfo from "../_components/ProductInfo";
import FeatureInfo from "../_components/FeatureInfo";
import PopularProducts from "@/components/shared/popular";
import { getData } from "@/actions/get";

export const dynamicParams = true;

export async function generateStaticParams() {
  const productsData = await getData("/api/products", "product");
  const products = productsData?.products || [];

  return products.flatMap((product) => {
    const productId =
      product?.id !== undefined && product?.id !== null
        ? String(product.id)
        : null;
    if (!productId) return [];

    const params = [];
    if (product?.category_id) {
      params.push({
        product_type: "category",
        type_id: String(product.category_id),
        id: productId,
      });
    }
    if (product?.brand_id) {
      params.push({
        product_type: "brand",
        type_id: String(product.brand_id),
        id: productId,
      });
    }
    if (product?.bottom_category_id) {
      params.push({
        product_type: "podCategory",
        type_id: String(product.bottom_category_id),
        id: productId,
      });
    }

    return params;
  });
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const [productData, products] = await Promise.all([
    getData(`/api/products/${id}`, "product"),
    getData(`/api/products?limit=10&skip=0`, "product"),
  ]);
  const popularProductsData = products?.products;
  return (
    <Container className="font-montserrat w-full flex-col gap-5 md:gap-10 lg:px-5 relative flex justify-start items-start">
      <BreadcrumbBarProduct productData={productData} className="mb-6" />
      <ProductInfo productData={productData} />
      <FeatureInfo productData={productData} />
      <main className="w-full md:w-11/12 mx-auto flex-1">
        <PopularProducts popularProductsData={popularProductsData} />
      </main>
    </Container>
  );
}
