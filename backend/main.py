# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Query,Body
from sqlalchemy.orm import Session
from backend import modelo as models
from backend import esquemas as schemas
from backend.database import Base, engine, SessionLocal
import pandas as pd
import numpy as np
from rapidfuzz import fuzz, process
import os
from typing import Optional
from backend.modelo import Combustivel, Consumo, Emissao, Favorito,Veiculo
from backend.esquemas import VeiculoFavorito, FavoritoCreate
import hashlib


# cria tabelas (se ainda não criadas)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SMVBR API")

# ---------- Dependência DB ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- Rotas de usuário (suas já existentes) ----------
@app.post("/cadastro", response_model=schemas.UsuarioResponse)
def cadastro(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")
    novo = models.Usuario(nome=usuario.nome, email=usuario.email, senha=usuario.senha)
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo
    
@app.post("/login")
def login(usuario: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if not user or user.senha != usuario.senha:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    # Retorna o id e o nome do usuário para uso no app
    return {
        "usuario_id": user.usuario_id,
        "nome": user.nome,
        "email": user.email,
        "message": f"Bem-vindo {user.nome}!"
    }


@app.get("/usuarios", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(models.Usuario).all()
    return usuarios


# ---------- Função utilitária ----------
def find_col_insensitive(df: pd.DataFrame, candidates):
    """Retorna o nome da primeira coluna do df que contenha qualquer candidato (ignora maiúsculas e espaços)."""
    cols = list(df.columns)
    cols_norm = {c.replace(" ", "").lower(): c for c in cols}
    for cand in candidates:
        key = cand.replace(" ", "").lower()
        for k, orig in cols_norm.items():
            if key in k:
                return orig
    return None


@app.get("/filtro-carros")
def filtro_carros(
    ano: Optional[int] = Query(None),
    grupo: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    motor: Optional[str] = Query(None),
    transmissao: Optional[str] = Query(None),
    ar_condicionado: Optional[str] = Query(None),
    direcao_assistida: Optional[str] = Query(None),
    combustivel: Optional[str] = Query(None),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=200)
):
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho = os.path.join(ROOT_DIR, "data", "database.xlsx")

    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Arquivo da planilha não encontrado")

    try:
        df = pd.read_excel(caminho)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao abrir planilha: {e}")

    df.columns = [c.strip() for c in df.columns]
    df_work = df.copy()

    # -------- Aplicar filtros --------
    if ano is not None:
        col = find_col_insensitive(df_work, ["ANO", "Ano", "ano"])
        if col:
            df_work = df_work[pd.to_numeric(df_work[col], errors="coerce") == int(ano)]

    if grupo:
        col = find_col_insensitive(df_work, ["GRUPO", "Grupo"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(grupo.lower(), na=False)]

    if marca:
        col = find_col_insensitive(df_work, ["MARCA", "Marca"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(marca.lower(), na=False)]

    if motor:
        col = find_col_insensitive(df_work, ["FAIXA", "Faixa"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(motor.lower(), na=False)]

    if transmissao:
        col = find_col_insensitive(df_work, ["CÂMBIO" "Câmbio"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(transmissao.lower(), na=False)]

    if ar_condicionado:
        col = find_col_insensitive(df_work, ["AR-CONDICIONADO", "Ar-Condicionado", "AR CONDICIONADO"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(ar_condicionado.lower(), na=False)]

    if direcao_assistida:
        col = find_col_insensitive(df_work, ["DIRECAO ASSISTIDA", "Direção Assistida"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(direcao_assistida.lower(), na=False)]

    if combustivel:
        col = find_col_insensitive(df_work, ["COMBUSTÍVEL", "Combustivel", "Combustível"])
        if col:
            df_work = df_work[df_work[col].astype(str).str.lower().str.contains(combustivel.lower(), na=False)]

    # -------- Ordenar por Ranking (do maior para o menor) --------
    col_ranking = find_col_insensitive(df_work, ["Pontuação Final"])
    if col_ranking:
        df_work[col_ranking] = pd.to_numeric(df_work[col_ranking], errors="coerce")
        df_work = df_work.sort_values(by=col_ranking, ascending=False)

    # -------- Paginação --------
    total = len(df_work)
    inicio = (pagina - 1) * limite
    fim = inicio + limite
    page = df_work.iloc[inicio:fim]

    # -------- Converter para JSON seguro --------
    def df_to_json_safe(df_in):
        dfj = df_in.replace({np.nan: None, np.inf: None, -np.inf: None})
        return dfj.to_dict(orient="records")

    resultados = df_to_json_safe(page)

    return {"total": total, "pagina": pagina, "limite": limite, "resultados": resultados}



# -------------------------
# Função auxiliar
# -------------------------
def pandas_to_json_safe(df: pd.DataFrame):
    """Converte um DataFrame do Pandas para lista de dicionários pronta para JSON"""
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    if "nota sobre os dados faltantes" in df.columns:
        df = df.drop(columns=["nota sobre os dados faltantes"])

    for col in df.select_dtypes(include=["datetime64[ns]", "datetime64[ns, UTC]"]).columns:
        df[col] = df[col].apply(lambda x: x.isoformat() if x is not None else None)

    return df.to_dict(orient="records")



#Consulta carros na planilha (versão simplificada e #otimizada)
#-------------------------
@app.get("/carros")
def listar_carros(busca: str = Query(None, description="Pesquisar por marca, modelo ou ano")):
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho = os.path.join(ROOT_DIR, "data", "database.xlsx")

    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Arquivo da planilha não encontrado")

    try:
        df = pd.read_excel(caminho)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao carregar a planilha: {str(e)}")

    # Normaliza colunas
    df.columns = [c.strip().lower() for c in df.columns]
    for col in ["marca", "modelo", "ano", "codigo"]:
        if col not in df.columns:
            raise HTTPException(status_code=500, detail=f"Coluna '{col}' ausente na planilha")
        df[col] = df[col].fillna("").astype(str).str.strip().str.upper()

    # Se não tem busca, retorna tudo
    if not busca:
        return {"carros": pandas_to_json_safe(df), "total": len(df)}

    # Busca direta
    termos = busca.strip().upper().split()
    df_filtrado = df.copy()
    for termo in termos:
        df_filtrado = df_filtrado[
            df_filtrado["marca"].str.contains(termo, na=False) |
            df_filtrado["modelo"].str.contains(termo, na=False) |
            df_filtrado["ano"].str.contains(termo, na=False)
        ]
        if df_filtrado.empty:
            break

    # Se achou, retorna
    if not df_filtrado.empty:
        return {"carros": pandas_to_json_safe(df_filtrado), "total": len(df_filtrado)}

    # Se não achou → fuzzy match (marca, modelo ou ano)
    valores_validos = pd.concat([df["marca"], df["modelo"], df["ano"]]).unique()
    sugestao, score, _ = process.extractOne(termos[0], valores_validos, scorer=fuzz.WRatio)

    if score >= 70:
        df_sugerido = df[
            df["marca"].str.contains(sugestao, na=False) |
            df["modelo"].str.contains(sugestao, na=False) |
            df["ano"].str.contains(sugestao, na=False)
        ]
        return {
            "mensagem": f"Nenhum carro encontrado com '{busca}', exibindo resultados semelhantes a '{sugestao}'",
            "carros": pandas_to_json_safe(df_sugerido),
            "total": len(df_sugerido)
        }

    # Se nem fuzzy achou
    return {"mensagem": f"Nenhum carro encontrado com '{busca}'", "carros": [], "total": 0}
@app.post("/favoritar/{usuario_id}")
def favoritar_veiculo(usuario_id: int, codigo: str = Body(..., embed=True), db: Session = Depends(get_db)):
    """
    Favorita um veículo baseado no código existente na planilha.
    O front envia: { "codigo": "COD12345" }
    """

    # Caminho da planilha
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho = os.path.join(ROOT_DIR, "data", "database.xlsx")

    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Arquivo da planilha não encontrado")

    # Lê a planilha
    df = pd.read_excel(caminho)

    # Normaliza colunas: remove espaços, acentos, coloca lower
    df.columns = [
        c.strip().lower()
        .replace(" ", "_")
        .replace("-", "_")
        .replace("(", "")
        .replace(")", "")
        .replace("ç", "c")
        .replace("ã", "a")
        .replace("â", "a")
        .replace("é", "e")
        .replace("ê", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ô", "o")
        .replace("ú", "u")
    for c in df.columns
    ]

    # Normaliza coluna de código
    if "codigo" not in df.columns:
        raise HTTPException(status_code=500, detail="Coluna 'codigo' ausente na planilha")

    df["codigo"] = df["codigo"].astype(str).str.strip()
    codigo = str(codigo).strip()

    # Busca o carro pelo código
    carro = df[df["codigo"] == codigo.upper()].to_dict(orient="records")
    if not carro:
        raise HTTPException(status_code=404, detail=f"Nenhum carro encontrado com código {codigo}")
    carro = carro[0]

    # --- Cria ou busca combustível ---
    combustivel_tipo = carro.get("combustivel", "N/A")
    if combustivel_tipo:
        combustivel_tipo = combustivel_tipo.strip().upper()
    else:
        combustivel_tipo = "N/A"

    combustivel = db.query(Combustivel).filter(Combustivel.tipo == combustivel_tipo).first()
    if not combustivel:
        combustivel = Combustivel(tipo=combustivel_tipo)
        db.add(combustivel)
        db.commit()
        db.refresh(combustivel)

    # --- Converte ar_condicionado ---
    ar_condicionado = carro.get("ar_condicionado", "N")
    if isinstance(ar_condicionado, str):
        ar_condicionado = ar_condicionado.strip().lower() in ["sim", "s", "true", "1"]
    else:
        ar_condicionado = bool(ar_condicionado)

    # --- Converte direcao_assistida ---
    direcao_assistida = carro.get("direcao_assistida", "M")
    if direcao_assistida not in ["H", "E", "H-E", "M"]:
        direcao_assistida = "M"

    # --- Lê o scoreFinal (Pontuação Final da planilha) ---
    score_final = float(carro.get("pontuacao_final") or 0)

    # --- Cria ou busca veículo ---
    veiculo = db.query(Veiculo).filter_by(codigo=carro["codigo"]).first()
    if not veiculo:
        veiculo = Veiculo(
            codigo=carro["codigo"],
            ano=int(carro.get("ano", 0)),
            categoria=carro.get("categoria"),
            marca=carro.get("marca"),
            modelo=carro.get("modelo"),
            versao=carro.get("versao"),
            motor=carro.get("motor"),
            transmissao=carro.get("transmissao"),
            ar_condicionado=ar_condicionado,
            direcao_assistida=direcao_assistida,
            scoreFinal=score_final  # 👈 adiciona a pontuação
        )
        db.add(veiculo)
        db.commit()
        db.refresh(veiculo)

    # --- Cria emissões ---
    emissao = Emissao(
        veiculo_id=veiculo.veiculo_id,
        combustivel_id=combustivel.combustivel_id,
        nmhc=float(carro.get("emissao_de_nmhc_g/km") or 0),
        co=float(carro.get("emissao_de_co_g/km") or 0),
        nox=float(carro.get("emissao_de_nox_g/km") or 0),
        co2=float(
            carro.get("emissao_de_co2_gas_efeito_estufa_a_produzido_pela_combustao_do_etanol_g/km")
            or carro.get("emissao_de_co2_gas_efeito_estufa_a_produzido_pela_combustao_da_gasolina_ou_diesel__g/km")
            or 0
        )
    )
    db.add(emissao)

    # --- Cria consumo ---
    consumo = Consumo(
        veiculo_id=veiculo.veiculo_id,
        combustivel_id=combustivel.combustivel_id,
        rendimento_cidade=float(
            carro.get("rendimento_da_gasolina_ou_diesel_na_cidade_km/l")
            or carro.get("rendimento_do_etanol_na_cidade_km/l")
            or 0
        ),
        rendimento_estrada=float(
            carro.get("rendimento_da_gasolina_ou_diesel_estrada_km/l")
            or carro.get("rendimento_do_etanol_na_estrada_km/l")
            or 0
        ),
        consumo_energetico=float(carro.get("consumo_energetico_mj/km") or 0)
    )
    db.add(consumo)
    db.commit()

    # --- ADICIONA OU REMOVE FAVORITO ---
    favorito_existente = db.query(Favorito).filter_by(usuario_id=usuario_id, veiculo_id=veiculo.veiculo_id).first()
    if favorito_existente:
        db.delete(favorito_existente)
        msg = "Veículo removido dos favoritos."
    else:
        novo_fav = Favorito(usuario_id=usuario_id, veiculo_id=veiculo.veiculo_id)
        db.add(novo_fav)
        msg = "Veículo adicionado aos favoritos."

    db.commit()
    print("Colunas normalizadas:", df.columns.tolist())


    return {
        "mensagem": msg,
        "veiculo_id": veiculo.veiculo_id,
        "scoreFinal": score_final
    }




from sqlalchemy.orm import joinedload

@app.get("/veiculos_favoritos/{usuario_id}")
def get_veiculos_favoritos(usuario_id: int, db: Session = Depends(get_db)):
    # Busca todos os veículos favoritos do usuário com JOINs automáticos
    favoritos = (
        db.query(models.Favorito)
        .options(
            joinedload(models.Favorito.veiculo)
            .joinedload(models.Veiculo.emissoes)
            .joinedload(models.Emissao.combustivel),
            joinedload(models.Favorito.veiculo)
            .joinedload(models.Veiculo.consumos)
            .joinedload(models.Consumo.combustivel),
        )
        .filter(models.Favorito.usuario_id == usuario_id)
        .all()
    )

    if not favoritos:
        raise HTTPException(status_code=404, detail="Nenhum veículo favorito encontrado.")

    resultado = []

    for fav in favoritos:
        veiculo = fav.veiculo
        if not veiculo:
            continue

        # Pega o primeiro combustível encontrado (caso haja mais de um)
        emissao = veiculo.emissoes[0] if veiculo.emissoes else None
        consumo = veiculo.consumos[0] if veiculo.consumos else None

        resultado.append({
            "veiculo_id": veiculo.veiculo_id,
            "ano": veiculo.ano,
            "categoria": veiculo.categoria,
            "marca": veiculo.marca,
            "modelo": veiculo.modelo,
            "versao": veiculo.versao,
            "motor": veiculo.motor,
            "transmissao": veiculo.transmissao,
            "ar_condicionado": veiculo.ar_condicionado,
            "direcao_assistida": veiculo.direcao_assistida,
            "combustivel": (
                emissao.combustivel.tipo
                if emissao and emissao.combustivel
                else consumo.combustivel.tipo
                if consumo and consumo.combustivel
                else None
            ),

            # Dados de emissão (se houver)
            "emissao_nmhc": float(emissao.nmhc) if emissao and emissao.nmhc else None,
            "emissao_co": float(emissao.co) if emissao and emissao.co else None,
            "emissao_nox": float(emissao.nox) if emissao and emissao.nox else None,
            "emissao_co2": float(emissao.co2) if emissao and emissao.co2 else None,

            # Dados de consumo (se houver)
            "rendimento_cidade": float(consumo.rendimento_cidade) if consumo and consumo.rendimento_cidade else None,
            "rendimento_estrada": float(consumo.rendimento_estrada) if consumo and consumo.rendimento_estrada else None,
            "consumo_energetico": float(consumo.consumo_energetico) if consumo and consumo.consumo_energetico else None,
        })

    return resultado
    
@app.get("/comparar-carros")
def comparar_carros(id1: int, id2: int, db: Session = Depends(get_db)):
    # Busca os veículos pelo ID correto (veiculo_id)
    veiculo1 = db.query(Veiculo).filter(Veiculo.veiculo_id == id1).first()
    veiculo2 = db.query(Veiculo).filter(Veiculo.veiculo_id == id2).first()

    if not veiculo1 or not veiculo2:
        raise HTTPException(status_code=404, detail="Um ou ambos os veículos não foram encontrados")

    # Busca emissões e consumo associados
    emissao1 = db.query(Emissao).filter(Emissao.veiculo_id == id1).first()
    emissao2 = db.query(Emissao).filter(Emissao.veiculo_id == id2).first()

    consumo1 = db.query(Consumo).filter(Consumo.veiculo_id == id1).first()
    consumo2 = db.query(Consumo).filter(Consumo.veiculo_id == id2).first()

    # Verificação de dados ausentes
    if not emissao1 or not emissao2:
        raise HTTPException(status_code=404, detail="Faltam dados de emissões para um dos veículos")
    if not consumo1 or not consumo2:
        raise HTTPException(status_code=404, detail="Faltam dados de consumo para um dos veículos")

    # Retorna comparação
    return {
        "carro1": {
            "marca": veiculo1.marca,
            "modelo": veiculo1.modelo,
            "ano": veiculo1.ano,
            "versao": veiculo1.versao,
            "combustivel_id": emissao1.combustivel_id,
            "nmhc": float(emissao1.nmhc or 0),
            "co": float(emissao1.co or 0),
            "nox": float(emissao1.nox or 0),
            "co2": float(emissao1.co2 or 0),
            "rendimento_cidade": float(consumo1.rendimento_cidade or 0),
            "rendimento_estrada": float(consumo1.rendimento_estrada or 0),
            "consumo_energetico": float(consumo1.consumo_energetico or 0),
            "scoreFinal": float(veiculo1.scoreFinal or 0),
        },
        "carro2": {
            "marca": veiculo2.marca,
            "modelo": veiculo2.modelo,
            "ano": veiculo2.ano,
            "versao": veiculo2.versao,
            "combustivel_id": emissao2.combustivel_id,
            "nmhc": float(emissao2.nmhc or 0),
            "co": float(emissao2.co or 0),
            "nox": float(emissao2.nox or 0),
            "co2": float(emissao2.co2 or 0),
            "rendimento_cidade": float(consumo2.rendimento_cidade or 0),
            "rendimento_estrada": float(consumo2.rendimento_estrada or 0),
            "consumo_energetico": float(consumo2.consumo_energetico or 0),
            "scoreFinal": float(veiculo2.scoreFinal or 0),
        }
    }
   