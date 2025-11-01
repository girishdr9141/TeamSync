# api/views.py

from django.contrib.auth.models import User # You already added this!
from django.contrib.auth import authenticate
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from .serializers import (
    RegisterSerializer, UserSerializer, ProjectSerializer, 
    TaskSerializer, AvailabilitySlotSerializer, EmployeeProfileSerializer
)
from .models import Project, Task, AvailabilitySlot, EmployeeProfile

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
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
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

class ProjectViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows projects to be viewed or edited.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.projects.all()

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