# We'll use the built-in User model for logins
from django.contrib.auth.models import User 
from django.db import models

# --- Model 1: EmployeeProfile ---
# Extends the built-in User to store AI-specific data
class EmployeeProfile(models.Model):
    # This links the profile to a specific user.
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    
    # We use a JSONField because it's flexible. This is for the SoSTA algorithm.
    # This will store data like:
    # { "skills": {"Python": 5, "React": 4, "Public Speaking": 3},
    #   "preferences": {"Frontend": 5, "Documentation": 1, "Backend": 3} }
    profile_data = models.JSONField(default=dict)
    
    # This tracks the total 'estimated_hours' of tasks assigned to this employee.
    current_workload = models.IntegerField(default=0) 

    def __str__(self):
        return f"{self.user.username}'s Profile"

# --- Model 2: Project ---
# The top-level container for tasks and teams
class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # A project can have many employees, and an employee can be on many projects
    members = models.ManyToManyField(User, related_name="projects")

    def __str__(self):
        return self.name

# --- Model 3: Task ---
# The core item our SoSTA algorithm will assign
class Task(models.Model):
    project = models.ForeignKey(Project, related_name="tasks", on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # This field is the "answer" from our algorithm.
    # It's 'null' until the SoSTA algorithm runs and assigns someone.
    assigned_to = models.ForeignKey(User, related_name="tasks", null=True, blank=True, on_delete=models.SET_NULL)
    
    # --- Data FOR the SoSTA Algorithm ---
    
    # The 'workload' part of your weighted score
    estimated_hours = models.IntegerField(default=1) 
    
    # Stores what the task needs. Our algorithm will read this.
    # EXAMPLE:
    # { "required_skills": ["Python", "React"],
    #   "category": "Frontend" }
    task_data = models.JSONField(default=dict)
    
    STATUS_CHOICES = [
        ('TODO', 'To Do'),
        ('IN_PROGRESS', 'In Progress'),
        ('DONE', 'Done'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='TODO')

    def __str__(self):
        return self.title

# --- Model 4: AvailabilitySlot ---
# This stores the "free time" data for our Genetic Algorithm
class AvailabilitySlot(models.Model):
    employee = models.ForeignKey(User, related_name="availability_slots", on_delete=models.CASCADE)
    
    # The start and end of a single "free" block of time
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return f"{self.employee.username} | {self.start_time.strftime('%Y-%m-%d %H:%M')}"
