# api/admin.py
from django.contrib import admin
from .models import EmployeeProfile, Project, Task, AvailabilitySlot

# This tells the admin site to show these models
admin.site.register(EmployeeProfile)
admin.site.register(Project)
admin.site.register(Task)
admin.site.register(AvailabilitySlot)