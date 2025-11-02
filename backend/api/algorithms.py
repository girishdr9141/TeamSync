# api/algorithms.py

from .models import Project, Task, EmployeeProfile
from django.contrib.auth.models import User
import json # We'll need this to parse the data

# api/algorithms.py
# (Imports are the same)

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

        # Load all member profiles into memory. We will update the
        # 'current_workload' in this 'profiles' object *locally* as we go.
        profiles = {member.id: member.profile for member in members}
        
        assignments_made = []

        # 2. THE NEW GREEDY ASSIGNMENT LOGIC
        # Iterate through each task, one by one.
        for task in tasks:
            task_data = task.task_data
            required_skills = task_data.get('required_skills', [])
            task_category = task_data.get('category', '').lower()
            
            best_member = None
            lowest_cost = float('inf') # Start with an infinitely high cost

            # 3. THE SCORING ALGORITHM (Find best member for *this* task)
            for member in members:
                profile = profiles[member.id]
                profile_data = profile.profile_data
                
                # --- A. Calculate Skill Match Score ---
                skill_score = 0
                member_skills = profile_data.get('skills', {})
                if not required_skills:
                    skill_score = 1 # Base score if no skills are needed
                else:
                    for skill in required_skills:
                        skill_score += member_skills.get(skill, 0)
                
                # --- B. Calculate Preference Score ---
                preference_score = 0
                member_prefs = profile_data.get('preferences', {})
                if task_category:
                    preference_score = member_prefs.get(task_category, 0)
                
                # --- C. Calculate Workload Penalty ---
                # We use the *current* workload from our local 'profiles' object
                # This ensures the cost increases for each task we add!
                workload_penalty = profile.current_workload * 5 # (Workload penalty weight)
                
                # --- D. Calculate Final Cost ---
                final_cost = (workload_penalty) - (skill_score * 0.7) - (preference_score * 0.3)
                
                if final_cost < lowest_cost:
                    lowest_cost = final_cost
                    best_member = member
            
            # 4. ASSIGN THE TASK
            if best_member:
                # Assign in the database
                task.assigned_to = best_member
                task.status = 'IN_PROGRESS'
                task.save()

                # Update the workload *locally* for the *next* iteration of the loop
                profile = profiles[best_member.id]
                profile.current_workload += task.estimated_hours
                # We also save the final workload to the DB
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

# ... (leave run_genetic_scheduler as-is) ...
# --- Genetic Algorithm (We'll do this next) ---

def run_genetic_scheduler(project_id, meeting_duration_hours):
    
    print(f"--- Running GA Scheduler for Project {project_id} ---")
    
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