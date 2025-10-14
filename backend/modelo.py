from sqlalchemy import (
    Column, Integer, String, Boolean, Enum, DECIMAL, ForeignKey,
    TIMESTAMP, func, UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from .database import Base

# -------------------------------------------------------
# TABELA: usuarios
# -------------------------------------------------------
class Usuario(Base):
    __tablename__ = "usuarios"

    usuario_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha = Column(String(255), nullable=False)
    data_cadastro = Column(TIMESTAMP, server_default=func.now())

    # relacionamentos
    pesquisas = relationship("Pesquisa", back_populates="usuario")
    favoritos = relationship("Favorito", back_populates="usuario")


# -------------------------------------------------------
# TABELA: combustiveis
# -------------------------------------------------------
class Combustivel(Base):
    __tablename__ = "combustiveis"

    combustivel_id = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(50), unique=True, nullable=False)

    # relacionamentos
    emissoes = relationship("Emissao", back_populates="combustivel")
    consumos = relationship("Consumo", back_populates="combustivel")


# -------------------------------------------------------
# TABELA: veiculos
# -------------------------------------------------------
class Veiculo(Base):
    __tablename__ = "veiculos"

    veiculo_id = Column(Integer, primary_key=True, autoincrement=True)
    ano = Column(Integer, nullable=False)
    categoria = Column(String(100))
    marca = Column(String(100), nullable=False)
    modelo = Column(String(150), nullable=False)
    versao = Column(String(150))
    motor = Column(String(100))
    transmissao = Column(String(100))
    ar_condicionado = Column(Boolean)
    direcao_assistida = Column(Enum('H', 'E', 'H-E', 'M'), nullable=False)

    # relacionamentos
    emissoes = relationship("Emissao", back_populates="veiculo")
    consumos = relationship("Consumo", back_populates="veiculo")
    favoritos = relationship("Favorito", back_populates="veiculo")


# -------------------------------------------------------
# TABELA: emissoes
# -------------------------------------------------------
class Emissao(Base):
    __tablename__ = "emissoes"

    emissao_id = Column(Integer, primary_key=True, autoincrement=True)
    veiculo_id = Column(Integer, ForeignKey("veiculos.veiculo_id"), nullable=False)
    combustivel_id = Column(Integer, ForeignKey("combustiveis.combustivel_id"), nullable=False)
    nmhc = Column(DECIMAL(10, 3))
    co = Column(DECIMAL(10, 3))
    nox = Column(DECIMAL(10, 3))
    co2 = Column(DECIMAL(10, 3))

    __table_args__ = (UniqueConstraint("veiculo_id", "combustivel_id", name="uq_emissoes_veiculo_combustivel"),)

    # relacionamentos
    veiculo = relationship("Veiculo", back_populates="emissoes")
    combustivel = relationship("Combustivel", back_populates="emissoes")


# -------------------------------------------------------
# TABELA: consumo
# -------------------------------------------------------
class Consumo(Base):
    __tablename__ = "consumo"

    consumo_id = Column(Integer, primary_key=True, autoincrement=True)
    veiculo_id = Column(Integer, ForeignKey("veiculos.veiculo_id"), nullable=False)
    combustivel_id = Column(Integer, ForeignKey("combustiveis.combustivel_id"), nullable=False)
    rendimento_cidade = Column(DECIMAL(5, 2))
    rendimento_estrada = Column(DECIMAL(5, 2))
    consumo_energetico = Column(DECIMAL(10, 3))

    __table_args__ = (UniqueConstraint("veiculo_id", "combustivel_id", name="uq_consumo_veiculo_combustivel"),)

    # relacionamentos
    veiculo = relationship("Veiculo", back_populates="consumos")
    combustivel = relationship("Combustivel", back_populates="consumos")


# -------------------------------------------------------
# TABELA: pesquisas
# -------------------------------------------------------
class Pesquisa(Base):
    __tablename__ = "pesquisas"

    pesquisa_id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.usuario_id"))
    parametros = Column(JSON)
    data_pesquisa = Column(TIMESTAMP, server_default=func.now())

    # relacionamento
    usuario = relationship("Usuario", back_populates="pesquisas")


# -------------------------------------------------------
# TABELA: favoritos
# -------------------------------------------------------
class Favorito(Base):
    __tablename__ = "favoritos"

    favorito_id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.usuario_id"), nullable=False)
    veiculo_id = Column(Integer, ForeignKey("veiculos.veiculo_id"), nullable=False)
    data_adicionado = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (UniqueConstraint("usuario_id", "veiculo_id", name="uq_favoritos_usuario_veiculo"),)

    # relacionamentos
    usuario = relationship("Usuario", back_populates="favoritos")
    veiculo = relationship("Veiculo", back_populates="favoritos")
