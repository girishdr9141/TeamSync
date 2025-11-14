# api/algorithms.py

# --- V2.0 IMPORTS ---
from .models import Project, Task, EmployeeProfile, AvailabilitySlot
from django.contrib.auth.models import User
from django.utils import timezone # For getting 'now()' when setting deadlines
from .utils import DateCalculator # Our new business-aware date tool

# --- V4.0 IMPORTS ---
# We need these for our new dynamic workload query
from django.db.models import Sum, F, FloatField, Q
from django.db.models.functions import Coalesce
# --- END V4.0 IMPORTS ---

import random
import json
from deap import base, creator, tools, algorithms
from datetime import datetime, timedelta, time
import math
# Assuming DateCalculator and Project, Task, and UserProfile models are imported or accessible
# from .models import Project, Task, UserProfile # Example import
# from .utils import DateCalculator # Example import

# --- V2.0 CONSTANTS ---
MAX_STRIKES_ALLOWED = 5 
DEADLINE_BUFFER_MULTIPLIER = 1.25 

# NEW ALGORITHM WEIGHTS (from our discussion, tuned for balance)
WEIGHT_WORKLOAD = 2        # Lower weight for workload cost, to avoid always picking the freest.
WEIGHT_SKILL = 5           # High weight for skill mismatch cost, making skills very important.
WEIGHT_PREFERENCE = 3      # Medium weight for preference mismatch cost.
MAX_SKILL_LEVEL = 5        # Assuming skill levels are 0-5
MAX_PREFERENCE_LEVEL = 5   # Assuming preference levels are 0-5
# --- END V2.0 CONSTANTS ---

def run_weighted_task_assignment(project_id):
    """
    V4.0 - SoSTA/Weighted Scoring algorithm.
    - DYNAMIC WORKLOAD: Calculates 'remaining_workload' in real-time.
    - Filters out "fired" employees (>= 5 strikes).
    - Calculates and sets a business-aware deadline for tasks.
    - Uses a cost-based formula (Workload_cost + Skill_mismatch_cost + Preference_mismatch_cost).
    """
    
    print(f"--- RUNNING V4.0 TASK ASSIGNMENT for Project {project_id} ---")

    calculator = DateCalculator() # Instantiate our calculator utility once

    try:
        project = Project.objects.get(id=project_id)
        
        # 1. GET ALL DATA
        tasks = list(project.tasks.filter(assigned_to=None))
        
        # Fetch members with their profiles eagerly to avoid N+1 queries later
        all_members_with_profiles = project.members.all().select_related('profile')
        
        # --- V2.0 STRIKE SYSTEM (FEATURE 4) ---
        # Filter out members who have too many strikes.
        eligible_members = [
            m for m in all_members_with_profiles 
            if m.profile.strike_count < MAX_STRIKES_ALLOWED
        ]
        print(f"Found {len(all_members_with_profiles)} total members. {len(eligible_members)} are eligible for tasks.")
        # --- END V2.0 ---
        
        if not tasks:
            print("No unassigned tasks to process.")
            return {"status": "no_op", "message": "No unassigned tasks found."}
        if not eligible_members:
            print("No eligible members in this project (check strike counts or if project has members).")
            return {"status": "error", "message": "No eligible members found to assign tasks to."}

        # Create a dictionary for quick profile lookup by member ID
        profiles_map = {member.id: member.profile for member in eligible_members}
        assignments_made = []

        # --- V4.0: DYNAMIC WORKLOAD CALCULATION ---
        print("[V4.0] Calculating real-time remaining workloads for eligible members...")
        
        eligible_member_ids = [m.id for m in eligible_members]
        
        # This one query calculates the remaining work for ALL eligible members
        # It groups all non-completed tasks by user and sums their remaining work
        workload_data = Task.objects.filter(
            assigned_to__id__in=eligible_member_ids,
            progress__lt=100 # Only count tasks that are not 100% done
        ).annotate(
            # Calculate remaining work for *each* task: hours * (1 - progress_percent)
            remaining_work_per_task=F('estimated_hours') * (1.0 - F('progress') / 100.0)
        ).values(
            'assigned_to' # Group by user
        ).annotate(
            # Sum the remaining work for that user
            total_remaining_workload=Coalesce(
                Sum('remaining_work_per_task', output_field=FloatField()), 
                0.0 # Use Coalesce to turn NULL sums (no tasks) into 0.0
            )
        ).values(
            'assigned_to', 'total_remaining_workload' # Select the user ID and their total
        )
        
        # Create a lookup map for workloads: {member_id: remaining_workload}
        # Start by defaulting everyone to 0.0
        member_workloads = {member_id: 0.0 for member_id in eligible_member_ids}
        # Then, fill in the calculated workloads from the query
        for item in workload_data:
            member_workloads[item['assigned_to']] = item['total_remaining_workload']

        print(f"[V4.0] Calculated workloads: {member_workloads}")

        # Now, calculate max_workload from our new in-memory dictionary
        max_workload = max(member_workloads.values() or [0.0]) # Use 0.0 to handle empty list
        print(f"[V4.0] Initial maximum remaining workload: {max_workload:.2f} hours.")
        # --- END V4.0 WORKLOAD CALCULATION ---


        # 2. THE GREEDY ASSIGNMENT LOGIC
        for task in tasks:
            task_data = task.task_data
            required_skills = task_data.get('required_skills', []) # e.g., ['Python', 'Django']
            task_category = task_data.get('category', '').lower() # e.g., 'backend', 'frontend'
            
            best_member = None
            lowest_cost = float('inf')

            # 3. THE SCORING ALGORITHM
            for member in eligible_members:
                profile = profiles_map[member.id]
                profile_data = profile.profile_data # Assuming this is a JSONField
                
                # --- V4.0 CHANGE: Get REAL-TIME workload ---
                # Get the workload from our in-memory map
                current_remaining_workload = member_workloads[member.id]
                # --- END V4.0 CHANGE ---
                
                # --- START: REVISED NORMALIZATION & COST FORMULA INTEGRATION ---
                
                # A. Calculate Normalized Workload Cost (Range 0 - WEIGHT_WORKLOAD)
                if max_workload > 0:
                    # Use the new dynamic workload
                    workload_ratio = current_remaining_workload / max_workload
                else:
                    workload_ratio = 0 # If all workloads are zero, everyone has 0 workload cost
                workload_cost = workload_ratio * WEIGHT_WORKLOAD
                
                # B. Calculate Skill Mismatch Cost (Range 0 - WEIGHT_SKILL)
                raw_skill_score = 0
                member_skills = profile_data.get('skills', {}) # e.g., {'Python': 4, 'Django': 5, 'React': 3}

                if required_skills:
                    # Sum up skill levels for required skills for the member
                    for skill_name in required_skills:
                        raw_skill_score += member_skills.get(skill_name, 0) # Get skill level, 0 if not present

                    # Max possible score for this task (if member had all required skills at MAX_SKILL_LEVEL)
                    max_possible_skill_score_for_task = len(required_skills) * MAX_SKILL_LEVEL 
                else:
                    max_possible_skill_score_for_task = 1 # Prevent ZeroDivisionError if no skills required

                # Normalize the raw score to a 0-1 scale
                normalized_skill = (raw_skill_score / max_possible_skill_score_for_task) if max_possible_skill_score_for_task > 0 else 0
                
                # If no skills required for the task, it's considered a perfect skill match (no skill cost)
                if not required_skills:
                    normalized_skill = 1.0 
                
                # Invert the normalized_skill (1.0 perfect match -> 0.0 cost; 0.0 no match -> WEIGHT_SKILL cost)
                skill_cost = (1.0 - normalized_skill) * WEIGHT_SKILL

                # C. Calculate Preference Mismatch Cost (Range 0 - WEIGHT_PREFERENCE)
                raw_preference_score = 0
                member_prefs = profile_data.get('preferences', {}) # e.g., {'frontend': 4, 'backend': 5}
                
                if task_category:
                    # Get preference level for the task's category from member's profile
                    raw_preference_score = member_prefs.get(task_category, 0)
                
                # Normalize the raw preference score to a 0-1 scale
                normalized_preference = (raw_preference_score / MAX_PREFERENCE_LEVEL) if MAX_PREFERENCE_LEVEL > 0 else 0
                
                # If no task category or preference data, treat as neutral (no preference cost)
                if not task_category:
                    normalized_preference = 1.0 # No preference mismatch cost

                # Invert the normalized_preference (1.0 perfect match -> 0.0 cost; 0.0 no match -> WEIGHT_PREFERENCE cost)
                pref_cost = (1.0 - normalized_preference) * WEIGHT_PREFERENCE

                # D. Calculate Final Cost (Sum of all costs)
                final_cost = workload_cost + skill_cost + pref_cost
                
                # --- END: REVISED NORMALIZATION & COST FORMULA INTEGRATION ---

                # --- DEBUGGING OUTPUT (V4.0 Updated) ---
                print(
                    f"  - Task '{task.title}' for Member: {member.username} (Remaining Workload: {current_remaining_workload:.1f}h) "
                    f"--> FINAL_COST: {final_cost:.2f} "
                    f"(W:{workload_cost:.2f}, S:{skill_cost:.2f}, P:{pref_cost:.2f})"
                )
                # --- END DEBUGGING ---
                
                if final_cost < lowest_cost:
                    lowest_cost = final_cost
                    best_member = member
            
            # 4. ASSIGN THE TASK
            if best_member:
                # --- V2.0 DEADLINE CALCULATION (FEATURE 3) ---
                start_time = timezone.now()
                hours_with_buffer = task.estimated_hours * DEADLINE_BUFFER_MULTIPLIER
                due_date = calculator.add_business_hours(start_time, hours_with_buffer)
                task.due_date = due_date
                # --- END V2.0 ---
                
                task.assigned_to = best_member
                task.status = 'IN_PROGRESS' # As per V2.0 logic
                task.progress = 0 # A new task always starts at 0
                task.save() 

                # --- V4.0 DYNAMIC WORKLOAD UPDATE ---
                # We no longer save to profile. We update our in-memory map
                # for the next task's calculation in this *same run*.
                
                # A new task (0% progress) adds its full duration to the workload
                member_workloads[best_member.id] += task.estimated_hours
                
                # CRITICAL: Update max_workload for the next loop's normalization
                max_workload = max(member_workloads.values() or [0.0])
                # --- END V4.0 ---
                
                # --- V2.0: Updated log message ---
                assignment_msg = (
                    f"Assigned '{task.title}' to '{best_member.username}' "
                    f"(Cost: {lowest_cost:.2f}) - Due: {due_date.strftime('%Y-%m-%d %H:%M')}"
                )
                assignments_made.append(assignment_msg)
                print(assignment_msg)
                # --- V4.0: New log message ---
                print(f"   -> [V4.0] Updated {best_member.username}'s in-memory workload to: {member_workloads[best_member.id]:.1f}h. New max_workload: {max_workload:.1f}h")
            else:
                print(f"WARNING: Could not find any eligible member for task '{task.title}' after evaluation. Task remains unassigned.")

        print(f"--- Assignment Complete. {len(assignments_made)} tasks assigned. ---")
        return {"status": "success", "message": "\n".join(assignments_made)}

    except Project.DoesNotExist:
        print(f"ERROR: Project with ID {project_id} not found.")
        return {"status": "error", "message": f"Project with ID {project_id} not found."}
    except Exception as e:
        print(f"CRITICAL ERROR in task assignment: {e}")
        import traceback
        traceback.print_exc() # Print full stack trace for debugging
        return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}
# --- MEETING SCHEDULER (GENETIC ALGORITHM) ---
# --- NO CHANGES BELOW THIS LINE ---

# We'll define the search space: Weekdays (Mon-Fri), 9am to 5pm (in minutes from midnight)
SEARCH_SPACE_START_MINUTE = 9 * 60  # 9:00 AM
SEARCH_SPACE_END_MINUTE = 17 * 60  # 5:00 PM
MEETING_INCREMENT_MINUTES = 15     # Check times every 15 mins
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
            slots = AvailabilitySlot.objects.filter(employee=member)
            for slot in slots:
                self.availability_slots.append((member.id, slot.start_time, slot.end_time))
        
        print(f"[GA] Context created for {self.member_count} members.")
        print(f"[GA] Found {len(self.availability_slots)} total availability slots.")


# --- 2. The Fitness Function (The "Brain") ---
def evaluate_meeting_time(context, individual):
    start_time_index = individual[0]
    start_minutes_from_week_start = start_time_index * MEETING_INCREMENT_MINUTES

    day_of_week = start_minutes_from_week_start // (24 * 60)
    minutes_in_day = start_minutes_from_week_start % (24 * 60)
    
    if not (SEARCH_SPACE_START_MINUTE <= minutes_in_day <= SEARCH_SPACE_END_MINUTE - context.duration_minutes):
        return (0,) 

    if not (0 <= day_of_week <= 4):
        return (0,)
    
    today = datetime.now().date()
    # This logic still points to the *next* week. 
    # Let's fix this to be the *current* week, as per our original spec.
    start_of_week = today - timedelta(days=today.weekday())
    
    potential_start = datetime.combine(start_of_week, time(0, 0)) + timedelta(days=day_of_week, minutes=minutes_in_day)
    potential_end = potential_start + timedelta(minutes=context.duration_minutes)

    # --- This is a subtle but important fix ---
    # We must make our *potential* time timezone-aware so it can be
    # compared with the database slots. We'll assume our server's local timezone.
    potential_start = timezone.make_aware(potential_start)
    potential_end = timezone.make_aware(potential_end)
    # --- End fix ---

    available_members = set()
    for (member_id, slot_start, slot_end) in context.availability_slots:
        
        # This comparison should now be correct as both are aware
        is_available = (slot_start <= potential_start and 
                        slot_end >= potential_end)
        
        if is_available:
            available_members.add(member_id)
            
    fitness_score = len(available_members) / context.member_count
    
    return (fitness_score,) # Return as a tuple


# --- 3. The Main GA Function ---
def run_genetic_scheduler(project_id, duration_hours):
    duration_minutes = int(duration_hours * 60)
    
    context = SchedulerContext(project_id, duration_minutes)
    if context.member_count == 0:
        return {"status": "error", "message": "No members in project."}

    random.seed(project_id) # Determinism!

    try:
        creator.create("FitnessMax", base.Fitness, weights=(1.0,))
        creator.create("Individual", list, fitness=creator.FitnessMax)
    except Exception as e:
        pass # Classes already created, this is fine

    toolbox = base.Toolbox()
    
    total_minutes_in_week = 5 * 24 * 60
    total_increments = total_minutes_in_week // MEETING_INCREMENT_MINUTES
    
    toolbox.register("attr_int", random.randint, 0, total_increments - 1)
    toolbox.register("individual", tools.initRepeat, creator.Individual, toolbox.attr_int, n=1)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_meeting_time, context)
    toolbox.register("mate", tools.cxUniform, indpb=0.5)
    toolbox.register("mutate", tools.mutUniformInt, low=0, up=total_increments - 1, indpb=0.1)
    toolbox.register("select", tools.selTournament, tournsize=3)

    pop = toolbox.population(n=POPULATION_SIZE)
    hof = tools.HallOfFame(1)
    
    algorithms.eaSimple(pop, toolbox, cxpb=CXPB, mutpb=MUTPB, ngen=GENERATIONS, halloffame=hof, verbose=False)
    
    best_individual = hof[0]
    best_fitness = best_individual.fitness.values[0]
    
    start_time_index = best_individual[0]
    start_minutes_from_week_start = start_time_index * MEETING_INCREMENT_MINUTES
    
    day_of_week = start_minutes_from_week_start // (24 * 60)
    minutes_in_day = start_minutes_from_week_start % (24 * 60)
    
    today = datetime.now().date()
    # Fixed to use start of *current* week
    start_of_week = today - timedelta(days=today.weekday())
    best_start_time = datetime.combine(start_of_week, time(0, 0)) + timedelta(days=day_of_week, minutes=minutes_in_day)
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