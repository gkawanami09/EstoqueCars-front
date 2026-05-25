import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import css from "./Favoritos.module.css";

const CHAVE_FAVORITOS = "carros_favoritos";

function listarFavoritosCarros() {
    try {
        const favoritos = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS) || "[]");
        return Array.isArray(favoritos) ? favoritos : [];
    } catch {
        return [];
    }
}

function salvarFavoritosCarros(favoritos) {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(favoritos));
    window.dispatchEvent(new Event("favoritos-carros-atualizados"));
}

function idFavoritoCarro(carro) {
    return String(carro?.id || carro?.id_carro || carro?.id_veiculo || carro?.ID_VEICULO || carro?.ID_CARRO || "");
}

function removerFavoritoCarro(idCarro) {
    const id = String(idCarro || "");
    salvarFavoritosCarros(listarFavoritosCarros().filter((carro) => idFavoritoCarro(carro) !== id));
}

function nomeCarro(carro) {
    return carro?.nome || [carro?.marca, carro?.modelo].filter(Boolean).join(" ") || "Veiculo";
}

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function imagemCarro(API, carro) {
    const imagem = carro?.imagem || carro?.foto || carro?.foto_veiculo;

    if (!imagem) {
        return "/IconCar.png";
    }

    if (String(imagem).startsWith("http")) {
        return imagem;
    }

    return String(imagem).startsWith("/") ? `${API}${imagem}` : `${API}/${imagem}`;
}

function Favoritos({ API }) {
    const navigate = useNavigate();
    const [favoritos, setFavoritos] = useState(() => listarFavoritosCarros());

    useEffect(() => {
        function atualizarFavoritos() {
            setFavoritos(listarFavoritosCarros());
        }

        window.addEventListener("favoritos-carros-atualizados", atualizarFavoritos);
        return () => window.removeEventListener("favoritos-carros-atualizados", atualizarFavoritos);
    }, []);

    function remover(id) {
        removerFavoritoCarro(id);
        setFavoritos(listarFavoritosCarros());
    }

    return (
        <main className={css.container}>
            <header className={css.cabecalho}>
                <div>
                    <span>Minha garagem</span>
                    <h1>Favoritos</h1>
                </div>
                <button type="button" onClick={() => navigate("/dashboard")}>
                    Ver carros
                </button>
            </header>

            {favoritos.length === 0 ? (
                <section className={css.vazio}>
                    <strong>Nenhum carro favoritado ainda.</strong>
                    <span>Use o botão Favoritar nos carros que você quer acompanhar.</span>
                </section>
            ) : (
                <section className={css.lista}>
                    {favoritos.map((carro) => {
                        const id = idFavoritoCarro(carro);

                        return (
                            <article key={id || nomeCarro(carro)} className={css.card}>
                                <img
                                    src={imagemCarro(API, carro)}
                                    alt={nomeCarro(carro)}
                                    onError={(e) => {
                                        e.currentTarget.src = "/IconCar.png";
                                    }}
                                />
                                <div className={css.info}>
                                    <h2>{nomeCarro(carro)}</h2>
                                    <p>{carro.marca || "-"} - {carro.ano_modelo || carro.ano_fabricacao || "-"}</p>
                                    <strong>{formatarPreco(carro.preco)}</strong>
                                </div>
                                <div className={css.acoes}>
                                    <button type="button" onClick={() => navigate(`/detalhesVeiculos/${id}`)}>
                                        Ver detalhes
                                    </button>
                                    <button type="button" className={css.remover} onClick={() => remover(id)}>
                                        Remover
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}

export default Favoritos;
