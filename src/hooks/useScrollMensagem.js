import { useEffect, useRef } from "react";

function useScrollMensagem(valor) {
    const ref = useRef(null);

    useEffect(() => {
        if (valor) {
            ref.current?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }, [valor]);

    return ref;
}

export default useScrollMensagem;
