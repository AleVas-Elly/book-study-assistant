from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content = Column(Text)  # Stores the extracted text from the PDF
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
