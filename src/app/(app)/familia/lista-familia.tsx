"use client";

import Link from "next/link";
import { useState } from "react";

type Pessoa = { id: string; nome: string; itens: number; souEu: boolean };

export function ListaFamilia({ pessoas }: { pessoas: Pessoa[] }) {
  const [busca, setBusca] = useState("");
  const termo = busca.toLocaleLowerCase("pt-BR").trim();
  const filtradas = pessoas.filter((p) => p.nome.toLocaleLowerCase("pt-BR").includes(termo));

  return (
    <>
      <label className="form-field mb-7 max-w-sm">
        Buscar na família
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Digite um nome" />
      </label>
      {filtradas.length === 0 && (
        <p className="text-muted-foreground">Ninguém com esse nome na família.</p>
      )}
      <div className="people-grid">
        {filtradas.map((p) => (
          <Link
            key={p.id}
            href={`/familia/${p.id}`}
            className="person transition-colors hover:bg-accent"
          >
            <span className="avatar" aria-hidden>
              {p.nome.slice(0, 1)}
            </span>
            <div>
              <h3>
                {p.nome}
                {p.souEu && <span className="ml-2 text-xs text-muted-foreground">você</span>}
              </h3>
              <p>
                {p.itens} {p.itens === 1 ? "presente" : "presentes"} na lista
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
