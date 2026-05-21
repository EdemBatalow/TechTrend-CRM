from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


user_role_enum = ENUM(
    "MANAGER",
    "ADMIN",
    name="user_role",
)

apartment_status_enum = ENUM(
    "AVAILABLE",
    "BOOKED",
    "MORTGAGE",
    "SOLD",
    "RESERVED",
    name="apartment_status",
)

deal_stage_enum = ENUM(
    "LEAD",
    "SELECTION",
    "BOOKING",
    "MORTGAGE",
    "DDU",
    "CLOSED",
    name="deal_stage",
)

booking_status_enum = ENUM(
    "ACTIVE",
    "EXPIRED",
    "CONFIRMED",
    "CANCELLED",
    name="booking_status",
)


class User(Base):
    __tablename__ = "jhi_user"

    id = Column(BigInteger, primary_key=True, index=True)
    login = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(user_role_enum, nullable=False, default="MANAGER")
    is_active = Column(Boolean, nullable=False, default=True)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())
    created_by = Column(String(50), nullable=True)
    last_modified_by = Column(String(50), nullable=True)

    deals = relationship("Deal", back_populates="manager", foreign_keys="Deal.manager_id")
    subscriptions = relationship("Subscription", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")
    interactions = relationship("Interaction", back_populates="user")


class ResidentialComplex(Base):
    __tablename__ = "residential_complex"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    developer = Column(String(255), nullable=True)
    completion_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    buildings = relationship("Building", back_populates="complex")


class Building(Base):
    __tablename__ = "building"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    completion_date = Column(Date, nullable=True)
    floors = Column(Integer, nullable=True)
    complex_id = Column(BigInteger, ForeignKey("residential_complex.id", ondelete="CASCADE"), nullable=False)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    complex = relationship("ResidentialComplex", back_populates="buildings")
    sections = relationship("Section", back_populates="building")


class Section(Base):
    __tablename__ = "section"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    floors = Column(Integer, nullable=True)
    building_id = Column(BigInteger, ForeignKey("building.id", ondelete="CASCADE"), nullable=False)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    building = relationship("Building", back_populates="sections")
    apartments = relationship("Apartment", back_populates="section")


class Apartment(Base):
    __tablename__ = "apartment"

    id = Column(BigInteger, primary_key=True, index=True)
    number = Column(String(50), nullable=False)
    district = Column(String(120), nullable=True)
    floor = Column(Integer, nullable=False)
    area = Column(Numeric(10, 2), nullable=False)
    rooms = Column(Integer, nullable=False)
    price = Column(Numeric(19, 2), nullable=False)
    status = Column(apartment_status_enum, nullable=False, default="AVAILABLE")
    layout_image = Column(LargeBinary, nullable=True)
    section_id = Column(BigInteger, ForeignKey("section.id", ondelete="CASCADE"), nullable=False)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    section = relationship("Section", back_populates="apartments")
    photos = relationship("ApartmentPhoto", back_populates="apartment")
    bookings = relationship("Booking", back_populates="apartment")


class ApartmentPhoto(Base):
    __tablename__ = "apartment_photo"

    id = Column(BigInteger, primary_key=True, index=True)
    photo = Column(LargeBinary, nullable=False)
    title = Column(String(255), nullable=True)
    apartment_id = Column(BigInteger, ForeignKey("apartment.id", ondelete="CASCADE"), nullable=False)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    apartment = relationship("Apartment", back_populates="photos")


class Client(Base):
    __tablename__ = "client"

    id = Column(BigInteger, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), unique=True, nullable=False)
    email = Column(String(150), nullable=True)
    source = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    deals = relationship("Deal", back_populates="client")
    bookings = relationship("Booking", back_populates="client")
    interactions = relationship("Interaction", back_populates="client")


class Deal(Base):
    __tablename__ = "deal"

    id = Column(BigInteger, primary_key=True, index=True)
    stage = Column(deal_stage_enum, nullable=False, default="LEAD")
    amount = Column(Numeric(19, 2), nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True)
    expected_close_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    client_id = Column(BigInteger, ForeignKey("client.id", ondelete="RESTRICT"), nullable=False)
    manager_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="RESTRICT"), nullable=False)
    apartment_id = Column(BigInteger, ForeignKey("apartment.id", ondelete="SET NULL"), nullable=True)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    client = relationship("Client", back_populates="deals")
    manager = relationship("User", back_populates="deals", foreign_keys=[manager_id])
    apartment = relationship("Apartment")
    bookings = relationship("Booking", back_populates="deal")
    interactions = relationship("Interaction", back_populates="deal")


class Interaction(Base):
    __tablename__ = "interaction"

    id = Column(BigInteger, primary_key=True, index=True)
    type = Column(String(100), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    client_id = Column(BigInteger, ForeignKey("client.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="SET NULL"), nullable=True)
    deal_id = Column(BigInteger, ForeignKey("deal.id", ondelete="CASCADE"), nullable=True)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    client = relationship("Client", back_populates="interactions")
    user = relationship("User", back_populates="interactions")
    deal = relationship("Deal", back_populates="interactions")


class Booking(Base):
    __tablename__ = "booking"

    id = Column(BigInteger, primary_key=True, index=True)
    start_date = Column(DateTime(timezone=True), nullable=False)
    expiry_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(booking_status_enum, nullable=False, default="ACTIVE")
    commission = Column(Numeric(19, 2), nullable=True)
    notes = Column(Text, nullable=True)
    apartment_id = Column(BigInteger, ForeignKey("apartment.id", ondelete="RESTRICT"), nullable=False)
    client_id = Column(BigInteger, ForeignKey("client.id", ondelete="RESTRICT"), nullable=False)
    agent_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="SET NULL"), nullable=True)
    manager_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="SET NULL"), nullable=True)
    deal_id = Column(BigInteger, ForeignKey("deal.id", ondelete="SET NULL"), nullable=True)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    apartment = relationship("Apartment", back_populates="bookings")
    client = relationship("Client", back_populates="bookings")
    deal = relationship("Deal", back_populates="bookings")


class Subscription(Base):
    __tablename__ = "subscription"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="CASCADE"), unique=True, nullable=False)
    plan = Column(String(20), nullable=False, default="basic")
    status = Column(String(20), nullable=False, default="inactive")
    ai_scope = Column(String(20), nullable=False, default="internal")
    started_at = Column(DateTime(timezone=True), nullable=True)
    renewal_at = Column(DateTime(timezone=True), nullable=True)
    last_payment_at = Column(DateTime(timezone=True), nullable=True)
    amount = Column(Numeric(10, 2), nullable=True)
    created_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_modified_date = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    user = relationship("User", back_populates="subscriptions")


class Notification(Base):
    __tablename__ = "notification"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="notifications")


class AnalysisRun(Base):
    __tablename__ = "analysis_run"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("jhi_user.id", ondelete="CASCADE"), nullable=False)
    scope = Column(String(20), nullable=False, default="internal")
    date_from = Column(Date, nullable=True)
    date_to = Column(Date, nullable=True)
    summary = Column(Text, nullable=False)
    payload = Column(Text, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User")
