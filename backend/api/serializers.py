# api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import EmployeeProfile, Project, Task, AvailabilitySlot

# --- User & Profile Serializers ---

class EmployeeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the EmployeeProfile model.
    """
    class Meta:
        model = EmployeeProfile
        # --- V2.0: Added 'strike_count' ---
        fields = ['profile_data', 'current_workload', 'strike_count']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the built-in User model.
    We include the 'profile' we just defined.
    """
    profile = EmployeeProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    """
    A special serializer just for creating a new user.
    (No V2.0 changes needed here, defaults are correct)
    """
    profile_data = serializers.JSONField(write_only=True, required=False, default=dict)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'profile_data']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile_data')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # 'strike_count' will correctly default to 0
        EmployeeProfile.objects.create(user=user, profile_data=profile_data)
        return user

# --- Project & Task Serializers ---

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for the Task model.
    """
    assigned_to = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Task
        # --- V2.0: Added 'progress' and 'due_date' ---
        # These are now required for our frontend dashboards.
        fields = [
            'id', 'project', 'title', 'description', 
            'assigned_to', 'estimated_hours', 'task_data', 'status',
            'progress', 'due_date' # <-- V2.0 FIELDS ADDED
        ]

class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for the Project model.
    """
    tasks = TaskSerializer(many=True, read_only=True)
    members = serializers.StringRelatedField(many=True, read_only=True)

    # --- V2.0: Added 'leader' (ID) and 'leader_username' (string) ---
    
    # 'leader' will return the ID. This is what our frontend needs
    # for the permission check (loggedInUser.id === project.leader)
    leader = serializers.PrimaryKeyRelatedField(read_only=True)
    
    # 'leader_username' will return the string. This is what our frontend
    # needs to display the "(Leader)" badge in the members list.
    leader_username = serializers.StringRelatedField(source='leader')
    # --- END V2.0 ---

    class Meta:
        model = Project
        # --- V2.0: Added 'leader' and 'leader_username' to fields ---
        fields = [
            'id', 'name', 'description', 
            'leader', 'leader_username', # <-- V2.0 FIELDS ADDED
            'members', 'tasks'
        ]


# --- Scheduling Serializer ---

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    """
    Serializer for the AvailabilitySlot model.
    (No V2.0 changes needed)
    """
    employee = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = ['id', 'employee', 'start_time', 'end_time']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        # --- V2.0: CRITICAL SECURITY FIX ---
        # We must not allow a user to update their own workload or strike count.
        # Those are managed by the system.
        fields = ['profile_data']