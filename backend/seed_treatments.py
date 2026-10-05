import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.connection import SessionLocal, engine, Base
from app.models.water_models import Treatment

def seed_treatments(force=False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if not force and db.query(Treatment).count() > 0:
        db.close()
        return
    
    treatments = [
        # === pH TREATMENTS ===
        Treatment(
            parameter="pH", condition="High", treatment_name="Chemical: Acid Injection (Sulfuric/Hydrochloric)",
            description="Controlled dosing of strong acids to rapidly lower alkaline pH.",
            working_principle="Acidic ions (H+) neutralize excess hydroxide (OH-) ions in the water.",
            advantages="Instantaneous results; easily automated.", limitations="Handles hazardous chemicals.",
            maintenance="Weekly calibration of pH sensors and pump diaphragms.", estimated_cost="Medium", precautions="Full PPE required."
        ),
        Treatment(
            parameter="pH", condition="High", treatment_name="Gas: Carbon Dioxide (CO2) Injection",
            description="Bubbling CO2 gas into water to safely lower pH without harsh liquid acids.",
            working_principle="CO2 dissolves in water to form weak carbonic acid, gently lowering pH.",
            advantages="Self-buffering (impossible to accidentally drop pH below 6.0); much safer than sulfuric acid.", limitations="Slower reaction time.",
            maintenance="Monitor gas cylinder pressure and check diffusers for calcification.", estimated_cost="High (Initial setup), Low (Ongoing)", precautions="Ensure proper ventilation to prevent CO2 buildup in enclosed spaces."
        ),
        Treatment(
            parameter="pH", condition="Low", treatment_name="Chemical: Sodium Hydroxide (Caustic Soda) Dosing",
            description="Injecting strong liquid base to rapidly raise acidic pH.",
            working_principle="Hydroxide ions (OH-) neutralize acidic (H+) ions.",
            advantages="Fast acting.", limitations="Highly corrosive and dangerous to handle.",
            maintenance="Regular flushing of chemical feed lines.", estimated_cost="Medium", precautions="Causes severe burns; strictly enforce safety protocols."
        ),
        Treatment(
            parameter="pH", condition="Low", treatment_name="Passive: Limestone Contact Beds",
            description="Routing water through beds of crushed calcium carbonate.",
            working_principle="Acidic water dissolves the limestone, naturally raising pH and alkalinity.",
            advantages="Zero energy required; self-regulating.", limitations="Increases water hardness.",
            maintenance="Periodically rake and replenish limestone media.", estimated_cost="Low", precautions="Monitor for scaling in downstream pipes."
        ),

        # === DISSOLVED OXYGEN (DO) TREATMENTS ===
        Treatment(
            parameter="Dissolved Oxygen", condition="Low", treatment_name="Mechanical: Surface Aeration",
            description="Agitating the water surface to maximize atmospheric oxygen transfer.",
            working_principle="Propellers create a massive surface area of water droplets exposed to the air, drawing oxygen in.",
            advantages="High oxygen transfer rate.", limitations="Loud; high electrical footprint.",
            maintenance="Annual gearbox oil changes; check for debris tangling the impeller.", estimated_cost="High", precautions="Keep away from floating debris."
        ),
        Treatment(
            parameter="Dissolved Oxygen", condition="Low", treatment_name="Biological: Algal Photosynthesis Optimization",
            description="Managing light and nutrients to encourage natural oxygen production via algae during the day.",
            working_principle="Phytoplankton convert sunlight and CO2 into pure dissolved oxygen.",
            advantages="100% natural and free.", limitations="DO drops severely at night (respiration).",
            maintenance="Monitor nutrient levels to prevent toxic blooms.", estimated_cost="Low", precautions="Avoid over-fertilization."
        ),

        # === AMMONIA TREATMENTS ===
        Treatment(
            parameter="Ammonia", condition="High", treatment_name="Biological: MBBR (Moving Bed Biofilm Reactor)",
            description="Using suspended plastic carriers coated in bacteria to consume ammonia.",
            working_principle="Nitrifying bacteria living on the plastic media oxidize toxic ammonia (NH3) into less harmful nitrates.",
            advantages="Extremely robust; handles shock loads well.", limitations="Requires constant aeration.",
            maintenance="Check aeration grids; ensure media is freely moving.", estimated_cost="High", precautions="Monitor pH, as nitrification consumes alkalinity."
        ),
        Treatment(
            parameter="Ammonia", condition="High", treatment_name="Physical: Air Stripping",
            description="Converting ammonia to gas and blowing it out of the water.",
            working_principle="Water pH is raised above 10.5 (turning ammonium into ammonia gas), then cascaded through a tower with upward airflow to strip the gas.",
            advantages="Removes ammonia entirely from the liquid phase.", limitations="Causes air pollution if gas isn't scrubbed.",
            maintenance="Acid-wash the tower packing regularly to remove scale.", estimated_cost="Very High", precautions="Requires strict exhaust scrubbing systems."
        ),

        # === BIOCHEMICAL OXYGEN DEMAND (BOD) ===
        Treatment(
            parameter="Biochemical Oxygen Demand", condition="High", treatment_name="Biological: Activated Sludge Process",
            description="Cultivating a mass of microorganisms to 'eat' the organic waste.",
            working_principle="Aerobic bacteria metabolize the dissolved organic matter (BOD) for energy, converting it to biomass and CO2.",
            advantages="Industry standard; 95%+ removal efficiency.", limitations="Produces massive amounts of sludge waste.",
            maintenance="Daily wasting of excess sludge (WAS); monitor settling rates.", estimated_cost="High", precautions="Ensure uninterrupted oxygen supply."
        ),
        
        # === PREVENTATIVE MAINTENANCE ===
        Treatment(
            parameter="Dissolved Oxygen", condition="Maintenance", treatment_name="Automated DO Profiling",
            description="Continuous monitoring and AI-driven aeration cycling.",
            working_principle="Submerged optical sensors monitor DO in real-time and only activate aerators when DO drops below 5.5 mg/L.",
            advantages="Cuts energy costs by up to 40%.", limitations="Requires advanced sensor networks.",
            maintenance="Wipe optical sensor lenses monthly.", estimated_cost="Medium", precautions="Ensure fail-safe triggers if sensors drift."
        ),
        Treatment(
            parameter="Orthophosphate", condition="Maintenance", treatment_name="Constructed Wetlands",
            description="Routing inflow through engineered marshes to trap nutrients naturally.",
            working_principle="Wetland plants (cattails, reeds) and soil microbes absorb phosphorus from the water before it reaches the main body.",
            advantages="Provides wildlife habitat; aesthetically pleasing.", limitations="Requires a massive footprint of land.",
            maintenance="Harvesting wetland plants annually.", estimated_cost="Low (Ongoing), High (Land acquisition)", precautions="Prevent invasive plant species from taking over."
        )
    ]
    
    print("Clearing existing treatments...")
    db.query(Treatment).delete()
    print("Inserting comprehensive industrial treatment options...")
    db.add_all(treatments)
    db.commit()
    db.close()
    print("Database successfully seeded with comprehensive treatment data!")

if __name__ == "__main__":
    seed_treatments(force=True)