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
        fields = ['profile_data', 'current_workload']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the built-in User model.
    We include the 'profile' we just defined.
    """
    # This will now nest the full profile object on read.
    profile = EmployeeProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    """
    A special serializer just for creating a new user.
    """
    # We're manually adding the profile_data field
    profile_data = serializers.JSONField(write_only=True, required=False, default=dict)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name', 'profile_data']

    def create(self, validated_data):
        # Pop the profile data out of the main user data
        profile_data = validated_data.pop('profile_data')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Create the profile and pass in the profile_data
        EmployeeProfile.objects.create(user=user, profile_data=profile_data)
        return user

# --- Project & Task Serializers ---

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for the Task model.
    """
    class Meta:
        model = Task
        fields = '__all__' # Includes all fields: project, title, assigned_to, etc.

class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for the Project model.
    """
    # This nests all related tasks inside the project's JSON.
    tasks = TaskSerializer(many=True, read_only=True)
    # This shows the usernames of all members.
    members = serializers.StringRelatedField(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'members', 'tasks']


# --- Scheduling Serializer ---

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    """
    Serializer for the AvailabilitySlot model.
    """
    # We'll make 'employee' hidden on create, and set it to the logged-in user automatically.
    employee = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = ['id', 'employee', 'start_time', 'end_time']