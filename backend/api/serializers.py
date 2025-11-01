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
    # This 'profile' field will nest the EmployeeProfileSerializer inside the UserSerializer
    profile = EmployeeProfileSerializer(read_only=True)

    class Meta:
        model = User
        # These are the fields we will send back and forth
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    """
    A special serializer just for creating a new user.
    It includes a password field, which the default UserSerializer hides.
    """
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'first_name', 'last_name']

    def create(self, validated_data):
        # This function is called when we create a new user.
        # It properly hashes the password instead of saving it as plain text.
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        # We also create their blank EmployeeProfile at the same time.
        EmployeeProfile.objects.create(user=user)
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