# api/algorithms.py

from .models import Project, Task, EmployeeProfile, AvailabilitySlot
from django.contrib.auth.models import User
import random
import json
from deap import base, creator, tools, algorithms
from datetime import datetime, timedelta, time
# --- TASK ASSIGNMENT ALGORITHM (Already complete) ---

def run_weighted_task_assignment(project_id):
    """
    This is the REAL SoSTA/Weighted Scoring algorithm.
    It iterates through each task and finds the best employee for it.
    """
    
    print(f"--- RUNNING REAL TASK ASSIGNMENT for Project {project_id} ---")

    try:
        project = Project.objects.get(id=project_id)
        
        # 1. GET ALL DATA
        tasks = list(project.tasks.filter(assigned_to=None))
        members = project.members.all()
        
        if not tasks:
            print("No unassigned tasks to process.")
            return {"status": "no_op", "message": "No unassigned tasks found."}
        if not members:
            print("No members in this project.")
            return {"status": "error", "message": "No members in this project to assign tasks to."}

        profiles = {member.id: member.profile for member in members}
        assignments_made = []

        # 2. THE NEW GREEDY ASSIGNMENT LOGIC
        for task in tasks:
            task_data = task.task_data
            required_skills = task_data.get('required_skills', [])
            task_category = task_data.get('category', '').lower()
            
            best_member = None
            lowest_cost = float('inf')

            # 3. THE SCORING ALGORITHM
            for member in members:
                profile = profiles[member.id]
                profile_data = profile.profile_data
                
                skill_score = 0
                member_skills = profile_data.get('skills', {})
                if not required_skills:
                    skill_score = 1
                else:
                    for skill in required_skills:
                        skill_score += member_skills.get(skill, 0)
                
                preference_score = 0
                member_prefs = profile_data.get('preferences', {})
                if task_category:
                    preference_score = member_prefs.get(task_category, 0)
                
                workload_penalty = profile.current_workload * 2  # Reduced from 5 to 2
                final_cost = (workload_penalty) - (skill_score * 0.7) - (preference_score * 0.3)
                
                if final_cost < lowest_cost:
                    lowest_cost = final_cost
                    best_member = member
            
            # 4. ASSIGN THE TASK
            if best_member:
                task.assigned_to = best_member
                task.status = 'IN_PROGRESS'
                task.save()

                profile = profiles[best_member.id]
                profile.current_workload += task.estimated_hours
                profile.save() 
                
                assignments_made.append(f"Assigned '{task.title}' to '{best_member.username}' (Cost: {lowest_cost:.2f})")
                print(f"Assigned '{task.title}' to '{best_member.username}' (Cost: {lowest_cost:.2f})")
            else:
                print(f"Could not find any member for task '{task.title}'")

        print(f"--- Assignment Complete. {len(assignments_made)} tasks assigned. ---")
        return {"status": "success", "message": "\n".join(assignments_made)}

    except Exception as e:
        print(f"ERROR in task assignment: {e}")
        return {"status": "error", "message": str(e)}



# --- MEETING SCHEDULER (GENETIC ALGORITHM) ---

# We'll define the search space: Weekdays (Mon-Fri), 9am to 5pm (in minutes from midnight)
SEARCH_SPACE_START_MINUTE = 9 * 60  # 9:00 AM
SEARCH_SPACE_END_MINUTE = 17 * 60   # 5:00 PM
MEETING_INCREMENT_MINUTES = 15      # Check times every 15 mins
POPULATION_SIZE = 50
GENERATIONS = 40
CXPB, MUTPB = 0.5, 0.2 # Crossover and Mutation probabilities

# This holds all the data the GA needs
class SchedulerContext:
    def __init__(self, project_id, duration_minutes):
        self.project = Project.objects.get(id=project_id)
        self.members = self.project.members.all()
        self.member_count = len(self.members)
        self.duration_minutes = duration_minutes
        
        self.availability_slots = []
        for member in self.members:
            # We must convert times to user's timezone, or use aware datetimes.
            # For simplicity, we'll assume all times are UTC for now.
            slots = AvailabilitySlot.objects.filter(employee=member)
            for slot in slots:
                self.availability_slots.append((member.id, slot.start_time, slot.end_time))
        
        print(f"[GA] Context created for {self.member_count} members.")
        print(f"[GA] Found {len(self.availability_slots)} total availability slots.")


# --- 2. The Fitness Function (The "Brain") ---
def evaluate_meeting_time(context, individual):
    # 'individual' is a list with one number, e.g., [36]
    # This number represents the *15-minute block index* from the start of the week.
    
    # --- THIS IS FIX #1 ---
    # Unpack the index from the list and multiply to get the *actual* minute
    start_time_index = individual[0]
    start_minutes_from_week_start = start_time_index * MEETING_INCREMENT_MINUTES
    # --- END FIX #1 ---

    # Get the day of the week (0=Mon, 1=Tue, etc.) and time of day
    day_of_week = start_minutes_from_week_start // (24 * 60)
    minutes_in_day = start_minutes_from_week_start % (24 * 60)
    
    # --- Constraint 1: Must be within business hours (9am-5pm) ---
    if not (SEARCH_SPACE_START_MINUTE <= minutes_in_day <= SEARCH_SPACE_END_MINUTE - context.duration_minutes):
        return (0,) # Fitness = 0 (terrible)

    # --- Constraint 2: Must be on a weekday (Mon-Fri) ---
    if not (0 <= day_of_week <= 4):
        return (0,) # Fitness = 0 (terrible)
    
    # Find the *actual* datetime for this potential slot
    today = datetime.now().date()
    next_monday = today + timedelta(days=-today.weekday())
    
    potential_start = datetime.combine(next_monday, time(0, 0)) + timedelta(days=day_of_week, minutes=minutes_in_day)
    potential_end = potential_start + timedelta(minutes=context.duration_minutes)

    # --- Fitness Score: Check how many members are available ---
    available_members = set()
    for (member_id, slot_start, slot_end) in context.availability_slots:
        
        # Check if the member's slot [slot_start, slot_end]
        # completely *contains* the [potential_start, potential_end]
        # Convert to UTC for consistent comparison
        potential_start_utc = potential_start.astimezone(slot_start.tzinfo)
        potential_end_utc = potential_end.astimezone(slot_end.tzinfo)
        
        is_available = (slot_start <= potential_start_utc and 
                       slot_end >= potential_end_utc)
        
        if is_available:
            available_members.add(member_id)
            
    # The fitness is the percentage of members who can attend
    fitness_score = len(available_members) / context.member_count
    
    return (fitness_score,) # Return as a tuple


# --- 3. The Main GA Function ---
def run_genetic_scheduler(project_id, duration_hours):
    duration_minutes = int(duration_hours * 60)
    
    context = SchedulerContext(project_id, duration_minutes)
    if context.member_count == 0:
        return {"status": "error", "message": "No members in project."}

    random.seed(project_id)

    # 2. Setup the Genetic Algorithm (DEAP)
    # These create the classes *once*. The warnings in your log are normal.
    try:
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMax)
    except Exception as e:
        pass # Classes already created, this is fine

    toolbox = base.Toolbox()
    
    # Define a "gene": a random integer representing a 15-min block *index*
    total_minutes_in_week = 5 * 24 * 60
    total_increments = total_minutes_in_week // MEETING_INCREMENT_MINUTES
    
    toolbox.register("attr_int", random.randint, 0, total_increments - 1)
    
    # --- THIS IS FIX #2 ---
    # Define an "Individual": a list containing one "gene" (the index, e.g., [36])
    # We are NOT multiplying by 15 here.
    toolbox.register("individual", tools.initRepeat, creator.Individual, toolbox.attr_int, n=1)
    # --- END FIX #2 ---

    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_meeting_time, context)
    toolbox.register("mate", tools.cxUniform, indpb=0.5)
    # Mutate by picking a new random index
    toolbox.register("mutate", tools.mutUniformInt, low=0, up=total_increments - 1, indpb=0.1)
    toolbox.register("select", tools.selTournament, tournsize=3)

    # 4. Run the Algorithm
    pop = toolbox.population(n=POPULATION_SIZE)
    hof = tools.HallOfFame(1)
    
    algorithms.eaSimple(pop, toolbox, cxpb=CXPB, mutpb=MUTPB, ngen=GENERATIONS, halloffame=hof, verbose=False)
    
    # 5. Get the Best Result
    best_individual = hof[0]
    best_fitness = best_individual.fitness.values[0]
    
    # --- THIS IS FIX #3 ---
    # Convert the best *index* back into a real datetime
    start_time_index = best_individual[0]
    start_minutes_from_week_start = start_time_index * MEETING_INCREMENT_MINUTES
    # --- END FIX #3 ---
    
    day_of_week = start_minutes_from_week_start // (24 * 60)
    minutes_in_day = start_minutes_from_week_start % (24 * 60)
    
    today = datetime.now().date()
    next_monday = today + timedelta(days=-today.weekday())
    best_start_time = datetime.combine(next_monday, time(0, 0)) + timedelta(days=day_of_week, minutes=minutes_in_day)
    best_end_time = best_start_time + timedelta(minutes=duration_minutes)

    best_slot_found = {
        "start_time": best_start_time.isoformat(),
        "end_time": best_end_time.isoformat(),
        "attendees_count": int(best_fitness * context.member_count),
        "total_members": context.member_count,
        "fitness_score": best_fitness
    }

    print(f"[GA] Best slot found: {best_slot_found}")
    return {"status": "success", "best_slot": best_slot_found}