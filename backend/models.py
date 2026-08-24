from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from .database import Base

class OrganizationModel(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    adminName = Column(String)
    email = Column(String)
    password = Column(String)
    licenseType = Column(String)
    licenseKey = Column(String)
    logo = Column(Text, nullable=True)

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    orgId = Column(String, ForeignKey("organizations.id"))
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String)
    password = Column(String)

class AreaModel(Base):
    __tablename__ = "areas"
    id = Column(String, primary_key=True, index=True)
    orgId = Column(String, ForeignKey("organizations.id"))
    areaName = Column(String)
    subAreaName = Column(String)

class CameraModel(Base):
    __tablename__ = "cameras"
    id = Column(String, primary_key=True, index=True)
    orgId = Column(String, ForeignKey("organizations.id"))
    areaId = Column(String, ForeignKey("areas.id"))
    camName = Column(String, unique=True, index=True)
    rtsp = Column(String)
    lat = Column(String)
    lng = Column(String)
    aiModule = Column(String)
    status = Column(String, default="Active")

class PlateHotlistModel(Base):
    __tablename__ = "plate_hotlists"
    id = Column(String, primary_key=True, index=True)
    plateNumber = Column(String, unique=True, index=True)
    tag = Column(String)
    notes = Column(String)

class PersonHotlistModel(Base):
    __tablename__ = "person_hotlists"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    tag = Column(String)
    photo = Column(Text, nullable=True)
    notes = Column(String)
