import css from "./ModalConfirmacao.module.css";

function ModalConfirmacao({
    aberto,
    titulo,
    texto,
    destaque,
    textoCancelar = "Cancelar",
    textoConfirmar = "Confirmar",
    carregando = false,
    onCancelar,
    onConfirmar
}) {
    if (!aberto) {
        return null;
    }

    return (
        <div className={css.fundo} role="presentation" onClick={onCancelar}>
            <div
                className={css.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-confirmacao-titulo"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={css.icone}>!</div>
                <h2 id="modal-confirmacao-titulo" className={css.titulo}>
                    {titulo}
                </h2>
                <p className={css.texto}>
                    {texto}
                    {destaque && (
                        <>
                            {" "}
                            <strong>{destaque}</strong>
                        </>
                    )}
                </p>

                <div className={css.acoes}>
                    <button type="button" className={css.cancelar} onClick={onCancelar}>
                        {textoCancelar}
                    </button>
                    <button type="button" className={css.confirmar} onClick={onConfirmar} disabled={carregando}>
                        {carregando ? "Aguarde..." : textoConfirmar}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ModalConfirmacao;
