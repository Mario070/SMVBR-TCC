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
    caminho = os.path.join(ROOT_DIR, "data", "dados convertidos.xlsx")

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
    caminho = os.path.join(ROOT_DIR, "data", "dados convertidos.xlsx")

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

    # Cria ou busca combustível
    combustivel_tipo = carro.get("combustivel", "N/A")
    combustivel = db.query(Combustivel).filter_by(tipo=combustivel_tipo).first()
    if not combustivel:
        combustivel = Combustivel(tipo=combustivel_tipo)
        db.add(combustivel)
        db.commit()
        db.refresh(combustivel)

    # Converte ar_condicionado para Boolean
    ar_condicionado = carro.get("ar_condicionado", "N")
    if isinstance(ar_condicionado, str):
        ar_condicionado = ar_condicionado.strip().lower() in ["sim", "s", "true", "1"]
    else:
        ar_condicionado = bool(ar_condicionado)

    # Converte direcao_assistida para Enum válido
    direcao_assistida = carro.get("direcao_assistida", "M")
    if direcao_assistida not in ["H", "E", "H-E", "M"]:
        direcao_assistida = "M"

    # Verifica se o veículo já existe
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
            direcao_assistida=direcao_assistida
        )
        db.add(veiculo)
        db.commit()
        db.refresh(veiculo)

        # Cria emissões
        emissao = Emissao(
            veiculo_id=veiculo.veiculo_id,
            combustivel_id=combustivel.combustivel_id,
            nmhc=float(carro.get("emissao_de_nmhc_g_km") or 0),
            co=float(carro.get("emissao_de_co_g_km") or 0),
            nox=float(carro.get("emissao_de_nox_g_km") or 0),
            co2=float(
                carro.get("emissao_de_co2_gas_efeito_estufa_a_produzido_pela_combustao_do_etanol_g_km")
                or carro.get("emissao_de_co2_gas_efeito_estufa_a_produzido_pela_combustao_da_gasolina_ou_diesel_g_km")
                or 0
            )
        )
        db.add(emissao)

        # Cria consumo
        consumo = Consumo(
            veiculo_id=veiculo.veiculo_id,
            combustivel_id=combustivel.combustivel_id,
            rendimento_cidade=float(carro.get("rendimento_da_gasolina_ou_diesel_na_cidade_km_l") or 0),
            rendimento_estrada=float(carro.get("rendimento_da_gasolina_ou_diesel_estrada_km_l") or 0),
            consumo_energetico=float(carro.get("consumo_energetico_mj_km") or 0)
        )
        db.add(consumo)
        db.commit()

    # Cria favorito se não existir
    favorito_existente = db.query(Favorito).filter_by(
        usuario_id=usuario_id,
        veiculo_id=veiculo.veiculo_id
    ).first()

    if favorito_existente:
        return {"mensagem": "Veículo já está favoritado"}

    favorito = Favorito(usuario_id=usuario_id, veiculo_id=veiculo.veiculo_id)
    db.add(favorito)
    db.commit()
    db.refresh(favorito)

    return {"mensagem": "Veículo favoritado com sucesso!"}

