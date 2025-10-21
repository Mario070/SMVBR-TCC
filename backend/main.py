# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Query
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


#-------------------------
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
    for col in ["marca", "modelo", "ano"]:
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

# Endpoint para favoritar um veículo
@app.post("/favoritar/{usuario_id}")
def favoritar_veiculo(usuario_id: int, dados: VeiculoFavorito, db: Session = Depends(get_db)):
    # 1️⃣ Cria ou busca o combustível no banco de dados
    combustivel = db.query(Combustivel).filter_by(tipo=dados.combustivel).first()
    if not combustivel:  # Se não existir, cria
        combustivel = Combustivel(tipo=dados.combustivel)
        db.add(combustivel)  # Adiciona à sessão
        db.commit()           # Salva no banco
        db.refresh(combustivel)  # Atualiza o objeto com o ID gerado

    # 2️⃣ Verifica se o veículo já existe no banco
    veiculo = db.query(Veiculo).filter_by(
        marca=dados.marca,
        modelo=dados.modelo,
        ano=dados.ano,
        versao=dados.versao
    ).first()

    # Se o veículo não existir, cria um novo
    if not veiculo:
        veiculo = Veiculo(
            ano=dados.ano,
            categoria=dados.categoria,
            marca=dados.marca,
            modelo=dados.modelo,
            versao=dados.versao,
            motor=dados.motor,
            transmissao=dados.transmissao,
            ar_condicionado=dados.ar_condicionado,
            direcao_assistida=dados.direcao_assistida
        )
        db.add(veiculo)       # Adiciona à sessão
        db.commit()           # Salva no banco
        db.refresh(veiculo)   # Atualiza o objeto com o ID gerado

        # 3️⃣ Cria o registro de emissões do veículo
        emissao = Emissao(
            veiculo_id=veiculo.veiculo_id,          # Chave estrangeira para o veículo
            combustivel_id=combustivel.combustivel_id,  # Chave estrangeira para o combustível
            nmhc=dados.nmhc,
            co=dados.co,
            nox=dados.nox,
            co2=dados.co2_gasolina or dados.co2_etanol  # Usa CO2 da gasolina ou etanol
        )
        db.add(emissao)  # Adiciona à sessão

        # 4️⃣ Cria o registro de consumo do veículo
        consumo = Consumo(
            veiculo_id=veiculo.veiculo_id,          # Chave estrangeira para o veículo
            combustivel_id=combustivel.combustivel_id,  # Chave estrangeira para o combustível
            rendimento_cidade=dados.rendimento_gasolina_cidade,
            rendimento_estrada=dados.rendimento_gasolina_estrada,
            consumo_energetico=dados.consumo_energetico
        )
        db.add(consumo)  # Adiciona à sessão

        db.commit()  # Salva emissões e consumo no banco

    # 5️⃣ Verifica se o veículo já está favoritado pelo usuário
    favorito_existente = db.query(Favorito).filter_by(
        usuario_id=usuario_id,
        veiculo_id=veiculo.veiculo_id
    ).first()

    # Se não estiver favoritado, cria o favorito
    if not favorito_existente:
        favorito = Favorito(
            usuario_id=usuario_id,
            veiculo_id=veiculo.veiculo_id
        )
        db.add(favorito)  # Adiciona à sessão
        db.commit()       # Salva no banco
        db.refresh(favorito)  # Atualiza o objeto com o ID gerado
        return {"mensagem": "Veículo favoritado com sucesso!"}
    else:
        return {"mensagem": "Veículo já estava favoritado"}  # Caso já exista

# Endpoint para listar todos os veículos favoritados de um usuário
@app.get("/favoritos/{usuario_id}")
def listar_veiculos_favoritos(usuario_id: int, db: Session = Depends(get_db)):
    # Pega todos os registros de favoritos daquele usuário
    favoritos = db.query(Favorito).filter(Favorito.usuario_id == usuario_id).all()

    resultado = []  # Lista que vai armazenar os dados para retornar

    # Para cada favorito encontrado
    for fav in favoritos:
        veiculo = fav.veiculo  # Pega o objeto do veículo relacionado

        # Dados de consumo do veículo
        consumos = [
            {
                "combustivel_id": c.combustivel_id,
                "rendimento_cidade": float(c.rendimento_cidade),  # Converte de Decimal para float
                "rendimento_estrada": float(c.rendimento_estrada),
                "consumo_energetico": float(c.consumo_energetico)
            }
            for c in veiculo.consumos  # Para todos os consumos relacionados ao veículo
        ]

        # Dados de emissões do veículo
        emissoes = [
            {
                "combustivel_id": e.combustivel_id,
                "nmhc": float(e.nmhc),
                "co": float(e.co),
                "nox": float(e.nox),
                "co2": float(e.co2)
            }
            for e in veiculo.emissoes  # Para todas as emissões relacionadas ao veículo
        ]

        # Monta o dicionário final do veículo
        resultado.append({
            "favorito_id": fav.favorito_id,
            "veiculo_id": veiculo.veiculo_id,
            "marca": veiculo.marca,
            "modelo": veiculo.modelo,
            "ano": veiculo.ano,
            "categoria": veiculo.categoria,
            "versao": veiculo.versao,
            "motor": veiculo.motor,
            "transmissao": veiculo.transmissao,
            "ar_condicionado": veiculo.ar_condicionado,
            "direcao_assistida": veiculo.direcao_assistida,
            "consumos": consumos,
            "emissoes": emissoes
        })

    # Retorna a lista completa de favoritos e a quantidade total
    return {"favoritos": resultado, "total": len(resultado)}