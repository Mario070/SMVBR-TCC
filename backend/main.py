from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from backend import modelo as models      
from backend import esquemas as schemas    
from backend.database import Base, engine, SessionLocal
import pandas as pd
import numpy as np

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

    # Converte colunas de datas para strings ISO
    for col in df.select_dtypes(include=["datetime64[ns]", "datetime64[ns, UTC]"]).columns:
        df[col] = df[col].apply(lambda x: x.isoformat() if x is not None else None)

    return df.to_dict(orient="records")


# sem misturar tabs e espaços, indentação correta
@app.get("/carros")
def listar_carros():
    try:
        caminho = "data/Dados originais.xlsx"
        df = pd.read_excel(caminho)

        carros = pandas_to_json_safe(df)
        return {"carros": carros}

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Arquivo da planilha não encontrado")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao ler planilha: {str(e)}")


