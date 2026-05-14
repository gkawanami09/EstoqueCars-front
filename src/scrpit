/*
    Script para cadastrar 45 veículos de uma vez.

    Como usar:
    1. Abra o frontend no navegador, por exemplo http://localhost:5173.
    2. Faça login como administrador.
    3. Abra o DevTools, vá em Console.
    4. Cole este script inteiro e aperte Enter.

    Ele busca as marcas e categorias já cadastradas no banco e envia os carros
    para a rota POST /cadastrar_carro usando FormData, igual ao formulário.

    Observação: o RENAVAM é gerado automaticamente com dígito verificador válido.
    Os números que aparecem na lista são substituídos antes do cadastro.
*/

(async function cadastrarVeiculosEmMassa() {
    const API = "http://localhost:5000";

    const token = localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const veiculos = [
        { categoria: "SUV", marca: "BMW", modelo: "X6", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "7860", cor: "Preto", cambio: "1", preco: "740000", descricao: "SUV cupê de luxo com alto desempenho, acabamento premium e presença esportiva.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "RLJ8E48", renavam: "33048836385", imagem: "/CarBMW.png" },
        { categoria: "Esportivo", marca: "FORD", modelo: "Mustang", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "1200", cor: "Vermelho", cambio: "1", preco: "529900", descricao: "Esportivo com motor forte, visual agressivo e condução voltada para performance.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "MUS4T24", renavam: "82138435833", imagem: "/CarMustang.png" },
        { categoria: "Elétrico", marca: "BYD", modelo: "Dolphin", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "3500", cor: "Cinza", cambio: "1", preco: "149800", descricao: "Hatch elétrico moderno, econômico e ideal para uso urbano com ótima tecnologia.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "BYD4E24", renavam: "30824742194", imagem: "/CarBYDDolphin.png" },
        { categoria: "Caminhonete", marca: "TOYOTA", modelo: "Hilux", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "18500", cor: "Branco", cambio: "1", preco: "319900", descricao: "Caminhonete robusta, confortável e preparada para trabalho ou lazer.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "HIL2X24", renavam: "03162824194", imagem: "/CarToyotaHilux.png" },
        { categoria: "Sedan", marca: "HONDA", modelo: "Civic", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "26000", cor: "Prata", cambio: "1", preco: "156900", descricao: "Sedan confortável, confiável e com excelente dirigibilidade para o dia a dia.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CIV2C23", renavam: "71938462015", imagem: "/CarHondaCivic.png" },
        { categoria: "SUV", marca: "JEEP", modelo: "Renegade", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "42000", cor: "Cinza", cambio: "1", preco: "104900", descricao: "SUV compacto com boa posição de dirigir, conforto e estilo aventureiro.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "JEP1R22", renavam: "59372841026", imagem: "/CarJeepRenegade.png" },
        { categoria: "Caminhonete", marca: "FIAT", modelo: "Toro", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "33000", cor: "Branco", cambio: "1", preco: "136900", descricao: "Caminhonete intermediária com bom espaço interno, caçamba prática e consumo equilibrado.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "TOR2O23", renavam: "68492017354", imagem: "/CarFiatToro.png" },
        { categoria: "Sedan", marca: "HYUNDAI", modelo: "HB20", ano_fabricacao: "2019", ano_modelo: "2019", quilometragem: "80000", cor: "Chumbo", cambio: "2", preco: "53000", descricao: "Hatch compacto conhecido pelo design moderno, economia e manutenção acessível.", estado_conservacao: "2", status_documento: "1", status_estoque: "1", placa: "HB2O919", renavam: "12983746501", imagem: "/CarHB20.png" },
        { categoria: "Sedan", marca: "FIAT", modelo: "Cronos", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "36500", cor: "Prata", cambio: "1", preco: "82900", descricao: "Sedan compacto com porta-malas amplo, bom consumo e acabamento confortável.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CRN2S22", renavam: "48271936502", imagem: "/CarFiatCronos.png" },
        { categoria: "Sedan", marca: "FIAT", modelo: "Siena", ano_fabricacao: "2018", ano_modelo: "2019", quilometragem: "92000", cor: "Branco", cambio: "2", preco: "45900", descricao: "Sedan econômico, simples de manter e indicado para uso diário.", estado_conservacao: "2", status_documento: "1", status_estoque: "1", placa: "SIE8N19", renavam: "57392018465", imagem: "/CarFiatSiena.png" },
        { categoria: "SUV", marca: "CAOA CHERY", modelo: "Tiggo 5x Turbo", ano_fabricacao: "2020", ano_modelo: "2021", quilometragem: "9000", cor: "Chumbo", cambio: "1", preco: "108900", descricao: "SUV turbo com bom pacote de tecnologia, conforto e espaço interno.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "TIG5X21", renavam: "65839102746", imagem: "/CarTiggo.png" },
        { categoria: "SUV", marca: "CAOA CHERY", modelo: "Tiggo Sport", ano_fabricacao: "2019", ano_modelo: "2020", quilometragem: "61000", cor: "Cinza", cambio: "1", preco: "78900", descricao: "SUV confortável, com posição alta de dirigir e boa lista de equipamentos.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "TGS9P20", renavam: "74291850367", imagem: "/CarTiggoSport.png" },
        { categoria: "SUV", marca: "HONDA", modelo: "HR-V", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "24000", cor: "Branco", cambio: "1", preco: "142900", descricao: "SUV confiável, confortável e muito procurado pela baixa manutenção.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "HRV2V23", renavam: "91827364051", imagem: "/CarHondaHrv.png" },
        { categoria: "Caminhonete", marca: "CHEVROLET", modelo: "Silverado", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "2100", cor: "Preto", cambio: "1", preco: "519900", descricao: "Picape grande com alto nível de conforto, potência e presença imponente.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "SLV4R24", renavam: "10293847566", imagem: "/CarChevroletSilverado.png" },
        { categoria: "Esportivo", marca: "PORSCHE", modelo: "911 Carrera", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "4800", cor: "Cinza", cambio: "1", preco: "980000", descricao: "Esportivo premium com desempenho de referência, acabamento refinado e design clássico.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "P911C24", renavam: "66778899001", imagem: "/CarPorshe911.png" },
        { categoria: "Esportivo", marca: "PORSCHE", modelo: "Carrera", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "7900", cor: "Prata", cambio: "1", preco: "899900", descricao: "Cupê esportivo de alto padrão, com condução precisa e motor de excelente resposta.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "PCR2A23", renavam: "11002938475", imagem: "/CarPorsheCarrera.png" },
        { categoria: "SUV", marca: "VOLVO", modelo: "XC60", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "28500", cor: "Azul", cambio: "1", preco: "279900", descricao: "SUV premium com foco em segurança, conforto e tecnologia embarcada.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "VLV6O22", renavam: "22334455667", imagem: "/CarVolvo.png" },
        { categoria: "Elétrico", marca: "GWM", modelo: "Ora 03", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "1800", cor: "Branco", cambio: "1", preco: "152900", descricao: "Elétrico urbano com visual moderno, bom alcance e ótima tecnologia.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "GWM0R24", renavam: "33445566778", imagem: "/CarGWM.png" },
        { categoria: "Sedan", marca: "NISSAN", modelo: "Sentra", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "12500", cor: "Cinza", cambio: "1", preco: "139900", descricao: "Sedan médio com conforto, bom acabamento e condução suave.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "SNT3A24", renavam: "44556677889", imagem: "/CarNissan.png" },
        { categoria: "Sedan", marca: "CHEVROLET", modelo: "Onix Plus", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "31000", cor: "Branco", cambio: "1", preco: "89900", descricao: "Sedan compacto com bom consumo, conectividade e bom espaço interno.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "ONX2P23", renavam: "55667788990", imagem: "/CarChevrolet.png" },
        { categoria: "SUV", marca: "BMW", modelo: "X1", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "37000", cor: "Branco", cambio: "1", preco: "219900", descricao: "SUV premium compacto com conforto, tecnologia e boa performance.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "BMW1X22", renavam: "66770011223", imagem: "/CarBMW.png" },
        { categoria: "SUV", marca: "BMW", modelo: "X3", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "22000", cor: "Preto", cambio: "1", preco: "339900", descricao: "SUV premium com motor forte, tração eficiente e acabamento sofisticado.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "BMW3X23", renavam: "77881122334", imagem: "/CarBMW.png" },
        { categoria: "Elétrico", marca: "BYD", modelo: "Seal", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "26000", cor: "Cinza", cambio: "1", preco: "273099.97", descricao: "Sedan elétrico com design esportivo, ótimo desempenho e tecnologia avançada.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "BYD5E24", renavam: "88992233445", imagem: "/CarBYDDolphin.png" },
        { categoria: "Elétrico", marca: "BYD", modelo: "Yuan Plus", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "12800", cor: "Azul", cambio: "1", preco: "229900", descricao: "SUV elétrico com bom espaço interno, autonomia equilibrada e ótimo acabamento.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "YUN3P24", renavam: "99003344556", imagem: "/CarBYDDolphin.png" },
        { categoria: "Caminhonete", marca: "TOYOTA", modelo: "Hilux SRX", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "39500", cor: "Prata", cambio: "1", preco: "289900", descricao: "Caminhonete diesel completa, robusta e muito valorizada no mercado.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "SRX2H23", renavam: "10112233445", imagem: "/CarToyotaHilux.png" },
        { categoria: "Caminhonete", marca: "FIAT", modelo: "Toro Volcano", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "47000", cor: "Vermelho", cambio: "1", preco: "128900", descricao: "Picape intermediária com bom acabamento, conforto e versatilidade.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "VLC1N22", renavam: "21223344556", imagem: "/CarFiatToro.png" },
        { categoria: "Sedan", marca: "HONDA", modelo: "City", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "41000", cor: "Cinza", cambio: "1", preco: "104900", descricao: "Sedan compacto com excelente aproveitamento interno e baixo consumo.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CTY1H22", renavam: "32334455667", imagem: "/CarHonda.png" },
        { categoria: "Sedan", marca: "HONDA", modelo: "Civic Touring", ano_fabricacao: "2020", ano_modelo: "2021", quilometragem: "54000", cor: "Preto", cambio: "1", preco: "139900", descricao: "Sedan turbo com bom desempenho, conforto e acabamento refinado.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CVT0T21", renavam: "43445566778", imagem: "/CarHondaCivic.png" },
        { categoria: "Sedan", marca: "HYUNDAI", modelo: "HB20S", ano_fabricacao: "2020", ano_modelo: "2021", quilometragem: "58000", cor: "Branco", cambio: "1", preco: "76900", descricao: "Sedan compacto econômico, confortável e prático para rotina urbana.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "HBS0S21", renavam: "54556677889", imagem: "/CarHyundaiHb20.png" },
        { categoria: "SUV", marca: "HYUNDAI", modelo: "Creta", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "29500", cor: "Prata", cambio: "1", preco: "132900", descricao: "SUV compacto com bom espaço, conforto e pacote completo de equipamentos.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CRT2A23", renavam: "65667788990", imagem: "/CarHyundai.png" },
        { categoria: "SUV", marca: "JEEP", modelo: "Compass", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "34000", cor: "Preto", cambio: "1", preco: "179900", descricao: "SUV médio com conforto, tecnologia e acabamento superior.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CMP2S23", renavam: "76778899001", imagem: "/CarJeep.png" },
        { categoria: "SUV", marca: "JEEP", modelo: "Commander", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "16000", cor: "Branco", cambio: "1", preco: "239900", descricao: "SUV de sete lugares com conforto, força e muita tecnologia.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CMD3R24", renavam: "87889900112", imagem: "/CarJeep.png" },
        { categoria: "Caminhonete", marca: "CHEVROLET", modelo: "S10", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "52000", cor: "Prata", cambio: "1", preco: "189900", descricao: "Caminhonete diesel com bom desempenho, conforto e capacidade de carga.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "S10C022", renavam: "98990011223", imagem: "/CarChevroletSilverado.png" },
        { categoria: "Sedan", marca: "CHEVROLET", modelo: "Cruze", ano_fabricacao: "2020", ano_modelo: "2021", quilometragem: "69000", cor: "Cinza", cambio: "1", preco: "105900", descricao: "Sedan turbo com bom desempenho, conforto e consumo equilibrado.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CRZ0E21", renavam: "19001122334", imagem: "/CarChevrolet.png" },
        { categoria: "SUV", marca: "FIAT", modelo: "Pulse", ano_fabricacao: "2022", ano_modelo: "2022", quilometragem: "15000", cor: "Vermelho", cambio: "1", preco: "75000", descricao: "SUV compacto urbano com visual moderno, bom consumo e manutenção acessível.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "PLS2E22", renavam: "30112233445", imagem: "/CarFiat.png" },
        { categoria: "SUV", marca: "NISSAN", modelo: "Kicks", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "45500", cor: "Branco", cambio: "1", preco: "99900", descricao: "SUV compacto econômico, confortável e muito fácil de dirigir.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "KCK1S22", renavam: "41223344556", imagem: "/CarNissan.png" },
        { categoria: "Sedan", marca: "NISSAN", modelo: "Versa", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "27000", cor: "Azul", cambio: "1", preco: "92900", descricao: "Sedan compacto com ótimo espaço interno e bom pacote de segurança.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "VRS2A23", renavam: "52334455667", imagem: "/CarNissan.png" },
        { categoria: "SUV", marca: "VOLVO", modelo: "XC40", ano_fabricacao: "2023", ano_modelo: "2024", quilometragem: "11000", cor: "Preto", cambio: "1", preco: "259900", descricao: "SUV premium moderno, seguro e com acabamento de alto nível.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "XC4V024", renavam: "63445566778", imagem: "/CarVolvo.png" },
        { categoria: "Elétrico", marca: "VOLVO", modelo: "EX30", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "900", cor: "Azul", cambio: "1", preco: "219900", descricao: "SUV elétrico compacto com ótimo desempenho, segurança e design moderno.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "EX3V024", renavam: "74556677889", imagem: "/CarVolvo.png" },
        { categoria: "Elétrico", marca: "GWM", modelo: "Haval H6", ano_fabricacao: "2024", ano_modelo: "2024", quilometragem: "6200", cor: "Cinza", cambio: "1", preco: "224900", descricao: "SUV híbrido moderno com tecnologia, conforto e excelente desempenho.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "HVL6H24", renavam: "85667788990", imagem: "/CarGWM.png" },
        { categoria: "SUV", marca: "CAOA CHERY", modelo: "Tiggo 7 Pro", ano_fabricacao: "2022", ano_modelo: "2023", quilometragem: "26000", cor: "Preto", cambio: "1", preco: "158900", descricao: "SUV espaçoso com acabamento refinado, tecnologia e motor turbo.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "TG7P023", renavam: "96778899001", imagem: "/CarTiggo.png" },
        { categoria: "SUV", marca: "CAOA CHERY", modelo: "Tiggo 8", ano_fabricacao: "2021", ano_modelo: "2022", quilometragem: "44000", cor: "Branco", cambio: "1", preco: "169900", descricao: "SUV de sete lugares, confortável e completo para a família.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "TG8C022", renavam: "17889900112", imagem: "/CarTiggoSport.png" },
        { categoria: "Esportivo", marca: "CHEVROLET", modelo: "Camaro", ano_fabricacao: "2019", ano_modelo: "2020", quilometragem: "23000", cor: "Amarelo", cambio: "1", preco: "389900", descricao: "Muscle car com motor potente, visual marcante e desempenho empolgante.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CMR9O20", renavam: "28990011223", imagem: "/CarChevrolet.png" },
        { categoria: "Esportivo", marca: "HONDA", modelo: "Civic Si", ano_fabricacao: "2018", ano_modelo: "2019", quilometragem: "59000", cor: "Vermelho", cambio: "2", preco: "179900", descricao: "Esportivo manual com condução envolvente e excelente acerto dinâmico.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "CSI8I19", renavam: "39001122334", imagem: "/CarHondaCivic.png" },
        { categoria: "Esportivo", marca: "BMW", modelo: "M2", ano_fabricacao: "2020", ano_modelo: "2021", quilometragem: "21000", cor: "Azul", cambio: "1", preco: "459900", descricao: "Cupê esportivo compacto com motor forte, tração traseira e comportamento preciso.", estado_conservacao: "1", status_documento: "1", status_estoque: "1", placa: "BM2M021", renavam: "40112233445", imagem: "/CarBMW.png" }
    ];

    function normalizarTexto(valor) {
        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();
    }

    function idRegistro(item) {
        return item.id || item.id_categoria || item.ID_CATEGORIA || item.id_marca || item.ID_MARCA;
    }

    function nomeRegistro(item) {
        return item.nome || item.nome_categoria || item.categoria || item.marca || item.descricao || item.DESCRICAO;
    }

    async function buscarLista(rota, campoPreferido) {
        const resposta = await fetch(`${API}${rota}`, {
            method: "POST",
            headers,
            credentials: "include"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.mensagem || `Erro ao buscar ${rota}`);
        }

        const lista = dados[campoPreferido] || dados.categorias || dados.marcas || dados;
        return Array.isArray(lista) ? lista : [];
    }

    function procurarId(lista, nome) {
        const alvo = normalizarTexto(nome);
        const item = lista.find((registro) => normalizarTexto(nomeRegistro(registro)) === alvo);

        if (!item) {
            throw new Error(`Não encontrei cadastro para "${nome}". Cadastre essa marca/categoria antes.`);
        }

        return idRegistro(item);
    }

    async function arquivoImagem(caminho, nomeArquivo) {
        const resposta = await fetch(caminho);

        if (!resposta.ok) {
            throw new Error(`Imagem não encontrada: ${caminho}`);
        }

        const blob = await resposta.blob();
        return new File([blob], nomeArquivo, { type: blob.type || "image/png" });
    }

    function limparPlaca(valor) {
        return String(valor || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 7);
    }

    function limparRenavam(valor) {
        return String(valor || "").replace(/\D/g, "").slice(0, 11);
    }

    function calcularDigitoRenavam(base10) {
        const base = String(base10 || "").replace(/\D/g, "").padStart(10, "0").slice(-10);
        const pesos = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const soma = base
            .split("")
            .reduce((total, numero, indice) => total + Number(numero) * pesos[indice], 0);
        const resto = soma % 11;
        const digito = 11 - resto >= 10 ? 0 : 11 - resto;

        return `${base}${digito}`;
    }

    function gerarRenavamValido(posicao) {
        const base = 1000000000 + posicao * 7919;
        return calcularDigitoRenavam(base);
    }

    function validarVeiculosAntesDeCadastrar() {
        const placas = new Set();
        const renavams = new Set();
        const erros = [];

        veiculos.forEach((veiculo, indice) => {
            const posicao = indice + 1;
            const placa = limparPlaca(veiculo.placa);
            const renavam = gerarRenavamValido(posicao);

            veiculo.renavam = renavam;

            if (placa.length !== 7) {
                erros.push(`Veículo ${posicao} (${veiculo.modelo}): placa precisa ter 7 caracteres.`);
            }

            if (renavam.length !== 11) {
                erros.push(`Veículo ${posicao} (${veiculo.modelo}): RENAVAM precisa ter 11 números.`);
            }

            if (placas.has(placa)) {
                erros.push(`Veículo ${posicao} (${veiculo.modelo}): placa repetida ${placa}.`);
            }

            if (renavams.has(renavam)) {
                erros.push(`Veículo ${posicao} (${veiculo.modelo}): RENAVAM repetido ${renavam}.`);
            }

            placas.add(placa);
            renavams.add(renavam);
        });

        if (erros.length > 0) {
            console.error("Corrija estes dados antes de cadastrar:");
            erros.forEach((erro) => console.error(erro));
            throw new Error("Existem placas ou RENAVAMs inválidos no script.");
        }
    }

    async function cadastrarVeiculo(veiculo, categorias, marcas) {
        const formData = new FormData();
        const idCategoria = procurarId(categorias, veiculo.categoria);
        const idMarca = procurarId(marcas, veiculo.marca);
        const nomeImagem = `${veiculo.modelo.replace(/\s+/g, "_").toLowerCase()}.png`;

        formData.append("id_categoria", idCategoria);
        formData.append("id_marca", idMarca);
        formData.append("modelo", veiculo.modelo);
        formData.append("ano_fabricacao", veiculo.ano_fabricacao);
        formData.append("ano_modelo", veiculo.ano_modelo);
        formData.append("quilometragem", String(veiculo.quilometragem).replace(/\D/g, ""));
        formData.append("cor", veiculo.cor);
        formData.append("cambio", veiculo.cambio);
        formData.append("preco", String(veiculo.preco).replace(",", "."));
        formData.append("descricao", veiculo.descricao);
        formData.append("estado_conservacao", veiculo.estado_conservacao);
        formData.append("status_documento", veiculo.status_documento);
        formData.append("status_estoque", veiculo.status_estoque);
        formData.append("placa", limparPlaca(veiculo.placa));
        formData.append("renavam", limparRenavam(veiculo.renavam));
        formData.append("foto_veiculo", await arquivoImagem(veiculo.imagem, nomeImagem));

        const resposta = await fetch(`${API}/cadastrar_carro`, {
            method: "POST",
            headers,
            credentials: "include",
            body: formData
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || dados.mensagem || `Erro ao cadastrar ${veiculo.modelo}`);
        }

        return dados;
    }

    console.log(`Total de veículos para cadastrar: ${veiculos.length}`);
    validarVeiculosAntesDeCadastrar();
    console.table(veiculos.map((veiculo) => ({
        modelo: veiculo.modelo,
        placa: limparPlaca(veiculo.placa),
        renavam: veiculo.renavam
    })));
    console.log("Buscando categorias e marcas...");

    const categorias = await buscarLista("/buscar_categoria", "categoria");
    const marcas = await buscarLista("/buscar_marca", "marca");

    console.log(`Encontradas ${categorias.length} categorias e ${marcas.length} marcas.`);

    for (const veiculo of veiculos) {
        try {
            console.log(`Cadastrando ${veiculo.marca} ${veiculo.modelo}...`);
            const resultado = await cadastrarVeiculo(veiculo, categorias, marcas);
            console.log(`OK: ${veiculo.modelo}`, resultado);
        } catch (erro) {
            console.error(`Erro em ${veiculo.modelo}:`, erro.message);
        }
    }

    console.log("Cadastro em massa finalizado.");
})();
