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
    return {"message": f"Bem-vindo {user.nome}!"}

@app.get("/usuarios", response_model=list[schemas.UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(models.Usuario).all()
    return usuarios

# ---------- Funções utilitárias ----------
def find_col_insensitive(df: pd.DataFrame, candidates):
    """Retorna o nome da primeira coluna do df que contenha qualquer candidato (case-insensitive, ignora espaços)."""
    cols = list(df.columns)
    cols_norm = {c.replace(" ", "").lower(): c for c in cols}
    for cand in candidates:
        key = cand.replace(" ", "").lower()
        for k, orig in cols_norm.items():
            if key in k:
                return orig
    return None

def normalize_series(s: pd.Series):
    s_num = pd.to_numeric(s, errors="coerce")
    minv = s_num.min(skipna=True)
    maxv = s_num.max(skipna=True)
    if pd.isna(minv) or pd.isna(maxv) or maxv == minv:
        return pd.Series(0.0, index=s.index)
    return (s_num - minv) / (maxv - minv)

def peso_por_perfil(per: int):
    """
    Retorna um dicionário com os pesos e sub-pesos conforme os blocos do script original.
    Implementa os valores indicados no script que você enviou para perfis 1..5.
    """
    # base: ic1..ic5 e iscp1..iscp4 são constantes 
    ic1 = 0.4444; ic2 = 0.2222; ic3 = 0.1111; ic4 = 0.1111; ic5 = 0.1111
    iscp1 = iscp2 = iscp3 = iscp4 = 0.25

    # dicionário para cada perfil com os sub-pesos (iscc*, issNH*, issCO*, issNO*, issCC*, iscce*, isct*, iscm*)
    # usando os valores do script original 
    perfis = {
        1: {
            "iscc": [1.0,0.0,0.0,0.0,0.0],
            "issNH": [0.4231,0.2272,0.2272,0.1225],
            "issCO": [0.4231,0.2272,0.2272,0.1225],
            "issNO": [0.4231,0.2272,0.2272,0.1225],
            "issCC": [0.25,0.25,0.25,0.25],
            "iscce": [0.25,0.25,0.25,0.25],
            "isct": [0.3333,0.3333,0.3333],
            "iscm": [0.5,0.5,0.0,0.0]
        },
        2: {
            "iscc": [0.0,1.0,0.0,0.0,0.0],
            "issNH": [0.4444,0.2222,0.2222,0.1111],
            "issCO": [0.5017,0.2281,0.1865,0.0836],
            "issNO": [0.4444,0.2222,0.2222,0.1111],
            "issCC": [0.2887,0.2887,0.2470,0.1756],
            "iscce": [0.2964,0.2464,0.2464,0.2107],
            "isct": [0.3333,0.3333,0.3333],
            "iscm": [0.2964,0.2464,0.2464,0.2107]
        },
        3: {
            "iscc": [0.0,0.0,1.0,0.0,0.0],
            "issNH": [0.4786,0.2166,0.1966,0.1083],
            "issCO": [0.5777,0.2207,0.1315,0.0701],
            "issNO": [0.4974,0.2875,0.1669,0.0487],
            "issCC": [0.2887,0.2887,0.2470,0.1756],
            "iscce": [0.2964,0.2464,0.2464,0.2107],
            "isct": [0.3333,0.3333,0.3333],
            "iscm": [0.25,0.25,0.25,0.25]
        },
        4: {
            "iscc": [0.0,0.0,0.0,1.0,0.0],
            "issNH": [0.4444,0.2222,0.2222,0.1111],
            "issCO": [0.6252,0.2378,0.0842,0.0579],
            "issNO": [0.5478,0.3420,0.0567,0.0535],
            "issCC": [0.3458,0.2458,0.2042,0.2042],
            "iscce": [0.2964,0.2464,0.2464,0.2107],
            "isct": [0.5,0.0,0.5],
            "iscm": [0.3458,0.2458,0.2042,0.2042]
        },
        5: {
            "iscc": [0.0,0.0,0.0,0.0,1.0],
            "issNH": [0.4786,0.2166,0.1966,0.1063],
            "issCO": [0.5777,0.2207,0.1315,0.0701],
            "issNO": [0.4974,0.2875,0.1669,0.0481],
            "issCC": [0.2887,0.2887,0.2470,0.1756],
            "iscce": [0.2964,0.2464,0.2464,0.2107],
            "isct": [0.3333,0.3333,0.3333],
            "iscm": [0.25,0.25,0.25,0.25]
        }
    }

    body = perfis.get(per, perfis[1])

    # calcula if01..if32 conforme script 
    # unpack subweights
    issCO = body["issCO"]
    issNO = body["issNO"]
    issNH = body["issNH"]
    issCC = body["issCC"]
    iscce = body["iscce"]
    isct = body["isct"]
    iscm = body["iscm"]
    iscc = body["iscc"]

    # if01..if16 poluentes
    if01 = ic1 * iscp1 * issCO[0]
    if02 = ic1 * iscp1 * issCO[1]
    if03 = ic1 * iscp1 * issCO[2]
    if04 = ic1 * iscp1 * issCO[3]
    if05 = ic1 * iscp2 * issNO[0]
    if06 = ic1 * iscp2 * issNO[1]
    if07 = ic1 * iscp2 * issNO[2]
    if08 = ic1 * iscp2 * issNO[3]
    if09 = ic1 * iscp4 * issNH[0]
    if10 = ic1 * iscp4 * issNH[1]
    if11 = ic1 * iscp4 * issNH[2]
    if12 = ic1 * iscp4 * issNH[3]
    if13 = ic1 * iscp4 * issCC[0]
    if14 = ic1 * iscp4 * issCC[1]
    if15 = ic1 * iscp4 * issCC[2]
    if16 = ic1 * iscp4 * issCC[3]

    # consumo energético if17..if20
    if17 = ic2 * iscce[0]
    if18 = ic2 * iscce[1]
    if19 = ic2 * iscce[2]
    if20 = ic2 * iscce[3]

    # categoria if21..if25
    if21 = ic3 * iscc[0]
    if22 = ic3 * iscc[1]
    if23 = ic3 * iscc[2]
    if24 = ic3 * iscc[3]
    if25 = ic3 * iscc[4]

    # transmissão if26..if28
    # isct has 3 elements: Automática, Semi-Automática, Manual
    if26 = ic4 * isct[0]
    if27 = ic4 * isct[1]
    if28 = ic4 * isct[2]

    # motor if29..if32 (4 faixas)
    if29 = ic5 * iscm[0]
    if30 = ic5 * iscm[1]
    if31 = ic5 * iscm[2]
    if32 = ic5 * iscm[3]

    return {
        **body,
        "if": [if01,if02,if03,if04, if05,if06,if07,if08, if09,if10,if11,if12, if13,if14,if15,if16,
               if17,if18,if19,if20, if21,if22,if23,if24,if25, if26,if27,if28, if29,if30,if31,if32]
    }

# ---------- Rota principal de filtragem ----------
@app.get("/filtro-carros")
def filtro_carros(
    ano: Optional[int] = Query(None),
    categoria: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    motor: Optional[str] = Query(None),
    transmissao: Optional[str] = Query(None),
    ar_condicionado: Optional[bool] = Query(None),
    direcao_assistida: Optional[str] = Query(None),
    combustivel: Optional[str] = Query(None),
    perfil: int = Query(1, ge=1, le=5),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=200)
):
    # caminho do arquivo
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho = os.path.join(ROOT_DIR, "data", "Dados originais.xlsx")

    if not os.path.exists(caminho):
        raise HTTPException(status_code=404, detail="Arquivo da planilha não encontrado")

    try:
        df = pd.read_excel(caminho)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao abrir planilha: {e}")

    # padroniza nomes das colunas (trim)
    df.columns = [c.strip() for c in df.columns]

    # aplica filtros em cascata (cada um é opcional)
    df_work = df.copy()

    if ano is not None:
        # filtro por ANO (coluna pode ser 'ANO' ou 'Ano')
        col_ano = find_col_insensitive(df_work, ['ANO','Ano','ano'])
        if col_ano:
            df_work = df_work[pd.to_numeric(df_work[col_ano], errors='coerce') == int(ano)]
        else:
            # se não encontrou coluna, retorna vazio
            df_work = df_work.iloc[0:0]

    if categoria:
        col_cat = find_col_insensitive(df_work, ['CATEGORIA','Categoria','categoria','GRUPO','Grupo'])
        if col_cat:
            df_work = df_work[df_work[col_cat].astype(str).str.strip().str.lower().str.contains(categoria.strip().lower(), na=False)]

    if marca:
        col_marca = find_col_insensitive(df_work, ['MARCA','Marca','marca'])
        if col_marca:
            df_work = df_work[df_work[col_marca].astype(str).str.strip().str.lower().str.contains(marca.strip().lower(), na=False)]

    if motor:
        col_motor = find_col_insensitive(df_work, ['MOTOR','Motor','motor'])
        if col_motor:
            df_work = df_work[df_work[col_motor].astype(str).str.strip().str.lower().str.contains(motor.strip().lower(), na=False)]

    if transmissao:
        col_trans = find_col_insensitive(df_work, ['TRANSMISSAO','Transmissão','transmissao','transmissão'])
        if col_trans:
            df_work = df_work[df_work[col_trans].astype(str).str.strip().str.lower().str.contains(transmissao.strip().lower(), na=False)]

    if ar_condicionado is not None:
        col_ar = find_col_insensitive(df_work, ['AR-CONDICIONADO','Ar-Condicionado','AR CONDICIONADO','ar-condicionado','ar_condicionado'])
        if col_ar:
            # aceita valores booleanos ou texto 'Sim'/'Não'
            if isinstance(ar_condicionado, bool):
                df_work = df_work[df_work[col_ar].apply(lambda x: bool(x) == ar_condicionado if pd.notna(x) else False)]
            else:
                df_work = df_work[df_work[col_ar].astype(str).str.lower().str.contains(str(ar_condicionado).strip().lower(), na=False)]

    if direcao_assistida:
        col_dir = find_col_insensitive(df_work, ['DIRECAO ASSISTIDA','Direção Assistida','direcao_assistida','direção assistida'])
        if col_dir:
            df_work = df_work[df_work[col_dir].astype(str).str.strip().str.upper().str.contains(direcao_assistida.strip().upper(), na=False)]

    if combustivel:
        col_comb = find_col_insensitive(df_work, ['COMBUSTÍVEL','COMBUSTIVEL','Combustível','Combustivel','combustivel'])
        if col_comb:
            df_work = df_work[df_work[col_comb].astype(str).str.strip().str.upper().str.contains(combustivel.strip().upper(), na=False)]

    # Se não sobrou nenhum, retorna resultado vazio
    if df_work.empty:
        return {"total": 0, "pagina": pagina, "limite": limite, "resultados": []}

    # ---------- Preparar colunas numéricas para quartis ----------
    # nomes exatos conforme você enviou (procura insensível)
    col_nmhc = find_col_insensitive(df_work, ['Emissão de NMHC','Emissão de NMHC (g/km)','Emissao de NMHC'])
    col_co = find_col_insensitive(df_work, ['Emissão de CO','Emissão de CO (g/km)','Emissao de CO'])
    col_nox = find_col_insensitive(df_work, ['Emissão de Nox','Emissão de Nox (g/km)','Emissao de Nox'])
    col_co2_et = find_col_insensitive(df_work, ['Emissão de CO2','Combustão do Etanol','CO2 (Etanol)','a produzido pela Combustão do Etanol'])
    col_co2_gs = find_col_insensitive(df_work, ['Combustão da Gasolina','Combustão da Gasolina ou Diesel','Gasolina ou Diesel','CO2 (Gasolina)'])
    col_rend_et_c = find_col_insensitive(df_work, ['Rendimento do Etanol na Cidade','Rendimento do Etanol na Cidade (km/l)'])
    col_rend_et_e = find_col_insensitive(df_work, ['Rendimento do Etanol na Estrada','Rendimento do Etanol na Estrada (km/l)'])
    col_rend_gs_c = find_col_insensitive(df_work, ['Rendimento da Gasolina ou Diesel na Cidade','Rendimento Gasolina Cidade'])
    col_rend_gs_e = find_col_insensitive(df_work, ['Rendimento da Gasolina ou Diesel Estrada','Rendimento Gasolina Estrada'])
    col_consumo_ener = find_col_insensitive(df_work, ['Consumo Energético','Consumo Energético (MJ/km)','Consumo Energetico','MJ/km'])

    # converte colunas para numérico (se existirem)
    def to_numeric_col(df_local, col):
        if col and col in df_local.columns:
            return pd.to_numeric(df_local[col], errors='coerce')
        else:
            return pd.Series([np.nan]*len(df_local), index=df_local.index)

    s_nmhc = to_numeric_col(df_work, col_nmhc)
    s_co = to_numeric_col(df_work, col_co)
    s_nox = to_numeric_col(df_work, col_nox)
    s_co2_et = to_numeric_col(df_work, col_co2_et)
    s_co2_gs = to_numeric_col(df_work, col_co2_gs)
    s_rend_et_c = to_numeric_col(df_work, col_rend_et_c)
    s_rend_et_e = to_numeric_col(df_work, col_rend_et_e)
    s_rend_gs_c = to_numeric_col(df_work, col_rend_gs_c)
    s_rend_gs_e = to_numeric_col(df_work, col_rend_gs_e)
    s_consumo = to_numeric_col(df_work, col_consumo_ener)

    # Para calcular quartis, usamos os valores do dataframe filtrado por ANO (se o usuário escolheu ano)
    base_for_quart = df_work.copy()

    # cria quartil I1..I4 para cada métrica (I1 = melhor faixa? O script tratava I1 como intervalo 1 — aqui
    # mantemos I1 = quartil inferior (melhor para emissões = menor valor), I4 = pior.)
    def quartil_labels(series):
        # series numeric
        s = pd.to_numeric(series, errors='coerce')
        # se todos nulos ou todos iguais -> coloca I2 (neutro)
        if s.dropna().empty or s.nunique(dropna=True) == 1:
            return pd.Series(['I2'] * len(s), index=s.index)
        try:
            labels = pd.qcut(s, q=4, labels=['I1','I2','I3','I4'], duplicates='drop')
            # garantir índice alinhado e strings
            return labels.astype(str).reindex(s.index).fillna('I2')
        except Exception:
            return pd.Series(['I2'] * len(s), index=s.index)

    q_nmhc = quartil_labels(s_nmhc)
    q_co = quartil_labels(s_co)
    q_nox = quartil_labels(s_nox)
    # para CO2, usaremos co2_et ou co2_gs por linha; para quartil calculamos separadamente e depois escolheremos por linha
    q_co2_et = quartil_labels(s_co2_et)
    q_co2_gs = quartil_labels(s_co2_gs)
    q_consumo = quartil_labels(s_consumo)

    # ---------- Obter pesos if01..if32 do perfil ----------
    peso = peso_por_perfil(perfil)
    ifs = peso["if"]  # lista 32 (if01..if32)

    # Mapeamento quartil -> índice if
    # CO quartil I1 -> if01, I2->if02, I3->if03, I4->if04
    quartil_to_if_co = {'I1': ifs[0], 'I2': ifs[1], 'I3': ifs[2], 'I4': ifs[3]}
    quartil_to_if_nox = {'I1': ifs[4], 'I2': ifs[5], 'I3': ifs[6], 'I4': ifs[7]}
    quartil_to_if_nmhc = {'I1': ifs[8], 'I2': ifs[9], 'I3': ifs[10], 'I4': ifs[11]}
    quartil_to_if_co2 = {'I1': ifs[12], 'I2': ifs[13], 'I3': ifs[14], 'I4': ifs[15]}
    quartil_to_if_consumo = {'I1': ifs[16], 'I2': ifs[17], 'I3': ifs[18], 'I4': ifs[19]}

    # categoria mapping: tenta ler valor textual e mapear para if21..if25 conforme Grupo
    # Assume categorias: "Pequeno", "Médio – Grande", "Utilitário", "Trabalho", "Luxo"
    cat_map = {
        'pequeno': ifs[20], 'médio – grande': ifs[21], 'medio – grande': ifs[21],
        'utilitário': ifs[22], 'utilitario': ifs[22],
        'trabalho': ifs[23],
        'luxo': ifs[24]
    }

    # transmissão: Automática, Semiautomático, Manual -> if26..if28
    transm_map = {
        'automática': ifs[25], 'automatica': ifs[25],
        'semiautomático': ifs[26], 'semiautomatica': ifs[26], 'semiautomatico': ifs[26],
        'manual': ifs[27]
    }

    # motor: assume categorias 'A','B','C','E' mapear para if29..if32
    motor_map = {'A': ifs[28], 'B': ifs[29], 'C': ifs[30], 'E': ifs[31]}

    # ---------- Calcula Score por linha ----------
    # inicia colunas Score*
    df_work = df_work.reset_index(drop=True)
    n = len(df_work)
    df_work['ScoreG'] = 0.0
    df_work['ScoreM'] = 0.0
    df_work['ScoreT'] = 0.0
    df_work['ScoreQNM'] = 0.0
    df_work['ScoreQC'] = 0.0
    df_work['ScoreQNO'] = 0.0
    df_work['ScoreQC2'] = 0.0
    df_work['ScoreCE'] = 0.0

    # localizar colunas textuais úteis
    col_categoria = find_col_insensitive(df_work, ['CATEGORIA','Categoria','categoria','GRUPO','Grupo'])
    col_motor = find_col_insensitive(df_work, ['MOTOR','Motor','motor'])
    col_trans = find_col_insensitive(df_work, ['TRANSMISSAO','Transmissão','transmissao'])
    col_qnmhc = q_nmhc.index if isinstance(q_nmhc, pd.Series) else None

    for idx, row in df_work.iterrows():
        # Categoria -> ScoreG
        val_cat = str(row[col_categoria]).strip().lower() if col_categoria and pd.notna(row.get(col_categoria, None)) else ''
        df_work.at[idx, 'ScoreG'] = cat_map.get(val_cat, 0.0)

        # Motor -> ScoreM
        val_motor = str(row[col_motor]).strip().upper() if col_motor and pd.notna(row.get(col_motor, None)) else ''
        df_work.at[idx, 'ScoreM'] = motor_map.get(val_motor, 0.0)

        # Transmissão -> ScoreT
        val_trans = str(row[col_trans]).strip().lower() if col_trans and pd.notna(row.get(col_trans, None)) else ''
        df_work.at[idx, 'ScoreT'] = transm_map.get(val_trans, 0.0)

        # Quartis poluentes: pegar o valor de quartil calculado por índice
        q_c = q_co.iloc[idx] if idx in q_co.index else 'I2'
        q_n = q_nox.iloc[idx] if idx in q_nox.index else 'I2'
        q_nm = q_nmhc.iloc[idx] if idx in q_nmhc.index else 'I2'
        # CO2: escolher etanol vs gasolina/diesel conforme combustivel da linha (se informado)
        # determina combustivel da linha
        col_comb = find_col_insensitive(df_work, ['COMBUSTÍVEL','COMBUSTIVEL','Combustível','combustivel'])
        val_comb = str(row[col_comb]).strip().upper() if col_comb and pd.notna(row.get(col_comb, None)) else ''
        if val_comb == 'E':
            q_c02 = q_co2_et.iloc[idx] if idx in q_co2_et.index else 'I2'
        elif val_comb in ('G','D'):
            q_c02 = q_co2_gs.iloc[idx] if idx in q_co2_gs.index else 'I2'
        elif val_comb == 'F':
            # para flex, escolhe a pior faixa (conservador) entre et e gs: aqui usamos max I (I4 worst)
            # represent by comparing numeric underlying percentiles: we'll pick the one with larger quartil index
            # simpler: if either is I4 choose I4, else highest
            a = q_co2_et.iloc[idx] if idx in q_co2_et.index else 'I2'
            b = q_co2_gs.iloc[idx] if idx in q_co2_gs.index else 'I2'
            # order I1<I2<I3<I4
            order = {'I1':1,'I2':2,'I3':3,'I4':4}
            q_c02 = a if order.get(a,2) >= order.get(b,2) else b
        else:
            # fallback average: take q_co2_gs if available else q_co2_et else 'I2'
            q_c02 = q_co2_gs.iloc[idx] if idx in q_co2_gs.index and pd.notna(q_co2_gs.iloc[idx]) else (q_co2_et.iloc[idx] if idx in q_co2_et.index else 'I2')

        # Consumo energético quartil
        q_cons = q_consumo.iloc[idx] if idx in q_consumo.index else 'I2'

        # atribui scores pelos mapas de quartil->if
        df_work.at[idx, 'ScoreQC'] = quartil_to_if_co.get(q_c, 0.0)
        df_work.at[idx, 'ScoreQNO'] = quartil_to_if_nox.get(q_n, 0.0)
        df_work.at[idx, 'ScoreQNM'] = quartil_to_if_nmhc.get(q_nm, 0.0)
        df_work.at[idx, 'ScoreQC2'] = quartil_to_if_co2.get(q_c02, 0.0)
        df_work.at[idx, 'ScoreCE'] = quartil_to_if_consumo.get(q_cons, 0.0)

    # Soma final ScoreF
    df_work['ScoreF'] = df_work[['ScoreG','ScoreM','ScoreT','ScoreQNM','ScoreQC','ScoreQNO','ScoreQC2','ScoreCE']].sum(axis=1)

    # Ordena: menor ScoreF = mais sustentável (assumimos essa interpretação)
    df_sorted = df_work.sort_values(by='ScoreF', ascending=True).reset_index(drop=True)

    total = len(df_sorted)
    inicio = (pagina - 1) * limite
    fim = inicio + limite
    page = df_sorted.iloc[inicio:fim]

    # Converte para JSON seguro (tratando NaN -> None)
    def df_to_json_safe(df_in):
        dfj = df_in.copy()
        dfj = dfj.replace({np.nan: None, np.inf: None, -np.inf: None})
        return dfj.to_dict(orient='records')

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


# -------------------------
# Consulta carros na planilha (versão simplificada e otimizada)
# -------------------------
@app.get("/carros")
def listar_carros(busca: str = Query(None, description="Pesquisar por marca, modelo ou ano")):
    ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    caminho = os.path.join(ROOT_DIR, "data", "Dados originais.xlsx")

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
