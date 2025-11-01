# api/algorithms.py

from .models import Project, Task, EmployeeProfile, AvailabilitySlot
from django.contrib.auth.models import User

def run_weighted_task_assignment(project_id):
    """
    This is where the SoSTA (Weighted Scoring) logic will live.
    It will:
    1. Fetch all unassigned tasks for the project.
    2. Fetch all members and their EmployeeProfiles (skills, preferences, workload).
    3. Calculate the "utility score" for every possible (employee, task) pair.
    4. Assign each task to the best employee based on the score (like the SoSTA paper).
    5. Update the 'assigned_to' and 'current_workload' fields in the database.
    """
    
    print(f"--- Running Task Assignment for Project {project_id} ---")
    
    # --- For Now: A DUMMY algorithm ---
    # We'll just find the first task and assign it to the first member.
    try:
        project = Project.objects.get(id=project_id)
        first_task = project.tasks.filter(assigned_to=None).first()
        first_member = project.members.first()

        if first_task and first_member:
            first_task.assigned_to = first_member
            first_task.status = 'IN_PROGRESS'
            first_task.save()
            print(f"Assigned '{first_task.title}' to '{first_member.username}'")
            return {"status": "success", "message": f"Assigned {first_task.title} to {first_member.username}"}
        else:
            print("No tasks to assign or no members in project.")
            return {"status": "no_op", "message": "No tasks to assign or no members in project"}
            
    except Exception as e:
        print(f"Error in dummy assignment: {e}")
        return {"status": "error", "message": str(e)}

def run_genetic_scheduler(project_id, meeting_duration_hours):
    """
    This is where the Genetic Algorithm (GA) for scheduling will live.
    It will:
    1. Fetch all members of the project.
    2. Get all 'AvailabilitySlot' objects for each member.
    3. Initialize a 'population' of random meeting times (the GA).
    4. Run the 'evolution' (selection, crossover, mutation).
    5. The 'fitness function' will score each time based on how many members are free.
    6. Return the "fittest" time slot.
    """
    
    print(f"--- Running GA Scheduler for Project {project_id} ---")
    print(f"Requested meeting duration: {meeting_duration_hours} hours")
    
    # --- For Now: A DUMMY algorithm ---
    # We'll just find the project members and return a fake time.
    try:
        project = Project.objects.get(id=project_id)
        member_count = project.members.count()
        
        # This will be the output of our *real* GA
        best_slot_found = {
            "start_time": "2025-11-05T10:00:00Z",
            "end_time": "2025-11-05T11:00:00Z",
            "attendees_count": member_count,
            "fitness_score": 1.0 # (1.0 = 100% attendance)
        }
        
        return {"status": "success", "best_slot": best_slot_found}
        
    except Exception as e:
        print(f"Error in dummy scheduler: {e}")
        return {"status": "error", "message": str(e)}