# api/views.py

from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone # --- V2.0: Needed for deadline checks ---
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .models import Project, Task, AvailabilitySlot, EmployeeProfile
from .serializers import (
    RegisterSerializer, UserSerializer, ProjectSerializer, 
    TaskSerializer, AvailabilitySlotSerializer, EmployeeProfileSerializer,ProfileUpdateSerializer
)
from . import algorithms
from .utils import DateCalculator # --- V2.0: Import our new utility ---

# --- Auth Views (No Changes) ---

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            user_with_profile = User.objects.get(username=username)
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                'user': UserSerializer(user_with_profile).data
            })
        else:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

# --- ProjectViewSet (Modified) ---

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.projects.all()
    
    # --- V2.0 MODIFICATION ---
    # We now set the 'leader' on creation.
    def perform_create(self, serializer):
        """
        When a new project is created, automatically
        add the logged-in user as a member AND set them as the leader.
        """
        # 1. Save the project, passing the user as the leader
        project = serializer.save(leader=self.request.user)
        
        # 2. Add the user (now leader) to the 'members' list
        project.members.add(self.request.user)

    # --- (No changes to your @actions: run_assignment, run_scheduler, add_member, remove_member) ---
    
    @action(detail=True, methods=['post'])
    def run_assignment(self, request, pk=None):
        project = self.get_object()
        result = algorithms.run_weighted_task_assignment(project.id)
        if result['status'] == 'error':
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def run_scheduler(self, request, pk=None):
        project = self.get_object()
        duration = request.data.get('duration_hours', 1) 
        result = algorithms.run_genetic_scheduler(project.id, duration)
        if result['status'] == 'error':
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_to_add = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        project.members.add(user_to_add)
        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        project = self.get_object()
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_to_remove = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user_to_remove == request.user:
            return Response({'error': 'You cannot remove yourself from a project.'}, status=status.HTTP_400_BAD_REQUEST)
        if project.members.count() == 1:
            return Response({'error': 'You cannot remove the last member of a project.'}, status=status.HTTP_400_BAD_REQUEST)
        project.members.remove(user_to_remove)
        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tasks to be viewed or edited.
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(project__members=self.request.user)
    
    # --- V2.0 NEW METHOD (Permission Check) ---
    def create(self, request, *args, **kwargs):
        """
        Intercepts the 'create' action to add a permission check.
        Only the Project Leader can create tasks.
        """
        # 1. Get the project ID from the incoming data
        project_id = request.data.get('project')
        if not project_id:
            return Response({"error": "Project ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # 2. Get the project object
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # 3. *** THE V2.0 PERMISSION CHECK ***
        if project.leader != request.user:
            return Response(
                {"error": "Only the project leader can add tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 4. If the check passes, proceed with creation as normal
        return super().create(request, *args, **kwargs)

    # --- V4.0 NEW METHOD (Permission Check) ---
    def destroy(self, request, *args, **kwargs):
        """
        Intercepts the 'delete' action to add a permission check.
        Only the Project Leader can delete tasks.
        """
        # 1. Get the task object
        task = self.get_object()
        
        # 2. Get the project from the task
        project = task.project
        
        # 3. *** THE V4.0 PERMISSION CHECK ***
        if project.leader != request.user:
            return Response(
                {"error": "Only the project leader can delete tasks."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # 4. If the check passes, proceed with deletion as normal
        return super().destroy(request, *args, **kwargs)
    # --- END V4.0 ---

    # --- V2.0 NEW @ACTION (75% Rule) ---
    @action(detail=True, methods=['post'])
    def set_progress(self, request, pk=None):
        """
        Allows the assigned user to update the progress of their task.
        Implements the "75% Rule" for deadline extensions.
        """
        task = self.get_object()
        user = request.user
        
        # 1. Permission Check: Only the assigned user can update progress
        if task.assigned_to != user:
            return Response(
                {"error": "You are not assigned to this task."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # 2. Get and validate new progress value
        new_progress = request.data.get('progress')
        try:
            new_progress = int(new_progress)
            if new_progress not in [0, 25, 50, 75, 100]:
                raise ValueError()
        except (TypeError, ValueError):
            return Response(
                {"error": "Invalid progress value. Must be one of: 0, 25, 50, 75, 100."},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_progress = task.progress
        extension_message = ""
        
        # 3. --- The "75% Rule" Logic ---
        # Check if...
        #   a) The task has a deadline set
        #   b) We are crossing the 75% threshold for the *first time*
        #   c) It is *before* the original deadline
        if (task.due_date and 
            old_progress < 75 and 
            new_progress >= 75 and 
            timezone.now() < task.due_date):
            
            # Calculate extension (20% of estimated hours)
            extension_hours = task.estimated_hours * 0.20
            
            # Use our new utility to add *business hours*
            calculator = DateCalculator()
            # We extend from the *original* due date
            new_due_date = calculator.add_business_hours(task.due_date, extension_hours)
            
            task.due_date = new_due_date
            extension_message = (
                f"Bonus! Deadline extended by {extension_hours:.1f} "
                f"business hours to {new_due_date.strftime('%Y-%m-%d %H:%M')}."
            )
        
        # 4. Update task status and progress
        task.progress = new_progress
        if new_progress == 100:
            task.status = 'DONE'
        elif task.status == 'TODO':
            task.status = 'IN_PROGRESS'
        
        task.save()
        
        # 5. Return response
        response_data = TaskSerializer(task).data
        if extension_message:
            # Add our bonus message to the response
            response_data['message'] = extension_message
            
        return Response(response_data, status=status.HTTP_200_OK)

    # --- (No changes to your @action: my_tasks) ---
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        my_tasks = Task.objects.filter(assigned_to=request.user, status__in=['TODO', 'IN_PROGRESS'])
        serializer = self.get_serializer(my_tasks, many=True)
        return Response(serializer.data)

# --- AvailabilitySlotViewSet (No Changes) ---
class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AvailabilitySlot.objects.filter(employee=self.request.user)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        try:
            slots = AvailabilitySlot.objects.filter(employee=request.user)
            count = slots.count()
            slots.delete()
            return Response(
                {"status": "success", "message": f"Deleted {count} slots."},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"status": "error", "message": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# --- EmployeeProfileView (No Changes) ---
class EmployeeProfileView(generics.RetrieveUpdateAPIView):
    queryset = EmployeeProfile.objects.all()
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user.profile