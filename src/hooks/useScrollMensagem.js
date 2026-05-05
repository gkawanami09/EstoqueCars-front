import { useEffect, useRef } from "react";

function useScrollMensagem(mensagem) {
    const mensagemRef = useRef(null);

    useEffect(() => {
        if (!mensagem || !mensagemRef.current) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            mensagemRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [mensagem]);

    return mensagemRef;
}

export default useScrollMensagem;
