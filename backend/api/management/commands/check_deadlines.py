# In api/management/commands/check_deadlines.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Task, EmployeeProfile

class Command(BaseCommand):
    help = 'Checks for overdue tasks, updates their status, and assigns strikes to users.'

    def handle(self, *args, **options):
        """
        The main logic of our "cron job".
        This function will be run every time the command is executed.
        """
        
        # Get the current time, so we have a single point of reference.
        now = timezone.now()
        
        self.stdout.write(f"[{now.isoformat()}] --- Running Deadline Check ---")
        
        # 1. Find all tasks that are overdue.
        #    - due_date is in the past (less than 'now')
        #    - status is NOT 'DONE' and NOT 'OVERDUE'
        # This is the critical query. We don't want to give strikes for
        # tasks that are already done or already marked overdue.
        overdue_tasks = Task.objects.filter(
            due_date__lt=now,
            status__in=['IN_PROGRESS', 'TODO']
        )
        
        if not overdue_tasks.exists():
            self.stdout.write("No overdue tasks found. All clear!")
            self.stdout.write("------------------------------------")
            return

        self.stdout.write(f"Found {overdue_tasks.count()} overdue tasks to process...")
        
        strikes_assigned = 0
        
        # 2. Loop through each overdue task and assign a strike
        for task in overdue_tasks:
            if task.assigned_to:
                try:
                    # Get the profile of the user assigned to this task
                    profile = task.assigned_to.profile
                    
                    # Increment their strike count
                    profile.strike_count += 1
                    profile.save()
                    
                    # 3. CRITICAL STEP: Update the task status to 'OVERDUE'
                    # This prevents this task from being processed again tomorrow,
                    # which would give the user a new strike every day for one task.
                    task.status = 'OVERDUE'
                    task.save()
                    
                    self.stdout.write(self.style.WARNING(
                        f"  > STRIKE: '{task.title}' (Assigned to: {task.assigned_to.username}) "
                        f"is overdue. User now has {profile.strike_count} strike(s)."
                    ))
                    strikes_assigned += 1
                    
                except EmployeeProfile.DoesNotExist:
                    self.stdout.write(self.style.ERROR(
                        f"  > ERROR: Could not find profile for user {task.assigned_to.username}."
                    ))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(
                        f"  > ERROR: A processing error occurred for task {task.id}: {e}"
                    ))
            
        self.stdout.write(f"--- Check Complete. {strikes_assigned} strike(s) assigned. ---")