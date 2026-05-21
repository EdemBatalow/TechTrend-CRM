from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app import models
import random
from datetime import datetime, timedelta

def seed_db():
    db = SessionLocal()
    
    # 1. Complex
    complex_obj = db.query(models.ResidentialComplex).first()
    if not complex_obj:
        complex_obj = models.ResidentialComplex(
            name="ЖК «Горизонт Парк»",
            address="г. Симферополь, проспект Кирова, 15",
            developer="TechTrend Development",
            completion_date=datetime(2027, 3, 1)
        )
        db.add(complex_obj)
        db.commit()
    
    # 2. Buildings & Sections
    building_a = db.query(models.Building).first()
    if not building_a:
        building_a = models.Building(name="Литер А", complex_id=complex_obj.id, floors=15)
        db.add(building_a)
        db.commit()
        
        section_1 = models.Section(name="Секция 1", building_id=building_a.id, floors=15)
        section_2 = models.Section(name="Секция 2", building_id=building_a.id, floors=15)
        db.add_all([section_1, section_2])
        db.commit()
    else:
        section_1 = db.query(models.Section).filter_by(name="Секция 1").first()
        section_2 = db.query(models.Section).filter_by(name="Секция 2").first()
    
    sections = [section_1, section_2]
    
    # 3. Apartments
    apt_count = db.query(models.Apartment).count()
    if apt_count < 30:
        apartments = []
        statuses = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "BOOKED", "SOLD", "MORTGAGE"]
        for i in range(1, 41):
            s = random.choice(sections)
            apartments.append(models.Apartment(
                number=f"{i}",
                district="Центральный",
                floor=random.randint(1, 15),
                area=random.uniform(35.0, 110.0),
                rooms=random.randint(1, 4),
                price=random.randint(5_000_000, 15_000_000),
                status=random.choice(statuses),
                section_id=s.id if s else 1
            ))
        db.add_all(apartments)
        db.commit()

    # 4. Clients
    client_count = db.query(models.Client).count()
    if client_count < 10:
        names = ["Иван Смирнов", "Елена Попова", "Дмитрий Соколов", "Анна Кузнецова", "Алексей Иванов", "Ольга Новикова", "Михаил Волков", "Татьяна Лебедева", "Сергей Козлов", "Мария Морозова"]
        sources = ["Сайт (Органический)", "Яндекс Директ", "Avito", "Telegram", "По рекомендации"]
        clients = []
        for i, name in enumerate(names):
            clients.append(models.Client(
                full_name=name,
                phone=f"+7 (978) 123-45-{10+i}",
                email=f"client_{i}@mail.ru",
                source=random.choice(sources)
            ))
        db.add_all(clients)
        db.commit()
    
    # 5. Deals
    deal_count = db.query(models.Deal).count()
    manager = db.query(models.User).filter(models.User.role == "MANAGER").first()
    if not manager:
        manager = db.query(models.User).first()
        
    if deal_count < 5 and manager:
        all_clients = db.query(models.Client).all()
        all_apts = db.query(models.Apartment).filter(models.Apartment.status != "AVAILABLE").all()
        
        stages = ["LEAD", "SELECTION", "BOOKING", "MORTGAGE", "DDU"]
        deals = []
        for i in range(5):
            c = random.choice(all_clients)
            apt = random.choice(all_apts) if all_apts else None
            deals.append(models.Deal(
                stage=random.choice(stages),
                amount=apt.price if apt else random.randint(5_000_000, 15_000_000),
                client_id=c.id,
                manager_id=manager.id,
                apartment_id=apt.id if apt else None
            ))
        db.add_all(deals)
        db.commit()
        
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
