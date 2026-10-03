"""
Disaster Evacuation Planner - Data Models
Location: Hyderabad Emergency Operations Network
"""

from typing import Dict, List, Any

PRESETS: Dict[str, Any] = {
    "standard": {
        "name": "Hyderabad Metro Scenario",
        "description": "Multi-zone disaster triage with Fire, Flood, Accident, and Landslide emergencies.",
        "zones": [
            {
                "id": "A",
                "name": "Zone A",
                "type": "Fire",
                "icon": "🔥",
                "severityLabel": "CRITICAL",
                "severityClass": "badge-critical",
                "population": 320,
                "threatSeverity": 95,
                "timeUrgency": 90,
                "vulnerability": 85,
                "priorityScore": 93.8,
                "evacuated": 0,
                "remaining": 320,
                "status": "WAITING"
            },
            {
                "id": "C",
                "name": "Zone C",
                "type": "Flood",
                "icon": "🌊",
                "severityLabel": "HIGH",
                "severityClass": "badge-orange",
                "population": 180,
                "threatSeverity": 80,
                "timeUrgency": 75,
                "vulnerability": 70,
                "priorityScore": 71.5,
                "evacuated": 0,
                "remaining": 180,
                "status": "WAITING"
            },
            {
                "id": "D",
                "name": "Zone D",
                "type": "Accident",
                "icon": "🚗",
                "severityLabel": "HIGH",
                "severityClass": "badge-orange",
                "population": 120,
                "threatSeverity": 75,
                "timeUrgency": 70,
                "vulnerability": 65,
                "priorityScore": 63.3,
                "evacuated": 0,
                "remaining": 120,
                "status": "WAITING"
            },
            {
                "id": "B",
                "name": "Zone B",
                "type": "Gas Leak",
                "icon": "💨",
                "severityLabel": "MEDIUM",
                "severityClass": "badge-yellow",
                "population": 90,
                "threatSeverity": 60,
                "timeUrgency": 55,
                "vulnerability": 50,
                "priorityScore": 49.5,
                "evacuated": 0,
                "remaining": 90,
                "status": "WAITING"
            },
            {
                "id": "E",
                "name": "Zone E",
                "type": "Building Collapse",
                "icon": "🏚",
                "severityLabel": "LOW",
                "severityClass": "badge-green",
                "population": 60,
                "threatSeverity": 40,
                "timeUrgency": 45,
                "vulnerability": 40,
                "priorityScore": 36.0,
                "evacuated": 0,
                "remaining": 60,
                "status": "WAITING"
            }
        ],
        "shelters": [
            {
                "id": "S01",
                "name": "Shelter S01 (Community Hall)",
                "totalCapacity": 180,
                "currentOccupancy": 30,
                "availableCapacity": 150,
                "location": {"lat": 17.4485, "lng": 78.3908},
                "status": "OPERATIONAL"
            },
            {
                "id": "S02",
                "name": "Shelter S02 (Government School)",
                "totalCapacity": 600,
                "currentOccupancy": 150,
                "availableCapacity": 450,
                "location": {"lat": 17.4350, "lng": 78.4980},
                "status": "OPERATIONAL"
            },
            {
                "id": "S03",
                "name": "Shelter S03 (Red Cross Center)",
                "totalCapacity": 220,
                "currentOccupancy": 120,
                "availableCapacity": 100,
                "location": {"lat": 17.3750, "lng": 78.4350},
                "status": "OPERATIONAL"
            },
            {
                "id": "S04",
                "name": "Shelter S04 (Sports Arena)",
                "totalCapacity": 800,
                "currentOccupancy": 150,
                "availableCapacity": 650,
                "location": {"lat": 17.3380, "lng": 78.4890},
                "status": "OPERATIONAL"
            }
        ],
        "roads": [
            {"id": "A-J_Banjara", "source": "A", "destination": "J_Banjara", "cost": 4.2, "blocked": False, "status": "open"},
            {"id": "A-J_Hitec", "source": "A", "destination": "J_Hitec", "cost": 5.1, "blocked": False, "status": "open"},
            {"id": "B-J_Charminar", "source": "B", "destination": "J_Charminar", "cost": 3.8, "blocked": False, "status": "open"},
            {"id": "B-J_Mehdipatnam", "source": "B", "destination": "J_Mehdipatnam", "cost": 4.5, "blocked": False, "status": "open"},
            {"id": "C-J_Banjara", "source": "C", "destination": "J_Banjara", "cost": 3.2, "blocked": False, "status": "open"},
            {"id": "C-J_Central", "source": "C", "destination": "J_Central", "cost": 4.8, "blocked": True, "status": "blocked"},
            {"id": "D-J_Banjara", "source": "D", "destination": "J_Banjara", "cost": 3.5, "blocked": False, "status": "open"},
            {"id": "D-J_Central", "source": "D", "destination": "J_Central", "cost": 4.0, "blocked": False, "status": "open"},
            {"id": "E-J_Charminar", "source": "E", "destination": "J_Charminar", "cost": 4.1, "blocked": False, "status": "open"},
            {"id": "E-J_Mehdipatnam", "source": "E", "destination": "J_Mehdipatnam", "cost": 3.6, "blocked": False, "status": "open"},
            {"id": "J_Banjara-J_Central", "source": "J_Banjara", "destination": "J_Central", "cost": 3.6, "blocked": False, "status": "open"},
            {"id": "J_Hitec-J_Central", "source": "J_Hitec", "destination": "J_Central", "cost": 6.8, "blocked": False, "status": "open"},
            {"id": "J_Central-J_Secunderabad", "source": "J_Central", "destination": "J_Secunderabad", "cost": 4.5, "blocked": False, "status": "open"},
            {"id": "J_Central-J_Charminar", "source": "J_Central", "destination": "J_Charminar", "cost": 5.2, "blocked": False, "status": "open"},
            {"id": "J_Mehdipatnam-J_Charminar", "source": "J_Mehdipatnam", "destination": "J_Charminar", "cost": 4.0, "blocked": True, "status": "blocked"},
            {"id": "J_Central-S01", "source": "J_Central", "destination": "S01", "cost": 2.0, "blocked": False, "status": "open"},
            {"id": "J_Central-S02", "source": "J_Central", "destination": "S02", "cost": 3.8, "blocked": False, "status": "open"},
            {"id": "J_Secunderabad-S02", "source": "J_Secunderabad", "destination": "S02", "cost": 2.5, "blocked": False, "status": "open"},
            {"id": "J_Charminar-S03", "source": "J_Charminar", "destination": "S03", "cost": 2.1, "blocked": False, "status": "open"},
            {"id": "J_Charminar-S04", "source": "J_Charminar", "destination": "S04", "cost": 2.6, "blocked": False, "status": "open"}
        ]
    }
}

NODE_POSITIONS: Dict[str, Any] = {
    "A": {"lat": 17.4320, "lng": 78.4070, "label": "Zone A", "type": "danger", "name": "Zone A (Jubilee Hills)"},
    "B": {"lat": 17.3616, "lng": 78.4747, "label": "Zone B", "type": "danger", "name": "Zone B (Old City)"},
    "C": {"lat": 17.4150, "lng": 78.4350, "label": "Zone C", "type": "danger", "name": "Zone C (Banjara Rd 12)"},
    "D": {"lat": 17.4280, "lng": 78.4520, "label": "Zone D", "type": "danger", "name": "Zone D (Panjagutta)"},
    "E": {"lat": 17.3850, "lng": 78.4420, "label": "Zone E", "type": "danger", "name": "Zone E (Mehdipatnam South)"},
    "J_Banjara": {"lat": 17.4160, "lng": 78.4480, "label": "Banjara Junc", "type": "transit", "name": "Banjara Hills Junction"},
    "J_Hitec": {"lat": 17.4474, "lng": 78.3762, "label": "HITEC Junc", "type": "transit", "name": "HITEC City Flyover"},
    "J_Central": {"lat": 17.4080, "lng": 78.4720, "label": "Central Hub", "type": "transit", "name": "Central Secretariat Junction"},
    "J_Secunderabad": {"lat": 17.4399, "lng": 78.4983, "label": "Sec'bad Junc", "type": "transit", "name": "Secunderabad Station Junction"},
    "J_Charminar": {"lat": 17.3550, "lng": 78.4650, "label": "Charminar Hub", "type": "transit", "name": "Charminar Transit Plaza"},
    "J_Mehdipatnam": {"lat": 17.3916, "lng": 78.4402, "label": "Mehdi Junc", "type": "transit", "name": "Mehdipatnam Ring Junction"},
    "S01": {"lat": 17.4485, "lng": 78.3908, "label": "S01", "type": "shelter", "name": "Shelter S01 (Community Hall)"},
    "S02": {"lat": 17.4350, "lng": 78.4980, "label": "S02", "type": "shelter", "name": "Shelter S02 (Government School)"},
    "S03": {"lat": 17.3750, "lng": 78.4350, "label": "S03", "type": "shelter", "name": "Shelter S03 (Red Cross Center)"},
    "S04": {"lat": 17.3380, "lng": 78.4890, "label": "S04", "type": "shelter", "name": "Shelter S04 (Sports Arena)"}
}

DEFAULT_SCENARIO = {
    **PRESETS["standard"],
    "nodePositions": NODE_POSITIONS
}
