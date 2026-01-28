import Container from "@/components/shared/container";
import Sidebar from "@/components/shared/sidebar";
import { getData } from "@/actions/get";
import { BreadcrumbBar } from "../_components/BreadcrumbBar";
import CategoryList from "../_components/CategoryList";

export const dynamicParams = true;

export async function generateStaticParams() {
  const [categoriesData, brandsData] = await Promise.all([
    getData("/api/categories", "category"),
    getData("/api/brands", "brand"),
  ]);

  const categories = categoriesData?.categories || [];
  const brands = brandsData?.brands || [];

  const params = [];

  categories.forEach((category) => {
    if (category?.id !== undefined && category?.id !== null) {
      params.push({
        product_type: "category",
        type_id: String(category.id),
      });
    }
    const bottomCategories = category?.bottom_categories || [];
    bottomCategories.forEach((subCategory) => {
      if (subCategory?.id !== undefined && subCategory?.id !== null) {
        params.push({
          product_type: "podCategory",
          type_id: String(subCategory.id),
        });
      }
    });
  });

  brands.forEach((brand) => {
    if (brand?.id !== undefined && brand?.id !== null) {
      params.push({
        product_type: "brand",
        type_id: String(brand.id),
      });
    }
  });

  return params;
}

export default async function BrandPage({ searchParams, params }) {
  const { type_id, product_type } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams?.page, 10) || 1;
  const limit = 12;
  const skip = (page - 1) * limit; // Correct skip calculation (page 1 = skip 0)
  const typeTag = product_type === "podCategory" ? "bottom-category" : product_type;

  const [categories, products, brands, typeData, allProducts] =
    await Promise.all([
      getData("/api/categories", "category"),
      getData(
        `/api/products?limit=${limit}&skip=${skip}&${
          product_type == "brand"
            ? "brand_id"
            : product_type == "podCategory"
            ? "bottom_category_id"
            : "category_id"
        }=${type_id}`,
        "product"
      ),
      getData("/api/brands", "brand"),
      getData(
        `/api/${
          product_type == "brand"
            ? "brands"
            : product_type == "podCategory"
            ? "bottomCategories"
            : "categories"
        }/${type_id}`,
        typeTag
      ),
      getData("/api/products", "product"),
    ]);

  return (
    <Container className="font-montserrat w-full flex-col relative flex justify-start items-start gap-3">
      <div className="w-11/12 mx-auto bg-white z-20">
        <BreadcrumbBar product_type={product_type} typeData={typeData} />
      </div>
      <div className="relative w-11/12 mx-auto h-full flex justify-start items-start">
        <Sidebar
          product_type={product_type}
          categoriesData={categories?.categories}
          brandsData={brands?.brands}
          id={type_id}
          className="top-[145px] max-h-[calc(100vh-145px)]"
          allProducts={allProducts?.products}
          sidebarBottom={true}
        />
        <CategoryList
          product_type={product_type}
          limit={limit}
          categoryId={type_id}
          fetchData={products}
          page={page}
        />
      </div>
    </Container>
  );
}
