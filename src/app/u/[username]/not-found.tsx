import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("profile");

  return (
    <div className="py-16">
      <div className="max-w-md mx-auto text-center space-y-3">
        <h1 className="text-xl font-semibold">{t("notFound")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("notFoundDescription")}
        </p>
        <div className="pt-2">
          <Link href="/" className="text-sm underline text-muted-foreground hover:text-foreground">
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
} 