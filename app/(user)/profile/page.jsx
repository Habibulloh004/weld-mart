import Container from "@/components/shared/container";
import UserInfo from "./_components/UserInfo";
import OrderInfo from "./_components/OrderInfo";
import { cookies } from "next/headers";
import { getData } from "@/actions/get";
import BreadcrumbComponent from "@/components/shared/BreadcrumbComponent";

export default async function Profile() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("auth"); // "auth" cookie ni olish
  let auth = null;
  if (authCookie) {
    try {
      auth = JSON.parse(authCookie.value);
    } catch (error) {
      console.error("Invalid auth cookie:", error);
    }
  }
  const [userData] = await Promise.all([
    getData(`/api/users/${auth?.id}`, "user"),
  ]);

  return (
    <Container className="flex-col font-montserrat gap-10 justify-start items-start w-11/12 lg:w-10/12 xl:w-10/12 mx-auto mb-10">
      <BreadcrumbComponent
        data={[
          {
            href: "/",
            name: "Главная страница",
          },
          {
            name: "Профиле",
            href: "/profile",
          },
        ]}
      />
      <div className="w-full gap-10 flex justify-start max-md:flex-col items-start">
        <UserInfo userData={userData} />
        <OrderInfo userData={userData} />
      </div>
    </Container>
  );
}
