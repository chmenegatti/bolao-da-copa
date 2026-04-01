import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <h1 className="font-display text-6xl font-bold text-primary">404</h1>
      <p className="text-muted-foreground text-lg">Página não encontrada</p>
      <Link href="/">
        <Button>Voltar ao início</Button>
      </Link>
    </div>
  );
}
