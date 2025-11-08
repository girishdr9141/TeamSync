# api/views.py

from django.contrib.auth.models import User # You already added this!
from django.contrib.auth import authenticate
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
from .models import Project, Task, AvailabilitySlot, EmployeeProfile
from . import algorithms

# --- Auth Views (You already built these!) ---

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
            # --- THIS IS THE FIX ---
            # We re-fetch the user object to make sure the 'profile'
            # is correctly joined and serialized.
            user_with_profile = User.objects.get(username=username)
            # --- END FIX ---
            
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'token': token.key,
                # We serialize the NEW user_with_profile object
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

# --- NEW VIEWS (Add everything below this line) ---

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated] # Only logged-in users can see projects

    def get_queryset(self):
        # This is a key step: only show projects that the logged-in user is a member of.
        return self.request.user.projects.all()
    
    def perform_create(self, serializer):
        """
        When a new project is created, automatically
        add the logged-in user as a member.
        """
        # 1. Save the project normally (with name, description)
        project = serializer.save()
        
        # 2. NOW, add the user who made the request to the 'members' list
        project.members.add(self.request.user)

    # --- ADD THIS NEW FUNCTION ---
    # This creates a new URL: /api/projects/{id}/run_assignment/

    
    @action(detail=True, methods=['post']) # 'detail=True' means it acts on a *single* project
    def run_assignment(self, request, pk=None):
        """
        Runs the SoSTA/Weighted Scoring task assignment algorithm
        for this project.
        """
        project = self.get_object() # This gets the project by its ID (pk)
        
        # Call our algorithm function
        result = algorithms.run_weighted_task_assignment(project.id)
        
        if result['status'] == 'error':
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(result, status=status.HTTP_200_OK)

    # --- ADD THIS NEW FUNCTION ---
    # This creates a new URL: /api/projects/{id}/run_scheduler/
    @action(detail=True, methods=['post'])
    def run_scheduler(self, request, pk=None):
        """
        Runs the Genetic Algorithm to find the best meeting time
        for this project.
        """
        project = self.get_object()
        
        # We'll expect the React app to send the duration in the POST request
        duration = request.data.get('duration_hours', 1) 
        
        # Call our algorithm function
        result = algorithms.run_genetic_scheduler(project.id, duration)
        
        if result['status'] == 'error':
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """
        Adds an employee to this project by their username.
        """
        project = self.get_object()
        username = request.data.get('username')

        if not username:
            return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Find the user we want to add
            user_to_add = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Add them to the project's member list
        project.members.add(user_to_add)
        
        # Return the updated project data
        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # --- ADD THIS NEW FUNCTION ---
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """
        Removes an employee from this project by their username.
        """
        project = self.get_object()
        username = request.data.get('username')

        if not username:
            return Response({'error': 'Username is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_to_remove = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Don't let a user remove themselves (or the last member)
        if user_to_remove == request.user:
            return Response({'error': 'You cannot remove yourself from a project.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if project.members.count() == 1:
            return Response({'error': 'You cannot remove the last member of a project.'}, status=status.HTTP_400_BAD_REQUEST)

        # Remove them from the project's member list
        project.members.remove(user_to_remove)
        
        # Return the updated project data
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
        # Only return tasks that belong to projects the user is a member of.
        return Task.objects.filter(project__members=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """
        Returns all tasks assigned to the currently logged-in user.
        """
        # 'detail=False' means this is on the main /api/tasks/ endpoint,
        # not a specific task.
        my_tasks = Task.objects.filter(assigned_to=request.user, status__in=['TODO', 'IN_PROGRESS'])
        serializer = self.get_serializer(my_tasks, many=True)
        return Response(serializer.data)

class AvailabilitySlotViewSet(viewsets.ModelViewSet):
    """
    API endpoint for creating, viewing, and deleting availability slots.
    """
    queryset = AvailabilitySlot.objects.all()
    serializer_class = AvailabilitySlotSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only show a user their *own* availability slots.
        return AvailabilitySlot.objects.filter(employee=self.request.user)

    def perform_create(self, serializer):
        # When a new slot is created, automatically assign it to the logged-in user.
        serializer.save(employee=self.request.user)

    @action(detail=False, methods=['post'])
    def clear_all(self, request):
        """
        Deletes all availability slots for the currently logged-in user.
        We use 'POST' because it's a destructive action.
        """
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

class EmployeeProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint to Get and Update the logged-in user's profile.
    """
    queryset = EmployeeProfile.objects.all()
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # This view doesn't take an ID.
        # It just finds the profile associated with the user making the request.
        return self.request.user.profile