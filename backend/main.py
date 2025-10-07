
"""Comando para instalar todas as dependecias
pip install fastapi
pip install "uvicorn[standard]"   # para rodar o FastAPI
pip install sqlalchemy
pip install pandas
pip install numpy
pip install rapidfuzz
"""
from fastapi import FastAPI, Depends, HTTPException,Query
from sqlalchemy.orm import Session
from backend import modelo as models      
from backend import esquemas as schemas    
from backend.database import Base, engine, SessionLocal
import pandas as pd
import numpy as np
from rapidfuzz import process, fuzz  
import os

# Cria as tabelas no banco
Base.metadata.create_all(bind=engine)

app = FastAPI(title="SMVBR API")

# -------------------------
# Dependência do banco
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------
# Rotas Usuários
# -------------------------
@app.post("/cadastro", response_model=schemas.UsuarioResponse)
def cadastro(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existe = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    novo = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha=usuario.senha  
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo

@app.post("/login")
def login(usuario: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()

    if not user or user.senha != usuario.senha:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    return {"message": f"Bem-vindo {user.nome}!"}

@app.get("/usuarios", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(models.Usuario).all()
    return usuarios



# -------------------------
# Consulta carros na planilha
# -------------------------

def pandas_to_json_safe(df: pd.DataFrame):
    """
    Converte um DataFrame do Pandas para lista de dicionários pronta para JSON,
    substituindo valores problemáticos e convertendo datas.
    """
    # Substitui NaN e infinitos por None
    df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
    
    #Usado para retirar a coluna que deseja e que esteja presente na tabela
    if "nota sobre os dados faltantes" in df.columns:
        df = df.drop(columns=["nota sobre os dados faltantes"])
    
    # Para cada coluna do DataFrame que tem tipo datetime (normal ou com fuso horário UTC)
    for col in df.select_dtypes(include=["datetime64[ns]", "datetime64[ns, UTC]"]).columns:
         # Converte cada valor da coluna para string no formato ISO, mantendo None se o valor for nulo
        df[col] = df[col].apply(lambda x: x.isoformat() if x is not None else None)
        
    return df.to_dict(orient="records")



@app.get("/carros")
def listar_carros(
    # Parâmetro de consulta único para pesquisar marca, modelo ou ano
    busca: str = Query(None, description="Pesquisar por marca, modelo ou ano em um único campo")
):
     # Caminho absoluto da planilha, relativo à raiz do projeto
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho = os.path.join(ROOT_DIR, "data", "Dados originais.xlsx")

    # Verifica se o arquivo existe, se não lança exceção 404
    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Arquivo da planilha não encontrado")

    try:
        # Tenta ler o arquivo Excel com pandas
        df = pd.read_excel(caminho)
    except Exception as e:
          # Caso ocorra erro ao ler, lança exceção 500
        raise HTTPException(status_code=500, detail=f"Erro ao carregar a planilha: {str(e)}")

    # Padroniza nomes de colunas: remove espaços e converte para minúsculas
    df.columns = [c.strip().lower() for c in df.columns]
    
    # Verifica se as colunas essenciais existem
    for col in ["marca", "modelo", "ano"]:
        if col not in df.columns:
            raise HTTPException(status_code=500, detail=f"Coluna '{col}' ausente na planilha")

    # Padroniza os nomes das colunas: remove espaços e coloca em minúsculas
    for col in ["marca", "modelo", "ano"]:
        df[col] = df[col].fillna("").astype(str).str.strip().str.upper()
        
    # Se o usuário forneceu algum valor de busca
    if busca:
        termos = busca.strip().upper().split()  # divide a busca em palavras
        df_filtrado = df.copy()# cria cópia para filtragem

          # Filtra sequencialmente cada termo nas colunas marca, modelo e ano
        for termo in termos:
            df_filtrado = df_filtrado[
                df_filtrado["marca"].str.contains(termo, case=False, na=False) |
                df_filtrado["modelo"].str.contains(termo, case=False, na=False) |
                df_filtrado["ano"].str.contains(termo, case=False, na=False)
            ]
            if df_filtrado.empty:# para se não encontrar nenhum resultado
                break

          # Se não encontrou nada, tenta fuzzy match com a primeira palavra
        if df_filtrado.empty:
            marcas_validas = df["marca"][df["marca"] != ""].unique()
            sugestao, score, _ = process.extractOne(termos[0], marcas_validas, scorer=fuzz.WRatio)
            
            if score >= 70:
                 # Aplica a sugestão do fuzzy match nas três colunas
                df_filtrado = df[
                    df["marca"].str.contains(sugestao, case=False, na=False) |
                    df["modelo"].str.contains(sugestao, case=False, na=False) |
                    df["ano"].str.contains(sugestao, case=False, na=False)
                ]
                return {
                    "mensagem": f"Nenhum carro encontrado com '{busca}', exibindo resultados semelhantes a '{sugestao}'",
                    "carros": pandas_to_json_safe(df_filtrado),
                    "total": len(df_filtrado)
                }
            else:
                # Nenhuma correspondência próxima encontrada
                return {
                    "mensagem": f"Nenhum carro encontrado com '{busca}'",
                    "carros": [],
                    "total": 0
                }
        else:
            df = df_filtrado # Nenhuma correspondência próxima encontrada

    # Retorna os carros encontrados e o total
    return {"carros": pandas_to_json_safe(df), "total": len(df)}