export function cabecalhoAutorizacao() {
    const token = localStorage.getItem("access_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function idPeloToken() {
    const token = localStorage.getItem("access_token");

    if (!token || !token.includes(".")) {
        return "";
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return payload.id_user || payload.id_usuario || payload.id || "";
    } catch {
        return "";
    }
}

export function lerUsuarioLogado() {
    try {
        return JSON.parse(localStorage.getItem("usuario_logado") || "{}") || {};
    } catch {
        return {};
    }
}

export function idUsuarioLogado() {
    const usuario = lerUsuarioLogado();
    return usuario.id_usuario || usuario.id_user || usuario.id || usuario.ID_USUARIO || idPeloToken() || "anonimo";
}

export function usuarioPodeFavoritar() {
    const usuarioSalvo = localStorage.getItem("usuario_logado") || localStorage.getItem("usuário_logado");

    if (!usuarioSalvo) {
        return false;
    }

    try {
        const usuario = JSON.parse(usuarioSalvo);
        const tipoUsuario = Number(usuario.tipo_usuario ?? usuario["tipo_usuário"]);
        return [0, 1, 2].includes(tipoUsuario);
    } catch {
        return false;
    }
}

export function idCarroFavorito(carro) {
    return carro?.id || carro?.id_veiculo || carro?.ID_VEICULO || carro?.id_carro || carro?.ID_CARRO;
}

export function carroEstaFavoritado(carro) {
    const valor = carro?.favorito ?? carro?.FAVORITO ?? carro?.favoritado ?? carro?.FAVORITADO ?? carro?.is_favorito ?? carro?.IS_FAVORITO ?? carro?.id_favorito ?? carro?.ID_FAVORITO;
    return valor === true || valor === 1 || String(valor).toLowerCase() === "true";
}

export function chaveFavoritos(idUsuario = idUsuarioLogado()) {
    return `favoritos_usuario_${idUsuario || "anonimo"}`;
}

export function lerFavoritosLocais(idUsuario = idUsuarioLogado()) {
    try {
        const favoritos = JSON.parse(localStorage.getItem(chaveFavoritos(idUsuario)) || "[]");
        return Array.isArray(favoritos) ? favoritos : [];
    } catch {
        return [];
    }
}

export function salvarFavoritosLocais(favoritos, idUsuario = idUsuarioLogado()) {
    localStorage.setItem(chaveFavoritos(idUsuario), JSON.stringify(favoritos));
}

export function aplicarFavoritosLocais(carros, idUsuario = idUsuarioLogado()) {
    const idsFavoritos = new Set(lerFavoritosLocais(idUsuario).map((carro) => String(idCarroFavorito(carro))));

    return carros.map((carro) => ({
        ...carro,
        favorito: carroEstaFavoritado(carro) || idsFavoritos.has(String(idCarroFavorito(carro)))
    }));
}

export function alternarFavoritoLocal(carro, idUsuario = idUsuarioLogado()) {
    const id = idCarroFavorito(carro);
    const favoritos = lerFavoritosLocais(idUsuario);
    const jaFavorito = favoritos.some((item) => String(idCarroFavorito(item)) === String(id));
    const proximaLista = jaFavorito
        ? favoritos.filter((item) => String(idCarroFavorito(item)) !== String(id))
        : [{ ...carro, favorito: true }, ...favoritos];

    salvarFavoritosLocais(proximaLista, idUsuario);
    return !jaFavorito;
}

export function extrairListaFavoritos(dados) {
    if (Array.isArray(dados)) {
        return dados;
    }

    if (Array.isArray(dados?.favoritos)) {
        return dados.favoritos;
    }

    if (Array.isArray(dados?.veiculos)) {
        return dados.veiculos;
    }

    if (Array.isArray(dados?.carros)) {
        return dados.carros.filter(carroEstaFavoritado);
    }

    return [];
}
