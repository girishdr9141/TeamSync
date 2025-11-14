# api/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import EmployeeProfile, Project, Task, AvailabilitySlot

# --- V4.0 IMPORTS ---
# We need these for our dynamic workload calculation
from django.db.models import Sum, F, FloatField 
from django.db.models.functions import Coalesce
# --- END V4.0 IMPORTS ---

# --- User & Profile Serializers ---

class EmployeeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the EmployeeProfile model.
    Used for the main /api/auth/user endpoint.
    """
    # --- V4.0 DYNAMIC WORKLOAD ---
    # We are adding a new, calculated field to show the user's
    # real-time remaining workload.
    remaining_workload = serializers.SerializerMethodField()
    # --- END V4.0 ---

    class Meta:
        model = EmployeeProfile
        # --- V4.0 CHANGE ---
        # 'current_workload' is REMOVED.
        # 'remaining_workload' is ADDED.
        fields = ['profile_data', 'strike_count', 'remaining_workload']

    def get_remaining_workload(self, obj):
        """
        [V4.0] Calculates the total remaining work for a user
        based on their assigned, incomplete tasks.
        'obj' is the EmployeeProfile instance.
        """
        user = obj.user
        
        # This is the same logic from our algorithm.py
        workload_aggregate = Task.objects.filter(
            assigned_to=user,
            progress__lt=100  # Only tasks that are not 100% done
        ).aggregate(
            total_remaining_work=Coalesce(
                Sum(
                    # Formula: hours * (1 - (progress / 100))
                    F('estimated_hours') * (1.0 - F('progress') / 100.0),
                    output_field=FloatField()
                ),
                0.0  # Default to 0.0 if user has no tasks
            )
        )
        return workload_aggregate['total_remaining_work']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the built-in User model.
    (No changes needed, it automatically uses the updated EmployeeProfileSerializer)
    """
    profile = EmployeeProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']


class RegisterSerializer(serializers.ModelSerializer):
    """
    A special serializer just for creating a new user.
    (No V4.0 changes needed here, our models.py change was sufficient)
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
        
        # This is correct. 'strike_count' defaults to 0
        # and 'current_workload' is gone.
        EmployeeProfile.objects.create(user=user, profile_data=profile_data)
        return user

# --- Project & Task Serializers ---

class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for the Task model.
    (No V4.0 changes needed, V2.0 was sufficient)
    """
    assigned_to = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 
            'assigned_to', 'estimated_hours', 'task_data', 'status',
            'progress', 'due_date'
        ]

# --- V4.0: NEW SERIALIZERS FOR LEADER DASHBOARD ---
# We need to create a new set of serializers to power
# the leader dashboard, which shows all members and their
# individual tasks, progress, and workloads.

class DashboardTaskSerializer(serializers.ModelSerializer):
    """
    [V4.0] A lightweight task serializer for the Leader Dashboard.
    We only include the fields the dashboard needs to show
    in the member's task list.
    """
    class Meta:
        model = Task
        fields = ['id', 'title', 'estimated_hours', 'progress', 'status', 'due_date']


class DashboardMemberSerializer(serializers.ModelSerializer):
    """
    [V4.0] Serializer for a *member* on the Leader Dashboard.
    This serializes the User object and adds profile/task data.
    """
    # 1. Get strike_count from the related profile
    strike_count = serializers.IntegerField(source='profile.strike_count', read_only=True)
    
    # 2. Add the calculated remaining_workload
    remaining_workload = serializers.SerializerMethodField()
    
    # 3. Add the list of tasks *for this project*
    tasks = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'strike_count', 'remaining_workload', 'tasks']

    def get_remaining_workload(self, obj):
        """
        'obj' is the User instance.
        We re-use the same workload calculation logic.
        """
        workload_aggregate = Task.objects.filter(
            assigned_to=obj,
            progress__lt=100
        ).aggregate(
            total_remaining_work=Coalesce(
                Sum(
                    F('estimated_hours') * (1.0 - F('progress') / 100.0),
                    output_field=FloatField()
                ),
                0.0
            )
        )
        return workload_aggregate['total_remaining_work']

    def get_tasks(self, obj):
        """
        'obj' is the User instance.
        We need to get the tasks assigned to this user, but *only*
        for the project we are currently serializing.
        
        We get the project from the 'context' which
        we will pass in from the ProjectSerializer.
        """
        project = self.context.get('project')
        if not project:
            return []
        
        # Filter tasks for this user AND this project
        project_tasks = Task.objects.filter(assigned_to=obj, project=project)
        
        # Serialize them using our new lightweight dashboard serializer
        return DashboardTaskSerializer(project_tasks, many=True).data

# --- END V4.0 NEW SERIALIZERS ---


class ProjectSerializer(serializers.ModelSerializer):
    """
    Serializer for the Project model.
    [V4.0] This is now the main serializer for the ProjectPage,
    powering both the "Unassigned Tasks" list and the "Leader Dashboard".
    """
    # This field shows ALL tasks for the project, which our frontend
    # will filter to show the "Unassigned Tasks" (assigned_to=null)
    tasks = TaskSerializer(many=True, read_only=True)
    
    # --- V4.0 LEADER DASHBOARD UPGRADE ---
    # 'members' is no longer a simple StringRelatedField.
    # It now uses our new DashboardMemberSerializer to provide
    # the rich data needed for the dashboard UI.
    members = DashboardMemberSerializer(many=True, read_only=True)
    # --- END V4.0 ---

    leader = serializers.PrimaryKeyRelatedField(read_only=True)
    leader_username = serializers.StringRelatedField(source='leader')

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 
            'leader', 'leader_username', 
            'members', # <-- UPGRADED FOR V4.0
            'tasks'    # <-- Used for "Unassigned Tasks"
        ]

    def to_representation(self, instance):
        """
        [V4.0] We override this method to inject the 'project'
        instance into the context of the DashboardMemberSerializer.
        This is *required* so that 'get_tasks' method knows
        which project to filter by.
        """
        # Get the standard data representation
        data = super().to_representation(instance)
        
        # The 'members' field in 'data' was serialized *without*
        # the project context. We must re-serialize it manually.
        
        # 1. Create a copy of the current context
        context = self.context.copy()
        # 2. Inject the project instance ('instance' is the project)
        context['project'] = instance 
        
        # 3. Re-serialize the 'members' field using our new context
        #    (We add .select_related('profile') for optimization
        #    to prevent N+1 queries on profile.strike_count)
        member_serializer = DashboardMemberSerializer(
            instance.members.all().select_related('profile'), 
            many=True, 
            context=context
        )
        
        # 4. Overwrite the 'members' key in the final data
        data['members'] = member_serializer.data
        return data


# --- Scheduling Serializer ---

class AvailabilitySlotSerializer(serializers.ModelSerializer):
    """
    Serializer for the AvailabilitySlot model.
    (No V4.0 changes needed)
    """
    employee = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = AvailabilitySlot
        fields = ['id', 'employee', 'start_time', 'end_time']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmployeeProfile
        # (No V4.0 changes needed, this is still correct)
        fields = ['profile_data']