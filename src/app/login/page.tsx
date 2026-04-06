import Image from "next/image";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getSessionUser();
  if (currentUser) redirect("/dashboard");

  const params = await searchParams;
  const nextParam = getParam(params.next);
  const error = getParam(params.error);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-head">
          <Image
            src="/brand/flora-logo.svg"
            alt="FLORA"
            width={228}
            height={67}
            className="brand-logo login-brand-logo"
            priority
          />
          <p className="sidebar-kicker">FLORA PLANER</p>
          <h1>Acceso interno</h1>
          <p>Tablero de seguimiento visual para el proyecto de branding del cafe.</p>
        </div>

        {error === "invalid" ? (
          <p className="alert alert-error">Credenciales invalidas. Revisa email y clave.</p>
        ) : null}

        <form action="/api/login" method="post" className="auth-form">
          <input type="hidden" name="next" value={nextParam} />

          <label>
            Email
            <input name="email" type="email" required placeholder="admin@floraplaner.local" />
          </label>

          <label>
            Clave
            <input name="password" type="password" required placeholder="••••••••" />
          </label>

          <label className="checkbox-line">
            <input name="rememberMe" type="checkbox" value="on" />
            <span>Mantener sesion iniciada en este dispositivo</span>
          </label>

          <button className="btn btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
