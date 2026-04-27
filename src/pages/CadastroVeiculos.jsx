import css from "./CadastroVeiculos.module.css";
import Input from "../components/Input/Input.jsx";
import { useState } from "react";

function CadastroVeiculo({ API }) {
    const [placa, setPlaca] = useState("");
    const [renavam, setRenavam] = useState("");
    const [modelo, setModelo] = useState("");
    const [marca, setMarca] = useState("");
    const [ano, setAno] = useState("");
    const [quilometragem, setQuilometragem] = useState("");
    const [cor, setCor] = useState("");
    const [estado, setEstado] = useState("");
    const [preco, setPreco] = useState("");
    const [categoria, setCategoria] = useState("");
    const [descricao, setDescricao] = useState("");
    const [observacoes, setObservacoes] = useState("");

    const [fotos, setFotos] = useState([]);
    const [erro, setErro] = useState("");

    function adicionarFotos(e) {
        const arquivos = Array.from(e.target.files);

        if (fotos.length + arquivos.length > 5) {
            setErro("Máximo de 5 fotos.");
            return;
        }

        setFotos([...fotos, ...arquivos]);
        setErro("");
    }

    function removerFoto(index) {
        const novas = fotos.filter((_, i) => i !== index);
        setFotos(novas);
    }

    async function salvar(e) {
        e.preventDefault();

        if (!placa || !modelo || !marca) {
            setErro("Preencha os campos obrigatórios.");
            return;
        }

        const formData = new FormData();
        formData.append("placa", placa);
        formData.append("renavam", renavam);
        formData.append("modelo", modelo);
        formData.append("marca", marca);
        formData.append("ano", ano);
        formData.append("quilometragem", quilometragem);
        formData.append("cor", cor);
        formData.append("estado", estado);
        formData.append("preco", preco);
        formData.append("categoria", categoria);
        formData.append("descricao", descricao);
        formData.append("observacoes", observacoes);

        fotos.forEach((foto, i) => {
            formData.append(`foto_${i}`, foto);
        });

        const resposta = await fetch(`${API}/veiculos`, {
            method: "POST",
            body: formData
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            setErro(dados.erro || "Erro ao salvar.");
            return;
        }

        alert("Veículo cadastrado com sucesso!");
    }

    return (
        <main className={css.container}>
            <h1 className={css.titulo}>Cadastro Veículos</h1>

            <form className={css.formulario} onSubmit={salvar}>
                <div className={css.grid}>

                    {/* ESQUERDA */}
                    <div className={css.esquerda}>

                        <div className={css.documento}>
                            <select className={css.selectPequeno}>
                                <option>Status Estoque</option>
                                <option value="regular">Em estoque</option>
                                <option value="irregular">Indisponível</option>
                            </select>
                        </div>

                        <Input
                            label="Placa"
                            value={placa}
                            onChange={(e) => setPlaca(e.target.value)}
                        />

                        <Input
                            label="Renavam"
                            value={renavam}
                            onChange={(e) => setRenavam(e.target.value)}
                        />

                        <div className={css.duplo}>
                            <Input
                                label="Modelo"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                            />
                            <Input
                                label="Marca"
                                value={marca}
                                onChange={(e) => setMarca(e.target.value)}
                            />
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Ano"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                            />
                            <Input
                                label="Quilometragem"
                                value={quilometragem}
                                onChange={(e) => setQuilometragem(e.target.value)}
                            />
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Cor"
                                value={cor}
                                onChange={(e) => setCor(e.target.value)}
                            />
                            <Input
                                label="Estado de Conservação"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                            />
                        </div>

                        <div className={css.duplo}>
                            <Input
                                label="Preço de Venda"
                                value={preco}
                                onChange={(e) => setPreco(e.target.value)}
                            />

                            <select
                                className={css.select}
                                value={categoria}
                                onChange={(e) => setCategoria(e.target.value)}
                            >
                                <option value="">Categoria</option>
                                <option value="carro">Carro</option>
                                <option value="moto">Moto</option>
                            </select>
                        </div>

                        <textarea
                            className={css.descricao}
                            placeholder="Descrição"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                        />

                        <div className={css.documento}>
                            <select className={css.selectPequeno}>
                                <option>Status</option>
                                <option value="regular">Regular</option>
                                <option value="irregular">Irregular</option>
                            </select>

                            <button type="button" className={css.anexar}>
                                Anexar
                            </button>
                        </div>

                    </div>

                    {/* DIREITA */}
                    <div className={css.direita}>

                        <div className={css.preview}>
                            {fotos[0] && (
                                <img
                                    src={URL.createObjectURL(fotos[0])}
                                    alt=""
                                    style={{width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px"}}
                                />
                            )}
                        </div>

                        <div className={css.linhaFotos}>

                            {fotos.slice(0, 2).map((foto, i) => (
                                <img
                                    key={i}
                                    src={URL.createObjectURL(foto)}
                                    className={css.mini}
                                />
                            ))}

                            <label className={css.addFoto}>
                                Adicionar Fotos
                                <input
                                    type="file"
                                    multiple
                                    hidden
                                    onChange={adicionarFotos}
                                />
                            </label>

                        </div>
                    </div>

                </div>

                <textarea
                    className={css.observacoes}
                    placeholder="Observações"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                />

                <div className={css.botoes}>
                    <button type="submit" className={css.salvar}>Salvar</button>
                    <button type="button" className={css.cancelar}>Cancelar</button>
                </div>

            </form>
        </main>
    );
}

export default CadastroVeiculo;