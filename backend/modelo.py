from sqlalchemy import Column, Integer, String, TIMESTAMP, func
from .database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    usuario_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha = Column(String(255), nullable=False)  # aqui vai ficar em texto puro
    data_cadastro = Column(TIMESTAMP, server_default=func.now())
