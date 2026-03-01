"""
Seed dummy events into the database
"""
import os
import sys
from datetime import datetime, timedelta
import uuid

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models import db, HostelEvent, EventType, RegistrationStatus

def seed_events():
    """Add dummy events to the database"""
    app = create_app()
    
    with app.app_context():
        # Check if events already exist
        existing_events = HostelEvent.query.count()
        if existing_events > 0:
            print(f"✓ Database already has {existing_events} events. Skipping seeding.")
            return
        
        # Create dummy events
        events_data = [
            {
                'title': 'Diwali Celebration 2024',
                'description': 'Join us for a grand Diwali celebration with music, dance, food, and fireworks. Traditional Indian performances and cultural activities.',
                'event_type': EventType.CULTURAL,
                'sports_type': None,
                'date': datetime.now() + timedelta(days=10),
                'start_time': '18:00',
                'end_time': '22:00',
                'venue': 'Main Hostel Courtyard',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 200,
                'organizer': 'Cultural Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Diwali+Celebration',
            },
            {
                'title': 'Annual Sports Day',
                'description': 'Annual inter-hostel sports competition featuring cricket, badminton, basketball, and athletics. Prizes and trophies for top performers.',
                'event_type': EventType.SPORTS,
                'sports_type': 'Cricket',
                'date': datetime.now() + timedelta(days=15),
                'start_time': '09:00',
                'end_time': '17:00',
                'venue': 'Sports Ground',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 150,
                'organizer': 'Sports Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Sports+Day',
            },
            {
                'title': 'Battle of Bands',
                'description': 'Showcase your musical talent! Register your band and perform live. Multiple categories: Rock, Pop, Fusion, and Classical.',
                'event_type': EventType.CULTURAL,
                'sports_type': None,
                'date': datetime.now() + timedelta(days=20),
                'start_time': '19:00',
                'end_time': '23:00',
                'venue': 'Auditorium',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 100,
                'organizer': 'Music Club',
                'image_url': 'https://via.placeholder.com/400x300?text=Battle+of+Bands',
            },
            {
                'title': 'Football Tournament',
                'description': 'Inter-hostel football tournament with knockout rounds. Teams of 11 players. Registration deadline: 5 days before the event.',
                'event_type': EventType.SPORTS,
                'sports_type': 'Football',
                'date': datetime.now() + timedelta(days=25),
                'start_time': '15:00',
                'end_time': '20:00',
                'venue': 'Football Field',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 200,
                'organizer': 'Sports Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Football+Tournament',
            },
            {
                'title': 'Talent Hunt',
                'description': 'Discover hidden talents! Open for all types of performances - singing, dancing, comedy, mimicry, and more.',
                'event_type': EventType.CULTURAL,
                'sports_type': None,
                'date': datetime.now() + timedelta(days=12),
                'start_time': '18:30',
                'end_time': '21:30',
                'venue': 'Convention Hall',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 80,
                'organizer': 'Entertainment Cell',
                'image_url': 'https://via.placeholder.com/400x300?text=Talent+Hunt',
            },
            {
                'title': 'Badminton Championship',
                'description': 'Singles and doubles badminton tournament. Matches throughout the day with finals in the evening.',
                'event_type': EventType.SPORTS,
                'sports_type': 'Badminton',
                'date': datetime.now() + timedelta(days=18),
                'start_time': '08:00',
                'end_time': '18:00',
                'venue': 'Indoor Sports Complex',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 120,
                'organizer': 'Sports Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Badminton+Championship',
            },
            {
                'title': 'Cultural Night',
                'description': 'Evening of cultural performances including classical dance, instrumental music, poetry, and drama sketches.',
                'event_type': EventType.CULTURAL,
                'sports_type': None,
                'date': datetime.now() + timedelta(days=22),
                'start_time': '19:00',
                'end_time': '22:30',
                'venue': 'Main Auditorium',
                'registration_status': RegistrationStatus.OPEN,
                'total_slots': 150,
                'organizer': 'Cultural Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Cultural+Night',
            },
            {
                'title': 'Basketball Tournament',
                'description': '5-on-5 basketball tournament with pool rounds and knock-out stages. Teams of 8 players.',
                'event_type': EventType.SPORTS,
                'sports_type': 'Basketball',
                'date': datetime.now() + timedelta(days=28),
                'start_time': '16:00',
                'end_time': '20:00',
                'venue': 'Basketball Court',
                'registration_status': RegistrationStatus.UPCOMING,
                'total_slots': 100,
                'organizer': 'Sports Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Basketball+Tournament',
            },
            {
                'title': 'Fashion Show',
                'description': 'Showcase traditional and contemporary fashion. Walk the ramp with latest trends and designs.',
                'event_type': EventType.CULTURAL,
                'sports_type': None,
                'date': datetime.now() + timedelta(days=30),
                'start_time': '18:00',
                'end_time': '20:30',
                'venue': 'Convention Hall',
                'registration_status': RegistrationStatus.UPCOMING,
                'total_slots': 100,
                'organizer': 'Fashion Club',
                'image_url': 'https://via.placeholder.com/400x300?text=Fashion+Show',
            },
            {
                'title': 'Cricket Finals',
                'description': 'Inter-hostel T20 cricket finals. Best teams compete for the championship title.',
                'event_type': EventType.SPORTS,
                'sports_type': 'Cricket',
                'date': datetime.now() + timedelta(days=35),
                'start_time': '14:00',
                'end_time': '18:00',
                'venue': 'Cricket Ground',
                'registration_status': RegistrationStatus.UPCOMING,
                'total_slots': 300,
                'organizer': 'Sports Committee',
                'image_url': 'https://via.placeholder.com/400x300?text=Cricket+Finals',
            },
        ]
        
        # Add events to the database
        created_count = 0
        for event_data in events_data:
            event = HostelEvent(
                id=str(uuid.uuid4()),
                **event_data
            )
            db.session.add(event)
            created_count += 1
        
        db.session.commit()
        print(f"✓ Successfully seeded {created_count} dummy events!")
        
        # Display the created events
        events = HostelEvent.query.all()
        print(f"\nTotal events in database: {len(events)}\n")
        for event in events:
            print(f"  • {event.title}")
            print(f"    Type: {event.event_type.value.capitalize()}")
            print(f"    Date: {event.date.strftime('%Y-%m-%d %H:%M')}")
            print(f"    Venue: {event.venue}")
            print(f"    Status: {event.registration_status.value}")
            print()

if __name__ == '__main__':
    seed_events()
